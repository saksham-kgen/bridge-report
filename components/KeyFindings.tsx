"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SectionHeader from "./SectionHeader";

type DataShape = {
  findings: {
    werLeader: { name: string; value: number } | null;
    csLeader: { name: string; value: number } | null;
    overlapDelta: number | null;
    regionDelta: number | null;
  };
};

export default function KeyFindings({ data }: { data: DataShape }) {
  const wer = data.findings.werLeader;

  const items = [
    {
      eyebrow: "Finding 01 · Leadership",
      title: wer
        ? `${wer.name} leads broadly across Indic and Romance languages`
        : "A single model leads broadly across the corpus",
      body:
        wer
          ? `${wer.name} posts ${(wer.value * 100).toFixed(2)}% mean WER across the merged corpus, with 0.65–1.45% on the three Latin-American Spanish dialects and 1.45% on Brazilian Portuguese. The 7.67pp gap to the second-ranked model on the international slice is wider than the entire spread from rank 2 to rank 11 — Scribe v2 is the unambiguous default wherever it has language coverage.`
          : "",
    },
    {
      eyebrow: "Finding 02 · Tonal inversion",
      title: "Vietnamese inverts the ranking — AssemblyAI Universal leads, Scribe v2 drops to #3",
      body:
        "On Vietnamese, AssemblyAI Universal leads at 13.37% WER, followed by Soniox stt-async-v4 (14.23%) and Scribe v2 (15.47%). The competitive field spans only 7.6pp vs. ~22pp on Spanish. Tonal, syllable-delimited orthography with no Latin-script loanword code-switching means Romance-tuned models don't transfer cleanly. Buyers covering both LATAM and Vietnam should plan for materially different accuracy profiles by language — or run a two-provider architecture.",
    },
    {
      eyebrow: "Finding 03 · Acoustic stress",
      title: data.findings.overlapDelta
        ? `Speaker overlap and rapid turn-taking degrade accuracy by up to ${(data.findings.overlapDelta * 100).toFixed(1)}pp`
        : "Speaker overlap and rapid turn-taking are the biggest accuracy killers",
      body:
        "Indic: overlapping speakers and high conversational density push every model into double-digit WER increases vs. clean monologue. International: rapid-exchange (16.60%) and monologue-like (16.08%) density both run ~3pp worse than balanced dialogue (13.04%); no-gap conversations elevate to 17.81% — consistent with simultaneous speech fragments. Across both corpora the lesson is identical: handling natural conversation, not language coverage, is the unsolved frontier.",
    },
    {
      eyebrow: "Finding 04 · Code-switch quality gap",
      title: "Code-switching is the sharpest Indic-only differentiator — and CS F1 exposes it",
      body:
        "CS F1 spread on Indic runs 0.246 → 0.906. Deepgram Nova-3 (0.906), Azure ConvTranscriber (0.857) and ElevenLabs Scribe v2 (0.830) preserve English vocabulary in native-language speech; the bottom of the field (Gladia v2 at 0.246, GPT-4o mini at 0.327, AssemblyAI at 0.367) systematically drops or transliterates English tokens. WER alone hides this entirely. On Vietnamese the analogous diagnostic is the high-WER / high-SemanticSim split: WER 17% with SemanticSim 0.94 indicates correct meaning rendered in non-reference surface form (often tone-mark encoding variation).",
    },
    {
      eyebrow: "Finding 05 · Geography & dialect",
      title: "Venezuelan Spanish, Brazilian Portuguese, and cross-state Indic pairs are the consistently hardest splits — for most models",
      body:
        "International: Venezuelan Spanish (Caribbean /s/ aspiration) is the hardest dialect for 9 of 11 models (up to +6.57pp vs. Peruvian); Brazilian Portuguese is harder than Spanish for every model except Scribe v2 (PT–ES gap 0.64–8.76pp). Indic: cross-state speaker pairs are harder for most models — but not all. Scribe v2 actually performs better cross-state than same-state on the Indic corpus, an exception worth noting. Aggregate WER systematically understates real-world error rates for these splits — evaluate explicitly on your target dialect.",
    },
    {
      eyebrow: "Finding 06 · Deployment profiles",
      title: "Speed tier separates real-time from batch — and a two-provider stack covers the full language set",
      body:
        "Real-time-capable APIs (Scribe v2, Deepgram nova-3, Soniox stt-async-v4, Gemini 2.5 Flash) form the production-grade band. Batch-only large models (GPT-4o, Gemini 2.5 Pro) win in places at latencies that disqualify them for live applications. For a single-provider deployment, Scribe v2 is the default; for full coverage including Vietnamese, a two-provider architecture (Scribe v2 for LATAM + Indic, AssemblyAI Universal for Vietnamese) achieves close to best-in-class across every language tested.",
    },
  ];

  const [open, setOpen] = useState<number>(0);

  return (
    <section id="findings" className="pt-28 md:pt-36 scroll-mt-24">
      <SectionHeader
        eyebrow="What we offer"
        title="Key Findings"
        intro="Six evidence-based conclusions drawn from the merged BRIDGE corpus — Indic conversational audio plus Spanish (3 dialects), Brazilian Portuguese, and Vietnamese — relevant for enterprise AI teams deploying voice products across the Global South."
      />

      <ul className="mt-10 space-y-3">
        {items.map((it, i) => {
          const isOpen = open === i;
          return (
            <li
              key={i}
              className={`rounded-[14px] border transition-colors ${
                isOpen
                  ? "bg-ink text-cream border-ink"
                  : "bg-white/40 hover:bg-white border-ink/12"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full text-left grid grid-cols-[1fr_auto] items-start gap-6 px-6 md:px-8 py-6"
              >
                <div>
                  <div className={`eyebrow ${isOpen ? "!text-cream/65" : ""}`}>{it.eyebrow}</div>
                  <h3
                    className={`mt-3 display text-[20px] md:text-[24px] leading-[1.2] ${
                      isOpen ? "text-cream" : "text-ink"
                    }`}
                  >
                    {it.title}
                  </h3>
                </div>
                <div
                  className={`mt-1 w-10 h-10 rounded-full grid place-items-center transition-all ${
                    isOpen ? "bg-cream/10" : "bg-ink/6"
                  }`}
                  aria-hidden
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={isOpen ? "/icons/checkbox-x.svg" : "/icons/plus-orange.svg"}
                    alt=""
                    className="w-[18px] h-[18px]"
                  />
                </div>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && it.body ? (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 md:px-8 pb-7 max-w-[820px] text-[15px] md:text-[16px] leading-[1.7] text-cream/80">
                      {it.body}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>

      <div className="mt-14 mx-auto max-w-[920px]">
        <div className="flex items-center justify-center gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/flourish-left-dark.svg" alt="" className="h-[80px] w-auto opacity-90" />
          <div className="text-center">
            <div className="eyebrow">Findings</div>
            <h3 className="mt-3 display text-[24px] md:text-[28px] text-ink leading-tight">
              ElevenLabs Scribe v2 leads broadly — except where it doesn&rsquo;t
            </h3>
            <p className="mt-3 text-[15px] leading-[1.65] text-ink/70">
              Scribe v2 dominates Indic, Spanish, and Portuguese; AssemblyAI Universal owns Vietnamese. Overlap, cross-state pairs, and Caribbean Spanish are the three biggest performance killers across the merged corpus. CS F1 exposes Indic code-switch failures invisible to WER. Don&rsquo;t pick an ASR provider on aggregate WER alone — evaluate on the cohort that matches your deployment.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/flourish-right-dark.svg" alt="" className="h-[80px] w-auto opacity-90" />
        </div>
      </div>
    </section>
  );
}
