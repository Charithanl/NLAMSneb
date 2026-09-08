import { useEffect, useState } from "react";
import { ArrowLeft, FileText, Landmark, Scale, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AppCard } from "../../components/common/AppCard";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { MetricCard } from "../../components/common/MetricCard";
import { aiService } from "../../services/ai.service";
import type { AIProjectDetail } from "../../types/ai.types";

export function AIProjectDetails() {
  const navigate = useNavigate();
  const { recordId } = useParams();
  const [project, setProject] = useState<AIProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recordId) {
      setLoading(false);
      return;
    }
    void aiService.loadProjectDetail(recordId)
      .then((detail) => {
        setProject(detail);
        if (!detail) setError("This acquisition record could not be found in the dataset.");
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Project details could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, [recordId]);

  if (loading) return <p className="text-sm text-slate-500">Loading XGBoost project details...</p>;

  if (error || !project) {
    return (
      <AppCard title="Project details unavailable" description={error ?? "The selected project was not found."}>
        <Button variant="secondary" leadingIcon={ArrowLeft} onClick={() => navigate("/ai")}>Back to AI Intelligence</Button>
      </AppCard>
    );
  }

  const compensationProgress = percentage(project.compensationDisbursedInr, project.compensationAssessedInr);
  const rrProgress = percentage(project.rrDisbursedInr, project.rrAssessedInr);

  return (
    <div className="space-y-7">
      <AppCard title="AI project detail" description="Synthetic acquisition record with XGBoost delay-risk analysis.">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{project.recordId}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{project.projectId} - {project.village}</h1>
            <p className="mt-2 text-sm text-slate-600">{project.district}, {project.state} | {project.projectType}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={riskTone(project.riskLevel)}>{project.riskLevel} risk</Badge>
            <Badge tone="neutral">Stage: {project.currentStage}</Badge>
            <Button variant="secondary" leadingIcon={ArrowLeft} onClick={() => navigate("/ai")}>Back to AI Intelligence</Button>
          </div>
        </div>
      </AppCard>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="XGBoost risk score" value={`${project.riskScore}/100`} detail="Uncalibrated model score" icon={Scale} />
        <MetricCard label="Model probability" value={`${Math.round(project.delayProbability * 100)}%`} detail="Do not treat as a calibrated probability" icon={FileText} />
        <MetricCard label="Land required" value={`${project.landRequiredHectares.toFixed(2)} ha`} detail={`${project.parcelCount} parcels`} icon={Landmark} />
        <MetricCard label="Affected families" value={String(project.affectedFamilies)} detail={`${project.displacedFamilies} displaced`} icon={Users} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <AppCard title="Why this project is at risk" description="Feature contributions returned by the trained XGBoost model.">
          <div className="space-y-3">
            {project.drivers.length > 0 ? project.drivers.map((driver) => (
              <div key={driver} className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950">{driver}</div>
            )) : <p className="text-sm text-slate-500">The model returned no positive risk contributions for this record.</p>}
          </div>
          <div className="mt-5 rounded-2xl bg-sky-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Recommended review</p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{project.recommendation}</p>
          </div>
        </AppCard>

        <AppCard title="Location and workflow" description="Source fields attached to the selected acquisition record.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="State" value={project.state} />
            <Detail label="District" value={project.district} />
            <Detail label="Applicable act" value={project.applicableAct} />
            <Detail label="Current stage" value={project.currentStage} />
            <Detail label="Land owners" value={String(project.landOwnerCount)} />
            <Detail label="Estimated duration" value={`${project.estimatedDurationDays} days`} />
            <Detail label="Objections" value={String(project.objectionsCount)} />
            <Detail label="Hearings" value={String(project.hearingsCount)} />
            <Detail label="Court cases" value={String(project.courtCaseCount)} />
            <Detail label="Land records digitized" value={`${Math.round(project.digitizationRate * 100)}%`} />
          </div>
        </AppCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <AppCard title="Compensation status" description="Financial values are source fields from the synthetic dataset.">
          <div className="grid gap-3 sm:grid-cols-3">
            <Detail label="Assessed" value={formatInr(project.compensationAssessedInr)} />
            <Detail label="Disbursed" value={formatInr(project.compensationDisbursedInr)} />
            <Detail label="Pending" value={formatInr(project.compensationPendingInr)} />
          </div>
          <Progress label="Disbursement progress" value={compensationProgress} />
        </AppCard>

        <AppCard title="Rehabilitation and resettlement" description="R&R readiness based on assessed and disbursed values.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="R&R assessed" value={formatInr(project.rrAssessedInr)} />
            <Detail label="R&R disbursed" value={formatInr(project.rrDisbursedInr)} />
          </div>
          <Progress label="R&R disbursement progress" value={rrProgress} />
        </AppCard>
      </section>

      <p className="text-xs leading-5 text-slate-500">Model: {project.modelVersion}. This page uses synthetic data and is decision support only, not an official acquisition decision.</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-900">{value}</p></div>;
}

function Progress({ label, value }: { label: string; value: number }) {
  return <div className="mt-5"><div className="mb-2 flex justify-between text-sm font-medium text-slate-700"><span>{label}</span><span>{value}%</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gov-600" style={{ width: `${value}%` }} /></div></div>;
}

function percentage(completed: number, total: number) {
  return total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 100;
}

function formatInr(value: number) {
  return `INR ${Math.round(value).toLocaleString("en-IN")}`;
}

function riskTone(level: AIProjectDetail["riskLevel"]) {
  if (level === "critical") return "danger" as const;
  if (level === "high") return "warning" as const;
  if (level === "medium") return "primary" as const;
  return "success" as const;
}
