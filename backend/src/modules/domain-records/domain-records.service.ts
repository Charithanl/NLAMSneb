import { Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

export type DomainTable = "acquisition_cases" | "compensation_cases" | "compensation_payments" | "documents" | "rr_families" | "reports";
const TABLES = new Set<DomainTable>(["acquisition_cases", "compensation_cases", "compensation_payments", "documents", "rr_families", "reports"]);

@Injectable()
export class DomainRecordsService {
  constructor(private readonly database: DatabaseService) {}

  async list(table: DomainTable, filters: Record<string, string | undefined> = {}) {
    this.assertTable(table);
    const conditions: string[] = [];
    const values: string[] = [];
    for (const key of ["status", "project_id", "category", "parcel_id"]) {
      if (filters[key]) { values.push(filters[key] as string); conditions.push(`${key} = $${values.length}`); }
    }
    try {
      const result = await this.database.query<{ payload: Record<string, unknown> }>(
        `SELECT payload FROM app.${table}${conditions.length ? ` WHERE ${conditions.join(" AND ")}` : ""} ORDER BY updated_at DESC`, values,
      );
      return result.rows.map((row) => row.payload);
    } catch { throw new ServiceUnavailableException("The domain database is unavailable."); }
  }

  async get(table: DomainTable, id: string) {
    this.assertTable(table);
    try {
      const result = await this.database.query<{ payload: Record<string, unknown> }>(`SELECT payload FROM app.${table} WHERE id = $1`, [id]);
      if (!result.rows[0]) throw new NotFoundException("Record not found.");
      return result.rows[0].payload;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new ServiceUnavailableException("The domain database is unavailable.");
    }
  }

  async upsert(table: DomainTable, payload: Record<string, unknown>) {
    this.assertTable(table);
    const id = String(payload.id ?? "");
    if (!id) throw new NotFoundException("A record id is required.");
    const projectId = String(payload.projectId ?? "");
    const parcelId = String(payload.parcelId ?? "");
    const status = String(payload.status ?? "draft");
    const category = String(payload.category ?? "operations");
    const projectColumn = ["acquisition_cases", "compensation_cases", "compensation_payments", "rr_families"].includes(table) ? projectId : "";
    try {
      const result = await this.database.query<{ payload: Record<string, unknown> }>(
        `INSERT INTO app.${table} (id, project_id, parcel_id, status, category, payload)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET project_id = EXCLUDED.project_id, parcel_id = EXCLUDED.parcel_id, status = EXCLUDED.status, category = EXCLUDED.category, payload = EXCLUDED.payload, updated_at = NOW()
         RETURNING payload`,
        [id, projectColumn, parcelId, status, category, payload],
      );
      return result.rows[0].payload;
    } catch { throw new ServiceUnavailableException("The record could not be saved."); }
  }

  async remove(table: DomainTable, id: string) {
    this.assertTable(table);
    try {
      const result = await this.database.query(`DELETE FROM app.${table} WHERE id = $1 RETURNING id`, [id]);
      if (!result.rows[0]) throw new NotFoundException("Record not found.");
      return { deleted: true, id };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new ServiceUnavailableException("The record could not be deleted.");
    }
  }

  private assertTable(table: DomainTable) { if (!TABLES.has(table)) throw new Error("Invalid domain table."); }
}
