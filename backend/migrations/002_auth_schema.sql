CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app.users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('central_admin', 'state_officer', 'district_officer', 'project_agency_officer', 'field_officer', 'reviewer')),
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app.users (id, email, full_name, role, password_hash)
VALUES ('u-central-admin', 'admin@nlams.local', 'NLAMS Administrator', 'central_admin', crypt('nlams-demo', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;
