import type { AIHistoryEntry, AIInsight, AIProjectDetail, AISummary, AIRiskLevel } from "../types/ai.types";

const DATASET_URL = "/data/synthetic_acquisition_demo.csv";
const API_URL = import.meta.env.VITE_API_URL?.trim() || "http://127.0.0.1:3000/api/v1";
const DATA_PROVENANCE = "SYNTHETIC_DEMO";

interface AcquisitionRecord {
  recordId: string;
  projectId: string;
  state_ut: string;
  district: string;
  village: string;
  project_type: string;
  applicable_act: string;
  current_stage: string;
  land_required_hectares: number;
  parcel_count: number;
  land_owner_count: number;
  affected_families: number;
  displaced_families: number;
  objections_count: number;
  hearings_count: number;
  court_case_count: number;
  compensation_assessed_inr: number;
  compensation_disbursed_inr: number;
  compensation_pending_inr: number;
  rr_assessed_inr: number;
  rr_disbursed_inr: number;
  land_record_digitization_rate: number;
  estimated_duration_days: number;
}

interface ApiRiskFactor {
  feature: string;
  contribution: number;
}

interface ApiPrediction {
  delay_probability: number;
  risk_score: number;
  risk_level: "HIGH" | "LOW";
  top_risk_factors: ApiRiskFactor[];
  model_version: string;
}

type ModelFeatures = Omit<AcquisitionRecord, "recordId" | "projectId" | "village">;

let recordsPromise: Promise<AcquisitionRecord[]> | null = null;
let predictionsPromise: Promise<ApiPrediction[]> | null = null;

function parseNumber(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let value = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCsvLine(lines[0] ?? "");
  return lines.slice(1).map((line) => Object.fromEntries(
    headers.map((header, index) => [header, splitCsvLine(line)[index] ?? ""]),
  ));
}

function toRecord(row: Record<string, string>): AcquisitionRecord {
  return {
    recordId: row.record_id,
    projectId: row.project_id,
    state_ut: row.state_ut,
    district: row.district,
    village: row.village,
    project_type: row.project_type,
    applicable_act: row.applicable_act,
    current_stage: row.current_stage,
    land_required_hectares: parseNumber(row.land_required_hectares),
    parcel_count: parseNumber(row.parcel_count),
    land_owner_count: parseNumber(row.land_owner_count),
    affected_families: parseNumber(row.affected_families),
    displaced_families: parseNumber(row.displaced_families),
    objections_count: parseNumber(row.objections_count),
    hearings_count: parseNumber(row.hearings_count),
    court_case_count: parseNumber(row.court_case_count),
    compensation_assessed_inr: parseNumber(row.compensation_assessed_inr),
    compensation_disbursed_inr: parseNumber(row.compensation_disbursed_inr),
    compensation_pending_inr: parseNumber(row.compensation_pending_inr),
    rr_assessed_inr: parseNumber(row.rr_assessed_inr),
    rr_disbursed_inr: parseNumber(row.rr_disbursed_inr),
    land_record_digitization_rate: parseNumber(row.land_record_digitization_rate),
    estimated_duration_days: parseNumber(row.estimated_duration_days),
  };
}

function toModelFeatures({ recordId: _recordId, projectId: _projectId, village: _village, ...features }: AcquisitionRecord): ModelFeatures {
  return features;
}

async function loadRecords() {
  const response = await fetch(DATASET_URL);
  if (!response.ok) throw new Error("The acquisition dataset could not be loaded.");
  return parseCsv(await response.text()).map(toRecord);
}

