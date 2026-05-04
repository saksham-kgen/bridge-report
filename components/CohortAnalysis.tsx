"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import SectionHeader from "./SectionHeader";
import Dropdown from "./Dropdown";

type CohortRow = {
  key: string;
  name: string;
  overall: number;
  delta: number;
  categories: Record<string, { value: number; n: number }>;
};

type DataShape = {
  metrics: string[];
  metricLabels: Record<string, string>;
  higherIsBetter: string[];
  cohort: Record<string, Record<string, CohortRow[]>>;
  cohortDims: string[];
  leaderboard: Record<string, Record<string, { name: string }[]>>;
};

function fmt(metric: string, v: number) {
  if (metric === "SemanticSim" || metric === "CS_F1") return v.toFixed(3);
  return `${(v * 100).toFixed(1)}%`;
}
function fmtPP(metric: string, v: number) {
  if (metric === "SemanticSim" || metric === "CS_F1") return `±${v.toFixed(3)}`;
  return `±${(v * 100).toFixed(1)}pp`;
}

export default function CohortAnalysis({ data }: { data: DataShape }) {
  const [cohort, setCohort] = useState<string>(data.cohortDims[0] || "Region");
  const [metric, setMetric] = useState<string>("WER");

  const allModelNames = useMemo(() => {
    const names = data.leaderboard["All"]?.["WER"]?.map((r) => r.name) ?? [];
    return ["All models", ...names];
  }, [data.leaderboard]);
  const [model, setModel] = useState<string>("All models");

  const rowsRaw = data.cohort[cohort]?.[metric] ?? [];
  const rows = model === "All models" ? rowsRaw.slice(0, 5) : rowsRaw.filter((r) => r.name === model);

  const allCats = useMemo(() => {
    const set = new Set<string>();
    for (const r of rowsRaw) Object.keys(r.categories).forEach((k) => set.add(k));
    return Array.from(set);
  }, [rowsRaw]);

  const max = useMemo(() => {
    const vs = rows.flatMap((r) => Object.values(r.categories).map((c) => c.value));
    if (!vs.length) return 1;
    if (metric === "SemanticSim" || metric === "CS_F1") return 1;
    return Math.max(0.05, Math.ceil(Math.max(...vs) * 100) / 100);
  }, [rows, metric]);

  const ticks = 6;

  return (
    <section id="cohort" className="pt-28 md:pt-36 scroll-mt-24">
      <SectionHeader
        eyebrow="Multi-Dimensional Analysis"
        title="Cohort Performance Analysis"
        intro="Choose a cohort dimension, a metric, and a model to see how performance shifts across conditions. All three filters work together — any combination is valid."
      />

      <div className="mt-10 flex flex-wrap items-center gap-3">
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
          {data.higherIsBetter.includes(metric) ? "Higher is better" : "Lower is better"}
        </span>
      </div>

      <div className="mt-6 dark-card grain-overlay rounded-[24px] p-5 md:p-10 overflow-hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="display text-[22px] md:text-[26px] text-cream">
            {cohort} <span className="text-cream/40">·</span> {data.metricLabels[metric]} ({metric}){" "}
            <span className="text-cream/40">·</span> {model}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-cream/65">
            {allCats.slice(0, 6).map((c, i) => (
              <span key={c} className="inline-flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{
                    background: i === 0 ? "#FF6E42" : i === 1 ? "#FFA682" : i === 2 ? "#F5C9B8" : "#7A7472",
                  }}
                />
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
            <div key={r.key} className="">
              <div className="flex items-baseline justify-between mb-3">
                <div className="text-cream text-[15px] md:text-[16px] font-medium">{r.name}</div>
                <div className="text-[12px] text-cream/65 tabular-nums">
                  overall {fmt(metric, r.overall)} <span className="mx-2 text-cream/30">·</span>
                  <span className={`px-2 py-0.5 rounded-full ${r.delta > 0.1 ? "bg-rose-500/15 text-rose-300" : "bg-emerald-500/15 text-emerald-300"}`}>
                    Δ {fmtPP(metric, r.delta)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {allCats.map((cat, i) => {
                  const v = r.categories[cat];
                  if (!v) return null;
                  const ratio = Math.min(1, v.value / max);
                  const colors = ["#FF6E42", "#FFA682", "#F5C9B8", "#9F8E84", "#7A7472", "#574F4B"];
                  return (
                    <div key={cat} className="grid grid-cols-[100px_1fr_50px] md:grid-cols-[140px_1fr_70px] items-center gap-3 text-[12px]">
                      <div className="text-cream/70 truncate">{cat}</div>
                      <div className="bar-track h-6">
                        <motion.div
                          className="bar-fill !h-full"
                          style={{ background: colors[i % colors.length] }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${ratio * 100}%` }}
                          viewport={{ once: false, margin: "-100px" }}
                          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                      <div className="text-right text-cream/85 tabular-nums">{fmt(metric, v.value)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[12px] leading-[1.6] text-cream/55 max-w-[860px]">
          Bars show mean {data.metricLabels[metric]} per cohort category for each model. Δ = spread across the displayed categories. Categories with fewer than 2 audio samples for that model are excluded.
        </p>

        {/* Hidden ticks for visual rhythm */}
        <div className="sr-only">{ticks}</div>
      </div>

      <div className="mt-14 mx-auto max-w-[920px]">
        <div className="flex items-center justify-center gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/flourish-left-dark.svg" alt="" className="h-[80px] w-auto opacity-90" />
          <div className="text-center">
            <div className="eyebrow">Findings</div>
            <h3 className="mt-3 display text-[24px] md:text-[30px] text-ink leading-[1.2]">
              Speaker overlap is the biggest acoustic stressor
            </h3>
            <p className="mt-3 text-[15px] leading-[1.65] text-ink/70">
              Cross-state pairs are harder than same-state. Gender and age have modest effects. Duration and gap patterns show minimal impact — language and accent dominate.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/flourish-right-dark.svg" alt="" className="h-[80px] w-auto opacity-90" />
        </div>
      </div>
    </section>
  );
}
