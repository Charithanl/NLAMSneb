# Local PostGIS development

The local database runs in Docker and applies `NLAMS_Dataset_A_FINAL_WITH_SYNTHETIC_DEMO/postgis/schema.sql` only when its data volume is first created.

Start it from the repository root:

```powershell
docker compose up -d postgis
```

Verify the service and PostGIS extension:

```powershell
docker compose ps
docker compose exec postgis psql -U nlams_app -d nlams -c "SELECT PostGIS_Full_Version();"
```

Connection string for the future NestJS backend:

```text
postgresql://nlams_app:<POSTGRES_PASSWORD>@localhost:5432/nlams
```

The generated `.env` file is local-only and ignored by Git. Change its password before using the database outside local development.
