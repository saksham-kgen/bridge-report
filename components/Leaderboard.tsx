"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import SectionHeader from "./SectionHeader";
import Dropdown from "./Dropdown";

type Row = { key: string; name: string; value: number; n: number; tier: string; wer: number | null };
type DataShape = {
  metrics: string[];
  metricLabels: Record<string, string>;
  higherIsBetter: string[];
  languages: string[];
  leaderboard: Record<string, Record<string, Row[]>>;
  findings: { werLeader: { name: string; value: number } | null };
};

function formatMetric(metric: string, v: number) {
  if (metric === "SemanticSim" || metric === "CS_F1") return v.toFixed(3);
  return `${(v * 100).toFixed(1)}%`;
}

export default function Leaderboard({ data }: { data: DataShape }) {
  const [language, setLanguage] = useState<string>("All");
  const [metric, setMetric] = useState<string>("WER");

  const rows = useMemo<Row[]>(() => {
    const list = data.leaderboard[language]?.[metric] ?? [];
    return list.slice(0, 14);
  }, [data.leaderboard, language, metric]);

  const higherBetter = data.higherIsBetter.includes(metric);
  const max = useMemo(() => {
    const vs = rows.map((r) => r.value);
    if (!vs.length) return 1;
    if (metric === "SemanticSim" || metric === "CS_F1") return 1;
    return Math.max(0.05, Math.ceil(Math.max(...vs) * 100) / 100);
  }, [rows, metric]);

  const ticks = 6;
  const step = max / ticks;

  const langOptions = ["All", ...data.languages];
  const metricOptions = data.metrics;

  return (
    <section id="leaderboard" className="pt-28 md:pt-36 scroll-mt-24">
      <SectionHeader
        eyebrow="Results"
        title="Model Leaderboard"
        intro="All 14 models on WER (and more). Filter by language to see how each model performs per-language. Filter by metric to change what the bars represent."
      />

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Dropdown
          label="Language"
          value={language}
          options={langOptions}
          onChange={setLanguage}
        />
        <Dropdown
          label="Metric"
          value={metric}
          options={metricOptions}
          onChange={setMetric}
          formatOption={(v) => data.metricLabels[v] || v}
        />
        <span className="ml-auto text-[12px] text-ink/55">
          {higherBetter ? "Higher is better" : "Lower is better"} · {rows.length} models
        </span>
      </div>

      <div className="mt-6 dark-card grain-overlay rounded-[24px] overflow-hidden p-5 md:p-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="display text-[22px] md:text-[26px] text-cream">
            {language === "All" ? "All languages" : language} <span className="text-cream/40">·</span>{" "}
            {data.metricLabels[metric]} ({metric})
          </div>
          <div className="eyebrow-light !text-cream/55">
            {higherBetter ? "Higher" : "Lower"} is better · {data.metricLabels[metric]}
          </div>
        </div>

        <div className="mt-8">
          <div className="grid grid-cols-[110px_1fr_50px] md:grid-cols-[220px_1fr_72px] gap-4 items-center">
            <div />
            <div className="relative h-7 text-[11px] text-cream/50 tabular-nums">
              <div className="absolute inset-0 flex">
                {Array.from({ length: ticks + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 flex items-end justify-end pr-1 border-l border-cream/10 first:border-0"
                  >
                    {metric === "SemanticSim" || metric === "CS_F1"
                      ? (i * step).toFixed(2)
                      : `${Math.round(i * step * 100)}%`}
                  </div>
                ))}
              </div>
            </div>
            <div />
          </div>

          <ul className="mt-2 divide-y divide-cream/8">
            {rows.length === 0 ? (
              <li className="py-12 text-center text-cream/55">No data for this combination.</li>
            ) : null}
            {rows.map((r, i) => {
              const ratio = Math.min(1, Math.max(0, r.value / max));
              const isLeader = i === 0;
              return (
                <li
                  key={r.key}
                  className="grid grid-cols-[110px_1fr_50px] md:grid-cols-[220px_1fr_72px] items-center gap-4 py-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate text-cream text-[14px] md:text-[15px]">{r.name}</span>
                    {isLeader ? (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-cream/95 text-ink text-[10px] px-2 py-0.5 uppercase tracking-wider font-medium">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/icons/spark-orange.svg" alt="" className="w-3 h-3" />
                        Best
                      </span>
                    ) : null}
                  </div>
                  <div className="bar-track">
                    <motion.div
                      className="bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${ratio * 100}%` }}
                      transition={{ duration: 0.7, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <span className="text-[12px] tabular-nums">{formatMetric(metric, r.value)}</span>
                    </motion.div>
                  </div>
                  <div className="text-right text-cream/55 text-[12px] tabular-nums">
                    {r.n}
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-8 text-[12px] leading-[1.6] text-cream/55 max-w-[800px]">
            Bars show mean {data.metricLabels[metric]} per model on the selected language slice. Models with fewer than 2 audio samples per slice are excluded. Source: 2,139 indic + 577 international evaluation rows.
          </p>
        </div>
      </div>

      <div className="mt-14 mx-auto max-w-[860px]">
        <div className="flex items-center justify-center gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/flourish-left-dark.svg" alt="" className="h-[80px] w-auto opacity-90" />
          <div className="text-center">
            <div className="eyebrow">Findings</div>
            <h3 className="mt-3 display text-[24px] md:text-[28px] text-ink leading-tight">
              {data.findings.werLeader
                ? `${data.findings.werLeader.name} leads overall at ${(data.findings.werLeader.value * 100).toFixed(2)}% WER`
                : "Leaderboard summary"}
            </h3>
            <p className="mt-3 text-[15px] leading-[1.65] text-ink/70">
              The only model simultaneously accurate and code-switch aware. Deepgram nova-3 has the best CS F1 but limited language coverage. Several models sit above 30% WER — not production-ready for Indic conversational audio.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/flourish-right-dark.svg" alt="" className="h-[80px] w-auto opacity-90" />
        </div>
      </div>
    </section>
  );
}
