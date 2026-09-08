import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class GisService {
  constructor(private readonly database: DatabaseService) {}

  async listVillages(district?: string, limit = 100) {
    try {
      const result = await this.database.query(
        `SELECT nlams_village_id, state_ut, district, sub_district, village_name,
                village_lgd, ST_AsGeoJSON(geom)::json AS geometry
         FROM official_gis.village_boundaries
         WHERE ($1::text IS NULL OR district ILIKE $1)
         ORDER BY village_name
         LIMIT $2`,
        [district ? `%${district}%` : null, Math.min(Math.max(limit, 1), 500)],
      );
      return { count: result.rowCount ?? 0, items: result.rows };
    } catch (error) {
      throw new ServiceUnavailableException("PostGIS is unavailable or the GIS schema has not been initialized.");
    }
  }
}
