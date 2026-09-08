# NLAMS backend

Stage 1 provides the backend boundary for the frontend, PostGIS, and FastAPI XGBoost service.

```text
React -> NestJS API (/api/v1) -> PostgreSQL/PostGIS
                         -> FastAPI XGBoost service
```

Run from this directory after installing dependencies:

```powershell
npm install
npm run start:dev
```

Endpoints:

- `GET /api/v1/health`
- `POST /api/v1/auth/login` (demo credentials: `admin@nlams.local` / `nlams-demo`)
- `GET /api/v1/auth/me` (Bearer token required)
- `GET /api/v1/ai/model-info`
- `POST /api/v1/ai/predict-delay`
- `POST /api/v1/ai/predict-delay/batch`
- `POST /api/v1/ai/readiness-score`
- `GET /api/v1/gis/villages?district=Ranchi&limit=20`
- `GET /api/v1/projects?status=acquisition`
- `GET /api/v1/projects/:id`
- `POST /api/v1/projects`
- `PATCH /api/v1/projects/:id`
- `DELETE /api/v1/projects/:id`
- `GET|POST|PATCH|DELETE /api/v1/acquisition/cases`
- `GET|POST|PATCH|DELETE /api/v1/compensation/cases`
- `GET|POST|PATCH|DELETE /api/v1/compensation/payments`
- `GET|POST|PATCH|DELETE /api/v1/documents`
- `GET|POST|PATCH|DELETE /api/v1/rehabilitation/families`
- `GET|POST|PATCH|DELETE /api/v1/reports`
- `GET /api/v1/reports/metrics`

The operational migrations are in `migrations/` and are mounted by Docker after the official GIS schema. Change `JWT_SECRET` before any non-local deployment.

Next stages should add authentication, acquisition workflow modules, and frontend configuration to call NestJS rather than calling the AI service directly.
