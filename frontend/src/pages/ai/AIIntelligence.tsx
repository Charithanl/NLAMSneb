import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppCard } from "../../components/common/AppCard";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { InfoRibbon } from "../../components/common/InfoRibbon";
import { MetricCard } from "../../components/common/MetricCard";
import { aiService } from "../../services/ai.service";
import type { AIInsight, AISummary } from "../../types/ai.types";
import { AlertTriangle, Brain, CircleGauge, Sparkles } from "lucide-react";

export function AIIntelligence() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([aiService.loadInsights(), aiService.loadSummary()])
      .then(([nextInsights, nextSummary]) => {
        setInsights(nextInsights);
        setSummary(nextSummary);
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "The AI dataset could not be loaded.");
      });
  }, []);

  return (
    <div className="space-y-7">
      <InfoRibbon
        title={aiService.getModelLabel()}
        description="Loads acquisition records and sends them to the trained XGBoost API for delay-risk scoring and feature-level explanations."
        items={[
          { label: "Scans", value: summary ? String(summary.totalScans) : "…" },
          { label: "Average", value: summary ? `${summary.averageScore}/100` : "…" },
          { label: "Critical", value: summary ? String(summary.criticalRisks) : "…" },
          { label: "Actions", value: summary ? String(summary.recommendedActions) : "…" },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <AppCard title="AI intelligence" description={`${aiService.getDataProvenance()} data — results are decision support, not automated approvals.`}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Scans" value={summary ? String(summary.totalScans) : "…"} detail="Analyzed records" icon={Brain} />
            <MetricCard label="Average risk" value={summary ? `${summary.averageScore}/100` : "…"} detail="Portfolio level" icon={CircleGauge} />
            <MetricCard label="Critical" value={summary ? String(summary.criticalRisks) : "…"} detail="Urgent reviews" icon={AlertTriangle} />
            <MetricCard label="Actions" value={summary ? String(summary.recommendedActions) : "…"} detail="Suggested steps" icon={Sparkles} />
          </div>
        </AppCard>

        <AppCard title="Signal" description="Short prompts, not a full analytics wall.">
          <div className="grid gap-3">
            <MiniLine label="Risk queue" value={summary ? String(insights.length) : "Loading"} />
            <MiniLine label="Default view" value={insights[0]?.entityName ?? "None"} />
            <MiniLine label="Mode" value="Explainable ranking" />
          </div>
        </AppCard>
      </section>

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p> : null}

      {!error && !summary ? <p className="text-sm text-slate-500">Loading and scoring acquisition records…</p> : null}

      <section className="grid gap-4 xl:grid-cols-2">
        {insights.map((insight) => (
          <article
            key={insight.id}
            className="rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,248,255,0.94)_100%)] p-6 shadow-[0_12px_40px_rgba(15,29,47,0.05)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{insight.domain}</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">{insight.entityName}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{insight.summary}</p>
              </div>
              <Badge tone={toneByLevel(insight.level)}>{aiService.getRiskLabel(insight.level)}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="neutral">{insight.confidence === null ? "Confidence unavailable" : `Confidence ${insight.confidence}%`}</Badge>
              <Badge tone="neutral">Score {insight.score}/100</Badge>
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Top drivers</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {insight.drivers.map((driver) => <li key={driver}>• {driver}</li>)}
              </ul>
              <p className="mt-3 text-sm font-medium text-slate-900">Recommended action: {insight.recommendation}</p>
            </div>
            <div className="mt-5 flex flex-wrap justify-between gap-3">
              <p className="text-sm text-slate-500">{insight.updatedAt}</p>
              <Button onClick={() => navigate(insight.route)}>Open</Button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function MiniLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-white/90 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">{label}</p>
      <p className="mt-2 text-sm font-semibold text-blue-950">{value}</p>
    </div>
  );
}

function toneByLevel(level: AIInsight["level"]) {
  switch (level) {
    case "low":
      return "success";
    case "medium":
      return "warning";
    case "high":
      return "primary";
    case "critical":
      return "danger";
  }
  return "neutral";
}
