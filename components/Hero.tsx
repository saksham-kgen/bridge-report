"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Stats = { models: number; languages: number; cohorts: number };

function CountUp({ to, duration = 1400 }: { to: number; duration?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <span>{String(n).padStart(2, "0")}</span>;
}

// Figma spec hardcodes the static numbers; data still drives the rest of the site.
const HERO_STATS = [
  { n: 14, label: "ASR Models Tested" },
  { n: 22, label: "International Languages" },
  { n: 7, label: "Cohort Dimensions" },
];

export default function Hero(_props: { hero: Stats }) {
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-flower.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* gentle vignette so text reads */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg/0 via-bg/0 to-bg" />
      </div>

      <div className="mx-auto max-w-page px-6 pt-[170px] pb-32 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="display capitalize text-[60px] md:text-[88px] leading-[1.05] text-ink"
        >
          BRIDGE Report
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-8 flex items-center justify-between max-w-[760px] mx-auto"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/flourish-left-dark.svg" alt="" className="h-[88px] md:h-[100px] w-auto shrink-0" />
          <div className="flex items-center gap-[34px] flex-1 justify-center">
            {HERO_STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center w-[180px]">
                <div className="display text-[56px] md:text-[60px] leading-none text-ink tabular-nums">
                  <CountUp to={s.n} />
                </div>
                <div className="mt-2 text-[14px] md:text-[16px] font-bold text-ink whitespace-nowrap tracking-[-0.03em]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/flourish-right-dark.svg" alt="" className="h-[88px] md:h-[100px] w-auto shrink-0" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-12 mx-auto max-w-[760px]"
        >
          <p className="text-[22px] md:text-[26px] font-medium leading-[1.35] text-ink tracking-[-0.03em]">
            AI Listens to Everyone. Except 5.5 Billion People.
            <br />
            That&rsquo;s the gap we want to bridge.
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-4 mx-auto max-w-[780px] text-[17px] md:text-[19px] leading-[1.55] text-ink/85 tracking-[-0.02em]"
        >
          BRIDGE is the first independent Global South ASR benchmark evaluating 14 global models across 22 languages on a first-of-its-kind 7 metric stack.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-9 flex items-center justify-center gap-7"
        >
          <a href="#findings" className="btn-primary min-w-[200px] whitespace-nowrap">
            Key Findings
          </a>
          <a href="#leaderboard" className="btn-ghost min-w-[200px] whitespace-nowrap">
            View Leaderboard
          </a>
        </motion.div>
      </div>
    </section>
  );
}
