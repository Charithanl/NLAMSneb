export type AIRiskDomain = "project" | "parcel" | "compensation" | "rehabilitation";

export type AIRiskLevel = "low" | "medium" | "high" | "critical";

export interface AIInsight {
  id: string;
  entityName: string;
  domain: AIRiskDomain;
  route: string;
  score: number;
  level: AIRiskLevel;
  confidence: number | null;
  summary: string;
  drivers: string[];
  recommendation: string;
  owner: string;
  updatedAt: string;
}

export interface AIHistoryEntry {
  id: string;
  entityName: string;
  score: number;
  delta: number;
  note: string;
  date: string;
}

export interface AISummary {
  totalScans: number;
  averageScore: number;
  criticalRisks: number;
  recommendedActions: number;
}

export interface AIProjectDetail {
  recordId: string;
  projectId: string;
  state: string;
  district: string;
  village: string;
  projectType: string;
  applicableAct: string;
  currentStage: string;
  landRequiredHectares: number;
  parcelCount: number;
  landOwnerCount: number;
  affectedFamilies: number;
  displacedFamilies: number;
  objectionsCount: number;
  hearingsCount: number;
  courtCaseCount: number;
  compensationAssessedInr: number;
  compensationDisbursedInr: number;
  compensationPendingInr: number;
  rrAssessedInr: number;
  rrDisbursedInr: number;
  digitizationRate: number;
  estimatedDurationDays: number;
  riskScore: number;
  riskLevel: AIRiskLevel;
  delayProbability: number;
  drivers: string[];
  recommendation: string;
  modelVersion: string;
}
