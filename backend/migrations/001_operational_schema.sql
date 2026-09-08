CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE IF NOT EXISTS app.projects (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    agency TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('planning', 'survey', 'acquisition', 'award', 'possession')),
    progress SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    risk_score SMALLINT NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    budget_crore NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (budget_crore >= 0),
    parcels INTEGER NOT NULL DEFAULT 0 CHECK (parcels >= 0),
    affected_families INTEGER NOT NULL DEFAULT 0 CHECK (affected_families >= 0),
    start_date DATE NOT NULL,
    target_date DATE NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.project_milestones (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('done', 'current', 'upcoming')),
    milestone_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS app.project_issues (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    owner TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON app.projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_district ON app.projects (district);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON app.project_milestones (project_id);
CREATE INDEX IF NOT EXISTS idx_project_issues_project ON app.project_issues (project_id);
