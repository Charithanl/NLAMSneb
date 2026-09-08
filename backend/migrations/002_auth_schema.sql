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

INSERT INTO app.users (id, email, full_name, role, password_hash)
VALUES
  ('u-state-officer', 'state_officer@nlams.local', 'State Officer', 'state_officer', crypt('nlams-demo', gen_salt('bf'))),
  ('u-district-officer', 'district_officer@nlams.local', 'District Officer', 'district_officer', crypt('nlams-demo', gen_salt('bf'))),
  ('u-project-agency-officer', 'project_agency_officer@nlams.local', 'Project Agency Officer', 'project_agency_officer', crypt('nlams-demo', gen_salt('bf'))),
  ('u-field-officer', 'field_officer@nlams.local', 'Field Officer', 'field_officer', crypt('nlams-demo', gen_salt('bf'))),
  ('u-reviewer', 'reviewer@nlams.local', 'Reviewer', 'reviewer', crypt('nlams-demo', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;
