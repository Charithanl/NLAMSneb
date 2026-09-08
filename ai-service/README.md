# NLAMS XGBoost delay-risk model

Train with the supplied synthetic dataset:

```powershell
py -3.13 training/train.py
```

The trainer writes the XGBoost pipeline, standalone preprocessor, feature list, metadata, measured evaluation reports, and plots to `models/` and `reports/`.

To predict, provide a JSON object containing every feature listed in `models/model_metadata.json`:

```powershell
py -3.13 predict.py --input example-input.json
```

Run the API locally after training:

```powershell
py -3.13 -m uvicorn main:app --app-dir . --reload --port 8001
```

Endpoints: `GET /health`, `GET /model-info`, `POST /predict-delay`, `POST /predict-delay/batch`, and `POST /readiness-score`. The frontend uses the batch endpoint to score the supplied acquisition dataset in one request. Request validation rejects unknown, missing, null, and out-of-range fields.

`delay_risk_score` is intentionally excluded from training because it is a pre-existing risk signal and would leak target information. The training data contains only nine delayed records, so the saved probability is not calibrated and the model is strictly a synthetic-data demonstration.