async function loadPredictions() {
  recordsPromise ??= loadRecords();
  const records = await recordsPromise;
  const response = await fetch(`${API_URL}/ai/predict-delay/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records: records.map(toModelFeatures) }),
  });
  if (!response.ok) {
    throw new Error("The AI service is unavailable. Start the NestJS backend and AI service, then try again.");
  }
  const payload = await response.json() as { predictions?: ApiPrediction[] };
  if (!payload.predictions || payload.predictions.length !== records.length) {
    throw new Error("The XGBoost AI service returned an invalid prediction response.");
  }
  return payload.predictions;
}

function riskLevel(score: number): AIRiskLevel {
  if (score >= 75) return "critical";
  if (score >= 55) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function describeFactor(record: AcquisitionRecord, factor: ApiRiskFactor) {
  switch (factor.feature) {
    case "objections_count": return `${record.objections_count} objections require resolution`;
    case "court_case_count": return `${record.court_case_count} active court cases`;
    case "compensation_pending_inr": return `INR ${Math.round(record.compensation_pending_inr).toLocaleString("en-IN")} compensation remains pending`;
    case "land_record_digitization_rate": return `${Math.round(record.land_record_digitization_rate * 100)}% land-record digitization coverage`;
    case "affected_families": return `${record.affected_families} affected families`;
    case "displaced_families": return `${record.displaced_families} displaced families`;
    case "estimated_duration_days": return `${record.estimated_duration_days}-day estimated duration`;
    default: return factor.feature.replaceAll("_", " ");
  }
}

function recommendation(record: AcquisitionRecord) {
  if (record.court_case_count > 0) return "Prioritize legal-case review and align the hearing plan with the records team.";
  if (record.compensation_pending_inr > record.compensation_assessed_inr * 0.35) return "Prioritize compensation verification and the next payment clearance review.";
  if (record.objections_count >= 25) return "Clear the objection queue before the case advances to the next workflow stage.";
  return "Monitor the case at the next weekly review and keep land-record updates on schedule.";
}

function toInsight(record: AcquisitionRecord, prediction: ApiPrediction): AIInsight {
  return {
    id: `ai-${record.recordId.toLowerCase()}`,
    entityName: `${record.projectId} - ${record.village}`,
    domain: "project",
    route: `/ai/projects/${encodeURIComponent(record.recordId)}`,
    score: prediction.risk_score,
    level: riskLevel(prediction.risk_score),
    confidence: null,
    summary: `${record.project_type} acquisition in ${record.district}, ${record.state_ut}, currently at ${record.current_stage}.`,
    drivers: prediction.top_risk_factors.map((factor) => describeFactor(record, factor)),
    recommendation: recommendation(record),
    owner: "Acquisition review cell",
    updatedAt: prediction.model_version,
  };
}

function toProjectDetail(record: AcquisitionRecord, prediction: ApiPrediction): AIProjectDetail {
  return {
    recordId: record.recordId,
    projectId: record.projectId,
    state: record.state_ut,
    district: record.district,
    village: record.village,
    projectType: record.project_type,
    applicableAct: record.applicable_act,
    currentStage: record.current_stage,
    landRequiredHectares: record.land_required_hectares,
    parcelCount: record.parcel_count,
    landOwnerCount: record.land_owner_count,
    affectedFamilies: record.affected_families,
    displacedFamilies: record.displaced_families,
    objectionsCount: record.objections_count,
    hearingsCount: record.hearings_count,
    courtCaseCount: record.court_case_count,
    compensationAssessedInr: record.compensation_assessed_inr,
    compensationDisbursedInr: record.compensation_disbursed_inr,
    compensationPendingInr: record.compensation_pending_inr,
    rrAssessedInr: record.rr_assessed_inr,
    rrDisbursedInr: record.rr_disbursed_inr,
    digitizationRate: record.land_record_digitization_rate,
    estimatedDurationDays: record.estimated_duration_days,
    riskScore: prediction.risk_score,
    riskLevel: riskLevel(prediction.risk_score),
    delayProbability: prediction.delay_probability,
    drivers: prediction.top_risk_factors.map((factor) => describeFactor(record, factor)),
    recommendation: recommendation(record),
    modelVersion: prediction.model_version,
  };
}

export const aiService = {
  loadInsights: async () => {
    recordsPromise ??= loadRecords();
    predictionsPromise ??= loadPredictions();
    const [records, predictions] = await Promise.all([recordsPromise, predictionsPromise]);
    return records
      .map((record, index) => toInsight(record, predictions[index]))
      .sort((left, right) => right.score - left.score)
      .slice(0, 12);
  },

  loadSummary: async (): Promise<AISummary> => {
    predictionsPromise ??= loadPredictions();
    const predictions = await predictionsPromise;
    const scores = predictions.map((prediction) => prediction.risk_score);
    return {
      totalScans: predictions.length,
      averageScore: Math.round(scores.reduce((total, score) => total + score, 0) / scores.length),
      criticalRisks: scores.filter((score) => score >= 75).length,
      recommendedActions: scores.filter((score) => score >= 55).length,
    };
  },

  loadProjectDetail: async (recordId: string): Promise<AIProjectDetail | null> => {
    recordsPromise ??= loadRecords();
    predictionsPromise ??= loadPredictions();
    const [records, predictions] = await Promise.all([recordsPromise, predictionsPromise]);
    const index = records.findIndex((record) => record.recordId === recordId);
    return index === -1 ? null : toProjectDetail(records[index], predictions[index]);
  },

  getHistory(): AIHistoryEntry[] {
    return [];
  },

  getRiskLabel(level: AIRiskLevel) {
    return level.charAt(0).toUpperCase() + level.slice(1);
  },

  getModelLabel() {
    return "XGBoost acquisition delay-risk model";
  },

  getDataProvenance() {
    return DATA_PROVENANCE;
  },
};
