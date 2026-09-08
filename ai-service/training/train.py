"""Train the NLAMS synthetic acquisition-delay model.

The training data is synthetic and this model is for demonstration only. It must
not be used to make land-acquisition decisions without validation on authorized
historical data.
"""

from __future__ import annotations

import argparse
import json
import logging
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold, cross_val_predict, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier

LOGGER = logging.getLogger("nlams.train")
RANDOM_STATE = 42
MODEL_VERSION = "NLAMS-DELAY-RISK-XGB-v1.0"
DISCLAIMER = (
    "Dataset B is synthetic data created for model development and demonstration. "
    "Model performance on this dataset does not represent validated performance "
    "on historical government land-acquisition data."
)

TARGET = "delayed_flag"
NUMERIC_FEATURES = [
    "land_required_hectares",
    "parcel_count",
    "land_owner_count",
    "affected_families",
    "displaced_families",
    "objections_count",
    "hearings_count",
    "court_case_count",
    "compensation_assessed_inr",
    "compensation_disbursed_inr",
    "compensation_pending_inr",
    "rr_assessed_inr",
    "rr_disbursed_inr",
    "land_record_digitization_rate",
    "estimated_duration_days",
]
CATEGORICAL_FEATURES = ["state_ut", "district", "project_type", "applicable_act", "current_stage"]
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
REQUIRED_COLUMNS = set(FEATURES + [TARGET, "record_id", "project_id", "delay_risk_score", "data_provenance"])


def parse_args() -> argparse.Namespace:
    repository_root = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description="Train the NLAMS XGBoost delay-risk model.")
    parser.add_argument(
        "--dataset",
        type=Path,
        default=repository_root / "NLAMS_Dataset_A_FINAL_WITH_SYNTHETIC_DEMO" / "processed" / "synthetic_acquisition_demo.csv",
    )
    parser.add_argument("--output-dir", type=Path, default=repository_root / "ai-service")
    return parser.parse_args()


def validate_dataset(data: pd.DataFrame) -> dict[str, Any]:
    missing = sorted(REQUIRED_COLUMNS.difference(data.columns))
    if missing:
        raise ValueError(f"Dataset is missing required columns: {', '.join(missing)}")

    target_values = set(pd.to_numeric(data[TARGET], errors="coerce").dropna().astype(int).unique())
    if not target_values.issubset({0, 1}) or len(target_values) < 2:
        raise ValueError("delayed_flag must contain both binary classes 0 and 1.")

    numeric_nulls = data[NUMERIC_FEATURES].apply(pd.to_numeric, errors="coerce").isna().sum().to_dict()
    compensation_difference = (
        pd.to_numeric(data["compensation_assessed_inr"], errors="coerce")
        - pd.to_numeric(data["compensation_disbursed_inr"], errors="coerce")
        - pd.to_numeric(data["compensation_pending_inr"], errors="coerce")
    )
    return {
        "rows": len(data),
        "duplicate_record_ids": int(data["record_id"].duplicated().sum()),
        "target_distribution": data[TARGET].value_counts().sort_index().astype(int).to_dict(),
        "numeric_missing_values": numeric_nulls,
        "compensation_reconciliation_exceptions": int((compensation_difference.abs() > 1).sum()),
        "provenance": sorted(data["data_provenance"].dropna().unique().tolist()),
        "leakage_excluded": {
            "delay_risk_score": "Pre-existing delay-risk field; excluded to avoid target leakage.",
            "record_id": "Record identifier; excluded.",
            "project_id": "Project identifier; excluded because each project has one record.",
        },
    }


def build_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("numeric", Pipeline([("scale", StandardScaler())]), NUMERIC_FEATURES),
            ("categorical", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )


def build_xgboost(scale_pos_weight: float) -> Pipeline:
    return Pipeline(
        steps=[
            ("preprocess", build_preprocessor()),
            (
                "model",
                XGBClassifier(
                    objective="binary:logistic",
                    eval_metric="logloss",
                    tree_method="hist",
                    random_state=RANDOM_STATE,
                    n_jobs=-1,
                    scale_pos_weight=scale_pos_weight,
                ),
            ),
        ]
    )


