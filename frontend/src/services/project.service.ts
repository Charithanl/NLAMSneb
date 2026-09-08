import type { Project, ProjectStatus } from "../types/project.types";

const API_URL = import.meta.env.VITE_API_URL?.trim() || "http://127.0.0.1:3000/api/v1";

const PROJECTS: Project[] = [
  {
    id: "prj-nh-07",
    code: "NH-07/UP",
    name: "National Highway 07 Widening",
    state: "Uttar Pradesh",
    district: "Varanasi",
    agency: "State Highway Authority",
    status: "acquisition",
    progress: 68,
    riskScore: 78,
    budgetCrore: 1240,
    parcels: 184,
    affectedFamilies: 412,
    startDate: "2026-03-18",
    targetDate: "2026-11-30",
    description:
      "A corridor expansion program focused on land acquisition coordination, compensation verification, and possession handoff for the Varanasi segment.",
    milestones: [
      { id: "ms1", title: "Survey completed", status: "done", date: "2026-04-02" },
      { id: "ms2", title: "Awards issued", status: "done", date: "2026-05-19" },
      { id: "ms3", title: "Compensation disbursement", status: "current", date: "2026-08-15" },
      { id: "ms4", title: "Possession handoff", status: "upcoming", date: "2026-10-20" },
    ],
    issues: [
      { id: "is1", title: "3 parcel objections awaiting review", severity: "high", owner: "District officer" },
      { id: "is2", title: "Bank details need verification", severity: "medium", owner: "Compensation desk" },
    ],
  },
  {
    id: "prj-ir-01",
    code: "IR-01/MP",
    name: "Industrial Ring Road",
    state: "Madhya Pradesh",
    district: "Indore",
    agency: "Project Agency",
    status: "award",
    progress: 84,
    riskScore: 42,
    budgetCrore: 860,
    parcels: 96,
    affectedFamilies: 138,
    startDate: "2025-12-11",
    targetDate: "2026-09-28",
    description:
      "An urban mobility project with completed awards and steady progress toward possession and utility shifting.",
    milestones: [
      { id: "ms1", title: "Route alignment approved", status: "done", date: "2026-01-15" },
      { id: "ms2", title: "Awards issued", status: "done", date: "2026-06-01" },
      { id: "ms3", title: "Utility relocation", status: "current", date: "2026-08-22" },
      { id: "ms4", title: "Possession handoff", status: "upcoming", date: "2026-09-18" },
    ],
    issues: [
      { id: "is1", title: "One family request for rehabilitation clarification", severity: "low", owner: "RR cell" },
    ],
  },
  {
    id: "prj-wr-12",
    code: "WR-12/JH",
    name: "Western Rail Link Approach Road",
    state: "Jharkhand",
    district: "Ranchi",
    agency: "Transport Department",
    status: "survey",
    progress: 31,
    riskScore: 87,
    budgetCrore: 620,
    parcels: 52,
    affectedFamilies: 109,
    startDate: "2026-05-05",
    targetDate: "2027-03-12",
    description:
      "An early-stage project with active survey, boundary confirmation, and land record reconciliation across three villages.",
    milestones: [
      { id: "ms1", title: "Village survey started", status: "done", date: "2026-05-20" },
      { id: "ms2", title: "Boundary dispute review", status: "current", date: "2026-08-09" },
      { id: "ms3", title: "Draft award preparation", status: "upcoming", date: "2026-10-07" },
      { id: "ms4", title: "Possession planning", status: "upcoming", date: "2026-12-15" },
    ],
    issues: [
      { id: "is1", title: "Boundary mismatch in 7 parcels", severity: "critical", owner: "GIS team" },
      { id: "is2", title: "Land record merge required", severity: "high", owner: "Records unit" },
    ],
  },
];

export const projectService = {
  async loadProjects(): Promise<Project[] | null> {
    try {
      const response = await fetch(`${API_URL}/projects`);
      if (!response.ok) return null;
      const projects = await response.json() as Project[];
      return Array.isArray(projects) ? projects : null;
    } catch {
      return null;
    }
  },

  listProjects(status?: ProjectStatus) {
    return status ? PROJECTS.filter((project) => project.status === status) : PROJECTS;
  },

  getProjectById(projectId: string) {
    return PROJECTS.find((project) => project.id === projectId || project.code === projectId) ?? null;
  },

  getProjectStats(projects: Project[] = PROJECTS) {
    const totalBudget = projects.reduce((sum, project) => sum + project.budgetCrore, 0);
    const averageProgress = Math.round(
      projects.length ? projects.reduce((sum, project) => sum + project.progress, 0) / projects.length : 0,
    );

    return {
      totalProjects: projects.length,
      totalBudgetCrore: totalBudget,
      averageProgress,
      activeIssues: projects.reduce((sum, project) => sum + project.issues.length, 0),
      highRiskProjects: projects.filter((project) => project.riskScore >= 70).length,
    };
  },

  getStatusLabel(status: ProjectStatus) {
    switch (status) {
      case "planning":
        return "Planning";
      case "survey":
        return "Survey";
      case "acquisition":
        return "Acquisition";
      case "award":
        return "Award";
      case "possession":
        return "Possession";
      default:
        return "Unknown";
    }
  },

  getProjects() {
    return PROJECTS.slice();
  },
};
