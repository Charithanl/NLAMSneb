"""FastAPI boundary for the NLAMS XGBoost delay-risk model."""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from predict import predict_delay, predict_delays


SERVICE_ROOT = Path(__file__).resolve().parent
METADATA_PATH = SERVICE_ROOT / "models" / "model_metadata.json"
app = FastAPI(title="NLAMS AI Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class AcquisitionFeatures(BaseModel):
    model_config = ConfigDict(extra="forbid")

    land_required_hectares: float = Field(ge=0)
    parcel_count: int = Field(ge=0)
    land_owner_count: int = Field(ge=0)
    affected_families: int = Field(ge=0)
    displaced_families: int = Field(ge=0)
    objections_count: int = Field(ge=0)
    hearings_count: int = Field(ge=0)
    court_case_count: int = Field(ge=0)
    compensation_assessed_inr: float = Field(ge=0)
    compensation_disbursed_inr: float = Field(ge=0)
    compensation_pending_inr: float = Field(ge=0)
    rr_assessed_inr: float = Field(ge=0)
    rr_disbursed_inr: float = Field(ge=0)
    land_record_digitization_rate: float = Field(ge=0, le=1)
    estimated_duration_days: int = Field(ge=0)
    state_ut: str = Field(min_length=1, max_length=100)
    district: str = Field(min_length=1, max_length=100)
    project_type: str = Field(min_length=1, max_length=100)
    applicable_act: str = Field(min_length=1, max_length=100)
    current_stage: str = Field(min_length=1, max_length=100)


class BatchPredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    records: list[AcquisitionFeatures] = Field(min_length=1, max_length=2500)


def model_metadata() -> dict:
    if not METADATA_PATH.exists():
        raise HTTPException(status_code=503, detail="Model artifacts are not available. Run training/train.py first.")
    return json.loads(METADATA_PATH.read_text(encoding="utf-8"))


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok" if METADATA_PATH.exists() else "model-not-trained"}


@app.get("/model-info")
def get_model_info() -> dict:
    metadata = model_metadata()
    return {
        "model_name": metadata["model_name"],
        "model_version": metadata["model_version"],
        "model_type": metadata["model_type"],
        "training_date_utc": metadata["training_date_utc"],
        "training_rows": metadata["training_rows"],
        "features": metadata["features"],
        "evaluation": metadata["evaluation"]["held_out_test_metrics"],
        "training_dataset_is_synthetic": True,
        "disclaimer": metadata["disclaimer"],
    }


@app.post("/predict-delay")
def predict_delay_endpoint(features: AcquisitionFeatures) -> dict:
    try:
        return predict_delay(features.model_dump())
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail="Model artifacts are not available. Run training/train.py first.") from error
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/predict-delay/batch")
def predict_delay_batch(request: BatchPredictionRequest) -> dict:
    try:
        return {"predictions": predict_delays([record.model_dump() for record in request.records])}
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail="Model artifacts are not available. Run training/train.py first.") from error
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/readiness-score")
def readiness_score(features: AcquisitionFeatures) -> dict:
    """Return a transparent, non-ML decision-support score; it is not an official metric."""
    payload = features.model_dump()
    compensation_ready = (
        payload["compensation_disbursed_inr"] / payload["compensation_assessed_inr"]
        if payload["compensation_assessed_inr"] > 0
        else 1.0
    )
    rr_ready = payload["rr_disbursed_inr"] / payload["rr_assessed_inr"] if payload["rr_assessed_inr"] > 0 else 1.0
    legal_readiness = max(0.0, 1 - min(1.0, payload["objections_count"] / 50 + payload["court_case_count"] / 10))
    family_readiness = max(0.0, 1 - min(1.0, payload["displaced_families"] / max(payload["affected_families"], 1)))
    score = round(
        100
        * (
            0.25 * payload["land_record_digitization_rate"]
            + 0.25 * min(1.0, compensation_ready)
            + 0.15 * min(1.0, rr_ready)
            + 0.25 * legal_readiness
            + 0.10 * family_readiness
        )
    )
    level = "READY" if score >= 75 else "NEEDS ATTENTION" if score >= 50 else "HIGH RISK"
    return {
        "acquisition_readiness_score": score,
        "readiness_level": level,
        "metric_note": "NLAMS Acquisition Readiness Score is a transparent decision-support score, not a government-approved metric or ML probability.",
        "components": {
            "land_record_readiness": round(payload["land_record_digitization_rate"] * 100, 1),
            "compensation_readiness": round(min(1.0, compensation_ready) * 100, 1),
            "rr_readiness": round(min(1.0, rr_ready) * 100, 1),
            "legal_readiness": round(legal_readiness * 100, 1),
            "family_readiness": round(family_readiness * 100, 1),
        },
    }
