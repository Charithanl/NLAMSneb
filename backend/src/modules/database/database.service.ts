import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool, QueryResultRow } from "pg";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    const connectionString = config.get<string>("DATABASE_URL");
    this.pool = new Pool({
      ...(connectionString
        ? { connectionString, ssl: config.get<string>("DB_SSL", "false") === "true" ? { rejectUnauthorized: false } : undefined }
        : {}),
      host: config.get<string>("DB_HOST", "localhost"),
      port: config.get<number>("DB_PORT", 5432),
      database: config.get<string>("DB_NAME", "nlams"),
      user: config.get<string>("DB_USER", "nlams_app"),
      password: config.get<string>("DB_PASSWORD", "nlams_local_development_only_2026"),
      max: config.get<number>("DB_POOL_MAX", 10),
      idleTimeoutMillis: 30_000,
    });
  }

  query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]) {
    return this.pool.query<T>(text, values);
  }

  async getStatus() {
    try {
      const result = await this.query<{ postgis_version: string | null }>(
        "SELECT PostGIS_Full_Version() AS postgis_version",
      );
      return { connected: true, postgis: result.rows[0]?.postgis_version ?? null };
    } catch (error) {
      return { connected: false, postgis: null, error: error instanceof Error ? error.message : "Database unavailable" };
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
