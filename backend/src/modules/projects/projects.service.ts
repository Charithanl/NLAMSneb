import { Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

@Injectable()
export class ProjectsService {
  constructor(private readonly database: DatabaseService) {}

  async list(status?: string) {
    try {
      const result = await this.database.query(
        `SELECT p.*, COALESCE((SELECT json_agg(m ORDER BY m.milestone_date) FROM app.project_milestones m WHERE m.project_id = p.id), '[]') AS milestones,
                COALESCE((SELECT json_agg(i ORDER BY i.severity DESC) FROM app.project_issues i WHERE i.project_id = p.id), '[]') AS issues
           FROM app.projects p
          WHERE ($1::text IS NULL OR p.status = $1)
          ORDER BY p.updated_at DESC`,
        [status ?? null],
      );
      return result.rows.map(mapProject);
    } catch {
      throw new ServiceUnavailableException("The project database is unavailable.");
    }
  }

  async get(id: string) {
    const projects = await this.list();
    const project = projects.find((entry) => entry.id === id || entry.code === id);
    if (!project) throw new NotFoundException("Project not found.");
    return project;
  }

  async create(input: CreateProjectDto) {
    try {
      const result = await this.database.query(
        `INSERT INTO app.projects (id, code, name, state, district, agency, status, progress, risk_score, budget_crore, parcels, affected_families, start_date, target_date, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
        [input.id, input.code, input.name, input.state, input.district, input.agency, input.status, input.progress, input.riskScore, input.budgetCrore, input.parcels, input.affectedFamilies, input.startDate, input.targetDate, input.description],
      );
      return mapProject(result.rows[0]);
    } catch {
      throw new ServiceUnavailableException("The project could not be created.");
    }
  }

  async update(id: string, input: UpdateProjectDto) {
    const fields = Object.entries(input).filter(([, value]) => value !== undefined);
    if (!fields.length) return this.get(id);
    const columnMap: Record<string, string> = { riskScore: "risk_score", budgetCrore: "budget_crore", affectedFamilies: "affected_families", startDate: "start_date", targetDate: "target_date" };
    const assignments = fields.map(([key], index) => `${columnMap[key] ?? key} = $${index + 2}`);
    try {
      const values = fields.map(([, value]) => value);
      const result = await this.database.query(`UPDATE app.projects SET ${assignments.join(", ")}, updated_at = NOW() WHERE id = $1 RETURNING *`, [id, ...values]);
      if (!result.rows[0]) throw new NotFoundException("Project not found.");
      return mapProject(result.rows[0]);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new ServiceUnavailableException("The project could not be updated.");
    }
  }

  async remove(id: string) {
    try {
      const result = await this.database.query("DELETE FROM app.projects WHERE id = $1 RETURNING id", [id]);
      if (!result.rows[0]) throw new NotFoundException("Project not found.");
      return { deleted: true, id };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new ServiceUnavailableException("The project could not be deleted.");
    }
  }
}

function mapProject(row: Record<string, unknown>) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    state: row.state,
    district: row.district,
    agency: row.agency,
    status: row.status,
    progress: row.progress,
    riskScore: row.risk_score,
    budgetCrore: Number(row.budget_crore ?? 0),
    parcels: row.parcels,
    affectedFamilies: row.affected_families,
    startDate: row.start_date,
    targetDate: row.target_date,
    description: row.description,
    milestones: row.milestones ?? [],
    issues: row.issues ?? [],
  };
}
