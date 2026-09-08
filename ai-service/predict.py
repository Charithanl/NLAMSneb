"""Run a validated prediction with the trained NLAMS XGBoost pipeline."""

from __future__ import annotations

import argparse
import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from xgboost import DMatrix


SERVICE_ROOT = Path(__file__).resolve().parent
MODELS_DIR = SERVICE_ROOT / "models"


@lru_cache(maxsize=1)
def load_artifacts() -> tuple[Any, dict[str, Any]]:
    model = joblib.load(MODELS_DIR / "nlams_delay_model_xgb.joblib")
    metadata = json.loads((MODELS_DIR / "model_metadata.json").read_text(encoding="utf-8"))
    return model, metadata


def validate_payload(payload: dict[str, Any], features: list[str]) -> pd.DataFrame:
    unknown = sorted(set(payload).difference(features))
    missing = sorted(set(features).difference(payload))
    if unknown:
        raise ValueError(f"Unknown fields: {', '.join(unknown)}")
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    frame = pd.DataFrame([payload], columns=features)
    for feature in features:
        if frame.at[0, feature] is None:
            raise ValueError(f"{feature} cannot be null")
    return frame


def source_feature_name(encoded_name: str, raw_features: list[str]) -> str:
    name = encoded_name.split("__", maxsplit=1)[-1]
    for feature in raw_features:
        if name == feature or name.startswith(f"{feature}_"):
            return feature
    return name


def predict_delay(payload: dict[str, Any]) -> dict[str, Any]:
    return predict_delays([payload])[0]


def predict_delays(payloads: list[dict[str, Any]]) -> list[dict[str, Any]]:
    model, metadata = load_artifacts()
    features = metadata["features"]
    if not payloads:
        raise ValueError("At least one feature object is required.")
    frame = pd.concat([validate_payload(payload, features) for payload in payloads], ignore_index=True)
    probabilities = model.predict_proba(frame)[:, 1]
    preprocessor = model.named_steps["preprocess"]
    classifier = model.named_steps["model"]
    transformed = preprocessor.transform(frame)
    contribution_rows = classifier.get_booster().predict(DMatrix(transformed), pred_contribs=True)[:, :-1]
    feature_names = preprocessor.get_feature_names_out()
    threshold = float(metadata["evaluation"]["decision_threshold"])
    predictions: list[dict[str, Any]] = []
    for probability, contributions in zip(probabilities, contribution_rows, strict=True):
        grouped_contributions: dict[str, float] = {}
        for name, contribution in zip(feature_names, contributions, strict=True):
            source = source_feature_name(name, features)
            grouped_contributions[source] = grouped_contributions.get(source, 0.0) + float(contribution)
        ranked = sorted(grouped_contributions.items(), key=lambda item: item[1], reverse=True)
        top_risk_factors = [
            {"feature": feature, "contribution": round(contribution, 4)}
            for feature, contribution in ranked[:5]
            if contribution > 0
        ]
        predictions.append(
            {
                "delay_probability": round(float(probability), 4),
                "risk_score": round(float(probability) * 100),
                "risk_level": "HIGH" if probability >= threshold else "LOW",
                "decision_threshold": threshold,
                "top_risk_factors": top_risk_factors,
                "confidence": None,
                "confidence_note": "Not reported: the model is not probability-calibrated because the synthetic dataset has only nine delayed records.",
                "model_version": metadata["model_version"],
                "disclaimer": metadata["disclaimer"],
            }
        )
    return predictions


def main() -> None:
    parser = argparse.ArgumentParser(description="Predict NLAMS acquisition delay risk from a JSON feature object.")
    parser.add_argument("--input", type=Path, required=True, help="Path to a JSON object containing all required features.")
    args = parser.parse_args()
    payload = json.loads(args.input.read_text(encoding="utf-8"))
    print(json.dumps(predict_delay(payload), indent=2))


if __name__ == "__main__":
    main()