def calculate_metrics(y_true: pd.Series, probabilities: np.ndarray, threshold: float) -> dict[str, float]:
    predictions = (probabilities >= threshold).astype(int)
    return {
        "accuracy": round(float(accuracy_score(y_true, predictions)), 4),
        "precision": round(float(precision_score(y_true, predictions, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, predictions, zero_division=0)), 4),
        "f1": round(float(f1_score(y_true, predictions, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_true, probabilities)), 4),
        "pr_auc": round(float(average_precision_score(y_true, probabilities)), 4),
        "brier_score": round(float(brier_score_loss(y_true, probabilities)), 4),
    }


def choose_threshold(y_true: pd.Series, probabilities: np.ndarray) -> float:
    precision, recall, thresholds = precision_recall_curve(y_true, probabilities)
    if len(thresholds) == 0:
        return 0.5
    f2 = (5 * precision[:-1] * recall[:-1]) / np.maximum(4 * precision[:-1] + recall[:-1], 1e-12)
    return round(float(thresholds[int(np.nanargmax(f2))]), 4)


def write_plots(y_true: pd.Series, probabilities: np.ndarray, matrix: np.ndarray, importances: pd.DataFrame, reports_dir: Path) -> None:
    plt.figure(figsize=(5, 4))
    plt.imshow(matrix, cmap="Blues")
    plt.title("NLAMS delay prediction confusion matrix")
    plt.xticks([0, 1], ["On time", "Delayed"])
    plt.yticks([0, 1], ["On time", "Delayed"])
    for row in range(2):
        for column in range(2):
            plt.text(column, row, str(matrix[row, column]), ha="center", va="center")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    plt.savefig(reports_dir / "confusion_matrix.png", dpi=160)
    plt.close()

    false_positive_rate, true_positive_rate, _ = roc_curve(y_true, probabilities)
    plt.figure(figsize=(5, 4))
    plt.plot(false_positive_rate, true_positive_rate, label="XGBoost")
    plt.plot([0, 1], [0, 1], "--", color="grey")
    plt.xlabel("False positive rate")
    plt.ylabel("True positive rate")
    plt.title("NLAMS delay prediction ROC curve")
    plt.legend()
    plt.tight_layout()
    plt.savefig(reports_dir / "roc_curve.png", dpi=160)
    plt.close()

    top_importances = importances.head(15).iloc[::-1]
    plt.figure(figsize=(8, 6))
    plt.barh(top_importances["feature"], top_importances["importance"], color="#2563eb")
    plt.xlabel("Permutation importance")
    plt.title("NLAMS XGBoost feature importance")
    plt.tight_layout()
    plt.savefig(reports_dir / "feature_importance.png", dpi=160)
    plt.close()


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    args = parse_args()
    data = pd.read_csv(args.dataset)
    quality_report = validate_dataset(data)
    LOGGER.info("Loaded %s records from %s", len(data), args.dataset)

    X = data[FEATURES].copy()
    for feature in NUMERIC_FEATURES:
        X[feature] = pd.to_numeric(X[feature], errors="coerce").fillna(X[feature].median())
    X[CATEGORICAL_FEATURES] = X[CATEGORICAL_FEATURES].fillna("Unknown").astype(str)
    y = pd.to_numeric(data[TARGET], errors="raise").astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.33, random_state=RANDOM_STATE, stratify=y
    )
    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=RANDOM_STATE)
    scale_pos_weight = float((y_train == 0).sum() / (y_train == 1).sum())

    baseline = Pipeline(
        steps=[
            ("preprocess", build_preprocessor()),
            ("model", DummyClassifier(strategy="prior")),
        ]
    )
    xgboost = build_xgboost(scale_pos_weight)
    search = RandomizedSearchCV(
        estimator=xgboost,
        param_distributions={
            "model__n_estimators": [80, 120, 180, 240],
            "model__max_depth": [2, 3, 4, 5],
            "model__learning_rate": [0.03, 0.05, 0.08, 0.12],
            "model__subsample": [0.7, 0.85, 1.0],
            "model__colsample_bytree": [0.7, 0.85, 1.0],
            "model__min_child_weight": [1, 2, 4],
            "model__reg_lambda": [1.0, 2.0, 5.0],
        },
        n_iter=12,
        scoring="average_precision",
        cv=cv,
        refit=True,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    search.fit(X_train, y_train)
    # scikit-learn's stubs cannot preserve the concrete Pipeline type through
    # RandomizedSearchCV, so Pylance otherwise marks valid estimator members
    # such as fit, predict_proba, and named_steps as unknown.
    model: Any = search.best_estimator_

    baseline_probabilities = cross_val_predict(
        baseline, X_train, y_train, cv=cv, method="predict_proba", n_jobs=-1
    )[:, 1]
    xgboost_probabilities = cross_val_predict(
        model, X_train, y_train, cv=cv, method="predict_proba", n_jobs=-1
    )[:, 1]
    threshold = choose_threshold(y_train, xgboost_probabilities)
    comparison = pd.DataFrame(
        [
            {"model": "Dummy baseline", **calculate_metrics(y_train, baseline_probabilities, 0.5)},
            {"model": "Tuned XGBoost", **calculate_metrics(y_train, xgboost_probabilities, threshold)},
        ]
    )

    model.fit(X_train, y_train)
    test_probabilities = model.predict_proba(X_test)[:, 1]
    test_metrics = calculate_metrics(y_test, test_probabilities, threshold)
    matrix = confusion_matrix(y_test, (test_probabilities >= threshold).astype(int), labels=[0, 1])

    permutation: Any = permutation_importance(
        model, X_test, y_test, scoring="average_precision", n_repeats=15, random_state=RANDOM_STATE, n_jobs=-1
    )
    importances = pd.DataFrame(
        {"feature": FEATURES, "importance": permutation.importances_mean, "importance_std": permutation.importances_std}
    ).sort_values("importance", ascending=False)

    models_dir = args.output_dir / "models"
    reports_dir = args.output_dir / "reports"
    models_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, models_dir / "nlams_delay_model_xgb.joblib")
    joblib.dump(model.named_steps["preprocess"], models_dir / "preprocessor.joblib")
    joblib.dump(FEATURES, models_dir / "feature_list.joblib")
    comparison.to_csv(reports_dir / "model_comparison.csv", index=False)
    importances.to_csv(reports_dir / "feature_importance.csv", index=False)
    write_plots(y_test, test_probabilities, matrix, importances, reports_dir)

    evaluation = {
        "disclaimer": DISCLAIMER,
        "selection_criterion": "Highest three-fold cross-validated PR-AUC; recall and F1 for delayed projects are reported as safety checks.",
        "selected_model": "Tuned XGBoost",
        "decision_threshold": threshold,
        "cross_validation": comparison.to_dict(orient="records"),
        "held_out_test_metrics": test_metrics,
        "confusion_matrix": matrix.tolist(),
        "calibration": {
            "brier_score": test_metrics["brier_score"],
            "status": "Not calibrated: the synthetic dataset contains only nine delayed records, which is insufficient for reliable probability calibration.",
        },
    }
    (reports_dir / "model_evaluation.json").write_text(json.dumps(evaluation, indent=2), encoding="utf-8")
    (reports_dir / "data_quality_report.json").write_text(json.dumps(quality_report, indent=2), encoding="utf-8")

    metadata = {
        "model_name": "NLAMS acquisition delay-risk model",
        "model_version": MODEL_VERSION,
        "model_type": "XGBoost binary classifier",
        "training_date_utc": datetime.now(UTC).isoformat(),
        "training_dataset": str(args.dataset),
        "training_dataset_version": "SYNTHETIC_DEMO",
        "training_rows": int(len(X_train)),
        "held_out_test_rows": int(len(X_test)),
        "features": FEATURES,
        "excluded_for_leakage": quality_report["leakage_excluded"],
        "best_parameters": search.best_params_,
        "evaluation": evaluation,
        "disclaimer": DISCLAIMER,
    }
    (models_dir / "model_metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    LOGGER.info("Saved XGBoost model and measured reports to %s", args.output_dir)


if __name__ == "__main__":
    main()
