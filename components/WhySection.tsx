"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const CARDS = [
  {
    title: "Real conversations, not read speech",
    body:
      "Every file in BRIDGE is a genuine two-person conversation with natural overlap, spontaneous disfluencies, and unscripted code-switching — not a speaker reading from a prompt.",
  },
  {
    title: "Geographically distributed corpus",
    body:
      "Indic speakers from 22+ Indian states; Spanish across three Latin American dialects (Argentinian, Peruvian, Venezuelan); Brazilian Portuguese; and Vietnamese — capturing accent, dialect, and tonal variation across three language families.",
  },
  {
    title: "7 metrics, not just WER",
    body:
      "WER alone is blind to meaning and code-switching correctness. Our stack adds CER, Semantic Similarity, CS F1, PIER, toWER and OIWER — so a model can't hide poor Hindi-English switching or tone-mark drift behind a decent word count.",
  },
];

export default function WhySection() {
  const [open, setOpen] = useState(true);
  return (
    <section id="why" className="pt-24 md:pt-32 scroll-mt-24">
      <div className="dark-card grain-overlay rounded-[24px] overflow-hidden p-10 md:p-14 text-cream">
        <div className="flex items-center justify-between">
          <div className="eyebrow-light">Context</div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="why-cards"
            aria-label={open ? "Collapse cards" : "Expand cards"}
            className="w-[44px] h-[44px] rounded-md bg-white grid place-items-center shadow-[0_24px_50px_-12px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={open ? "/icons/checkbox-x.svg" : "/icons/plus-orange.svg"}
              alt=""
              className="w-5 h-5"
            />
          </button>
        </div>
        <h2 className="display mt-6 text-[40px] md:text-[52px] leading-[1.05] text-cream">
          Why this Benchmark exists?
        </h2>
        <p className="mt-5 max-w-[820px] text-[18px] md:text-[20px] leading-[1.5] text-cream/85">
          From speaker recruitment to evaluation pipeline — the decisions that make BRIDGE reproducible, auditable, and resistant to benchmark gaming across every language family in the corpus.
        </p>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="cards"
              id="why-cards"
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 48 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {CARDS.map((c, i) => (
                  <motion.div
                    key={c.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-[14px] p-7 bg-[#2c2926] border border-white/6 hover:border-accent/40 transition-colors"
                  >
                    <h3 className="display text-[22px] leading-[1.18] text-cream">{c.title}</h3>
                    <p className="mt-5 text-[15px] leading-[1.65] text-cream/70">{c.body}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
