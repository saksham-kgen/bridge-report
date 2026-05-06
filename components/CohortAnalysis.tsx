"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import SectionHeader from "./SectionHeader";
import Dropdown from "./Dropdown";

type Scope = "All" | "Indic" | "International";

type RawRow = {
  k: string; // model key
  s: Scope;
  l: string;
  region: string;
  gender: string;
  age: string;
  density: string;
  duration_cat: string;
  overlap: string;
  gap: string;
  WER: number | null;
  CER: number | null;
  SemanticSim: number | null;
  CS_F1: number | null;
  lwWER: number | null;
  PIER: number | null;
  WIL: number | null;
};

type CohortRow = {
  key: string;
  name: string;
  overall: number | null;
  delta: number;
  categories: Record<string, { value: number | null; n: number }>;
};

type DataShape = {
  metrics: string[];
  metricLabels: Record<string, string>;
  higherIsBetter: string[];
  cohortDims: string[];
  cohortSchemas: Record<string, { field: keyof RawRow; order: string[] }>;
  scopes: Scope[];
  scopedLanguages: Record<Scope, string[]>;
  rawRows: RawRow[];
  modelInfoFlat: Record<string, string>;
  leaderboard: Record<string, Record<string, Record<string, { name: string }[]>>>;
};

function fmt(metric: string, v: number | null) {
  if (v === null || !Number.isFinite(v)) return "—";
  if (metric === "SemanticSim" || metric === "CS_F1") return v.toFixed(3);
  return `${(v * 100).toFixed(1)}%`;
}
function fmtPP(metric: string, v: number) {
  if (metric === "SemanticSim" || metric === "CS_F1") return `±${v.toFixed(3)}`;
  return `±${(v * 100).toFixed(1)}pp`;
}

const ALL_MODELS = "All models";
const COLORS = ["#FF6E42", "#FFA682", "#F5C9B8", "#9F8E84", "#7A7472", "#574F4B"];

