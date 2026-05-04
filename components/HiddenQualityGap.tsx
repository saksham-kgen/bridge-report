"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import SectionHeader from "./SectionHeader";

type CSItem = { key: string; name: string; value: number; n: number };
type DataShape = { csF1: CSItem[] };

const BUCKETS = [
  {
    label: "Strong code-switching — CS F1 ≥ 0.7",
    range: [0.7, 1.01] as const,
    body:
      "These models preserve English vocabulary in Indic speech. Both are viable for enterprise applications where English terminology appears in native-language conversation.",
  },
  {
    label: "Partial — CS F1 0.2–0.7",
    range: [0.2, 0.7] as const,
    body:
      "These models handle some code-switching. Performance varies by language and English density — verify on your specific use case before shipping.",
  },
  {
    label: "Zero code-switching — CS F1 < 0.2",
    range: [0, 0.2] as const,
    body:
      "These models systematically transliterate or drop English tokens. Not suitable for code-mixed enterprise Indic applications.",
  },
] as const;

export default function HiddenQualityGap({ data }: { data: DataShape }) {
  const [bucketIdx, setBucketIdx] = useState<number>(1);

  const ranked = useMemo(() => [...data.csF1].sort((a, b) => b.value - a.value), [data.csF1]);
  const max = Math.max(0.5, Math.ceil((ranked[0]?.value || 0.5) * 10) / 10);

  const bucketModels = useMemo(() => {
    const [lo, hi] = BUCKETS[bucketIdx].range;
    return ranked.filter((m) => m.value >= lo && m.value < hi);
  }, [ranked, bucketIdx]);

  return (
    <section id="hidden-gap" className="pt-28 md:pt-36 scroll-mt-24">
      <SectionHeader
        eyebrow="Multi-Dimensional Analysis"
        title="The Hidden Quality Gap"
        intro={`CS F1 measures whether English vocabulary embedded in Indic speech is preserved — not dropped, not transliterated. A model that turns "data backup" into "डेटा बैकअप" scores 0 on CS F1. Invisible to WER. Fatal for downstream applications.`}
      />

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-6">
        <div className="dark-card grain-overlay rounded-[24px] p-5 md:p-10">
          <div className="display text-[20px] md:text-[22px] text-cream">
            CS F1 Score — All Models <span className="text-cream/40">(higher = better)</span>
          </div>
          <ul className="mt-7 space-y-3">
            {ranked.length === 0 ? (
              <li className="py-10 text-center text-cream/55">CS F1 data not available.</li>
            ) : null}
            {ranked.map((m, i) => {
              const ratio = Math.min(1, m.value / max);
              const inBucket =
                m.value >= BUCKETS[bucketIdx].range[0] && m.value < BUCKETS[bucketIdx].range[1];
              return (
                <li
                  key={m.key}
                  className={`grid grid-cols-[110px_1fr_50px] md:grid-cols-[170px_1fr_64px] items-center gap-3 transition-opacity ${
                    inBucket ? "opacity-100" : "opacity-50"
                  }`}
                >
                  <div className="text-cream text-[13px] md:text-[14px] truncate">{m.name}</div>
                  <div className="bar-track h-7">
                    <motion.div
                      className="bar-fill !h-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${ratio * 100}%` }}
                      viewport={{ once: false, margin: "-80px" }}
                      transition={{ duration: 0.6, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <div className="text-right text-cream/85 text-[12px] tabular-nums">
                    {m.value.toFixed(3)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-4">
          {BUCKETS.map((b, i) => {
            const active = i === bucketIdx;
            const [lo, hi] = b.range;
            const matches = ranked.filter((m) => m.value >= lo && m.value < hi);
            return (
              <button
                key={b.label}
                type="button"
                onClick={() => setBucketIdx(i)}
                className={`w-full text-left rounded-[16px] p-6 border transition-colors ${
                  active ? "bg-ink text-cream border-ink" : "bg-white/40 border-ink/12 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  {active ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src="/icons/checkbox-checked.svg" alt="" className="w-5 h-5 rounded" />
                  ) : (
                    <span className="w-5 h-5 rounded border border-ink/35 bg-white" />
                  )}
                  <span className="font-medium text-[15px]">{b.label}</span>
                </div>
                <p className={`mt-3 text-[13.5px] leading-[1.6] ${active ? "text-cream/75" : "text-ink/70"}`}>
                  {b.body}
                </p>
                <div
                  className={`mt-3 text-[12px] ${active ? "text-cream/60" : "text-ink/55"} tabular-nums`}
                >
                  {matches.length} model{matches.length === 1 ? "" : "s"} in this bucket
                  {matches.length
                    ? ` · ${matches.map((m) => `${m.name} (${m.value.toFixed(3)})`).join(", ")}`
                    : ""}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-14 mx-auto max-w-[920px]">
        <div className="flex items-center justify-center gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/flourish-left-dark.svg" alt="" className="h-[80px] w-auto opacity-90" />
          <div className="text-center">
            <div className="eyebrow">Findings</div>
            <h3 className="mt-3 display text-[24px] md:text-[28px] text-ink leading-tight">
              The CS F1 spread is wider than the WER spread for top models
            </h3>
            <p className="mt-3 text-[15px] leading-[1.65] text-ink/70">
              The leader on CS F1 may not be #1 on WER. Models clustered near zero CS F1 hide a fundamental unsuitability for code-mixed Indic enterprise speech, even when their headline WER looks acceptable.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/flourish-right-dark.svg" alt="" className="h-[80px] w-auto opacity-90" />
        </div>
      </div>
    </section>
  );
}
