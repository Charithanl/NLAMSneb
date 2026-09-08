CREATE TABLE IF NOT EXISTS app.acquisition_cases (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, parcel_id TEXT NOT NULL,
    status TEXT NOT NULL, category TEXT NOT NULL DEFAULT '', payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS app.compensation_cases (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, parcel_id TEXT NOT NULL,
    status TEXT NOT NULL, category TEXT NOT NULL DEFAULT '', payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS app.compensation_payments (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, parcel_id TEXT NOT NULL,
    status TEXT NOT NULL, category TEXT NOT NULL DEFAULT '', payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS app.documents (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL DEFAULT '', parcel_id TEXT NOT NULL DEFAULT '', status TEXT NOT NULL, category TEXT NOT NULL DEFAULT '', payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS app.rr_families (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, status TEXT NOT NULL,
    payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS app.reports (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL DEFAULT '', parcel_id TEXT NOT NULL DEFAULT '', category TEXT NOT NULL, status TEXT NOT NULL,
    payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acquisition_cases_status ON app.acquisition_cases(status);
CREATE INDEX IF NOT EXISTS idx_acquisition_cases_project ON app.acquisition_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_compensation_cases_status ON app.compensation_cases(status);
CREATE INDEX IF NOT EXISTS idx_compensation_payments_status ON app.compensation_payments(status);
CREATE INDEX IF NOT EXISTS idx_documents_status ON app.documents(status);
CREATE INDEX IF NOT EXISTS idx_rr_families_status ON app.rr_families(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON app.reports(category);