function mean(xs: number[]) {
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function aggregateCohort(
  rows: RawRow[],
  dim: string,
  metric: keyof RawRow,
  schema: { field: keyof RawRow; order: string[] },
  modelInfoFlat: Record<string, string>,
  higherIsBetter: boolean
): CohortRow[] {
  const byKey = new Map<string, RawRow[]>();
  for (const r of rows) {
    if (!byKey.has(r.k)) byKey.set(r.k, []);
    byKey.get(r.k)!.push(r);
  }
  const out: CohortRow[] = [];
  for (const [key, group] of byKey.entries()) {
    const dimRows = group.filter((r) => r[schema.field]);
    const perCat: Record<string, { value: number | null; n: number }> = {};
    let havePerCat = false;
    let weightedSum = 0;
    let weightedN = 0;
    for (const cat of schema.order) {
      const xs = dimRows
        .filter((g) => g[schema.field] === cat)
        .map((g) => g[metric] as number | null)
        .filter((v): v is number => v !== null && Number.isFinite(v));
      if (xs.length >= 2) {
        const m = mean(xs)!;
        perCat[cat] = { value: m, n: xs.length };
        weightedSum += m * xs.length;
        weightedN += xs.length;
        havePerCat = true;
      } else {
        perCat[cat] = { value: null, n: xs.length };
      }
    }
    if (!havePerCat) {
      // Surface row with empty bars + a fallback overall (across all rows)
      // so users see the full roster rather than dropping the model.
      const fallback = mean(
        group.map((r) => r[metric] as number | null).filter((v): v is number => v !== null && Number.isFinite(v))
      );
      if (fallback === null) continue;
      out.push({ key, name: modelInfoFlat[key] || key, overall: fallback, delta: 0, categories: perCat });
      continue;
    }
    const overall = weightedN ? weightedSum / weightedN : null;
    const valuesArr = Object.values(perCat).filter((v) => v.value !== null).map((v) => v.value as number);
    const spread = valuesArr.length >= 2 ? Math.max(...valuesArr) - Math.min(...valuesArr) : 0;
    out.push({ key, name: modelInfoFlat[key] || key, overall, delta: spread, categories: perCat });
  }
  out.sort((a, b) => {
    const ao = a.overall ?? Infinity;
    const bo = b.overall ?? Infinity;
    return higherIsBetter ? bo - ao : ao - bo;
  });
  return out;
}

export default function CohortAnalysis({ data }: { data: DataShape }) {
  const [cohort, setCohort] = useState<string>(data.cohortDims[0] || "Region");
  const [metric, setMetric] = useState<string>("WER");
  const [scope, setScope] = useState<Scope>("All");
  const [language, setLanguage] = useState<string>("All");
  const [model, setModel] = useState<string>(ALL_MODELS);

  // Reset language when scope changes if current language no longer applies.
  const onScopeChange = (s: Scope) => {
    setScope(s);
    if (language !== "All" && !data.scopedLanguages[s].includes(language)) setLanguage("All");
  };

  // Filter rawRows by scope + language, then aggregate per cohort+metric.
  const filteredRows = useMemo(() => {
    let rs = data.rawRows;
    if (scope !== "All") rs = rs.filter((r) => r.s === scope);
    if (language !== "All") rs = rs.filter((r) => r.l === language);
    return rs;
  }, [data.rawRows, scope, language]);

  const schema = data.cohortSchemas[cohort];
  const higherIsBetter = data.higherIsBetter.includes(metric);

  const rowsRaw = useMemo(
    () =>
      schema
        ? aggregateCohort(filteredRows, cohort, metric as keyof RawRow, schema, data.modelInfoFlat, higherIsBetter)
        : [],
    [filteredRows, cohort, metric, schema, data.modelInfoFlat, higherIsBetter]
  );

  const rows = model === ALL_MODELS ? rowsRaw : rowsRaw.filter((r) => r.name === model);

  const allModelNames = useMemo(() => {
    const fromLb = data.leaderboard?.["All"]?.["All"]?.["WER"]?.map((r) => r.name) ?? [];
    return [ALL_MODELS, ...fromLb];
  }, [data.leaderboard]);

  const allCats = schema?.order ?? [];

  const max = useMemo(() => {
    const vs = rows.flatMap((r) =>
      Object.values(r.categories).map((c) => c.value).filter((v): v is number => v !== null)
    );
    if (!vs.length) return 1;
    if (metric === "SemanticSim" || metric === "CS_F1") return 1;
    return Math.max(0.05, Math.ceil(Math.max(...vs) * 100) / 100);
  }, [rows, metric]);

  const scopeLanguages = data.scopedLanguages[scope] ?? [];
  const langOptions = ["All", ...scopeLanguages];
  const scopeOptions: Scope[] = (data.scopes && data.scopes.length ? data.scopes : ["All", "Indic", "International"]) as Scope[];

  return (
    <section id="cohort" className="pt-28 md:pt-36 scroll-mt-24">
      <SectionHeader
        eyebrow="Multi-Dimensional Analysis"
        title="Cohort Performance Analysis"
        intro="Pick a scope, language, cohort dimension, metric, and (optionally) a single model. Categories are canonical across all 15 models — empty cells mean the filter combination has fewer than 2 samples for that model."
      />

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Dropdown label="Scope" value={scope} options={scopeOptions} onChange={onScopeChange} />
        <Dropdown label="Language" value={language} options={langOptions} onChange={setLanguage} />
        <Dropdown label="Cohort" value={cohort} options={data.cohortDims} onChange={setCohort} />
        <Dropdown
          label="Metric"
          value={metric}
          options={data.metrics}
          onChange={setMetric}
          formatOption={(v) => data.metricLabels[v] || v}
        />
        <Dropdown label="Models" value={model} options={allModelNames} onChange={setModel} />
        <span className="ml-auto text-[12px] text-ink/55">
          {higherIsBetter ? "Higher is better" : "Lower is better"} · {rows.length} model{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-6 dark-card grain-overlay rounded-[24px] p-5 md:p-10 overflow-hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="display text-[22px] md:text-[26px] text-cream">
            {scope === "All" ? "All scopes" : scope} <span className="text-cream/40">·</span>{" "}
            {language === "All" ? "All languages" : language} <span className="text-cream/40">·</span>{" "}
            {cohort} <span className="text-cream/40">·</span> {data.metricLabels[metric]} ({metric})
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-cream/65">
            {allCats.map((c, i) => (
              <span key={c} className="inline-flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {rows.length === 0 ? (
            <div className="py-12 text-center text-cream/55">No data for this combination.</div>
          ) : null}
          {rows.map((r) => (
            <div key={r.key}>
              <div className="flex items-baseline justify-between mb-3">
                <div className="text-cream text-[15px] md:text-[16px] font-medium">{r.name}</div>
                <div className="text-[12px] text-cream/65 tabular-nums">
                  overall {fmt(metric, r.overall)} <span className="mx-2 text-cream/30">·</span>
                  <span
                    className={`px-2 py-0.5 rounded-full ${
                      r.delta > 0.1 ? "bg-rose-500/15 text-rose-300" : "bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    Δ {fmtPP(metric, r.delta)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {allCats.map((cat, i) => {
                  const v = r.categories[cat];
                  const present = v && v.value !== null;
                  const ratio = present ? Math.min(1, (v.value as number) / max) : 0;
                  return (
                    <div
                      key={cat}
                      className="grid grid-cols-[100px_1fr_50px] md:grid-cols-[140px_1fr_70px] items-center gap-3 text-[12px]"
                    >
                      <div className="text-cream/70 truncate">{cat}</div>
                      <div className="bar-track h-6">
                        {present ? (
                          <motion.div
                            className="bar-fill !h-full"
                            style={{ background: COLORS[i % COLORS.length] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${ratio * 100}%` }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                          />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-[10px] text-cream/35 uppercase tracking-wider">
                            no data
                          </div>
                        )}
                      </div>
                      <div className="text-right text-cream/85 tabular-nums">
                        {present ? fmt(metric, v.value) : <span className="text-cream/35">—</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[12px] leading-[1.6] text-cream/55 max-w-[860px]">
          Bars show mean {data.metricLabels[metric]} per cohort category for each model on the selected slice. <strong>Overall</strong> is the weighted average of the visible bars (so the headline number always reconciles with the bar chart). Δ = spread across categories the model has data for. Categories with fewer than 2 audio samples for that model render as empty cells so the axis stays consistent across the roster.
        </p>
      </div>

      <div className="mt-14 mx-auto max-w-[920px]">
        <div className="flex items-center justify-center gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/flourish-left-dark.svg" alt="" className="h-[80px] w-auto opacity-90" />
          <div className="text-center">
            <div className="eyebrow">Findings</div>
            <h3 className="mt-3 display text-[24px] md:text-[30px] text-ink leading-[1.2]">
              Conversational density and dialect mix dominate; gender and age move accuracy little
            </h3>
            <p className="mt-3 text-[15px] leading-[1.65] text-ink/70">
              Rapid-exchange dialogue and Cross-State / Caribbean-Spanish dialect mixes are the two biggest accuracy killers across the merged corpus. Gender and age have modest effects. Duration is largely flat for the production-grade models — the long-tail providers degrade most on short and very-long audio.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/flourish-right-dark.svg" alt="" className="h-[80px] w-auto opacity-90" />
        </div>
      </div>
    </section>
  );
}
