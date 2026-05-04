"use client";
import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "why", label: "Why this Benchmark exists?" },
  { id: "methodology", label: "How the Benchmark was built?" },
  { id: "leaderboard", label: "Model Leaderboard" },
  { id: "findings", label: "Key Findings" },
  { id: "cohort", label: "Cohort Performance Analysis" },
  { id: "hidden-gap", label: "The Hidden Quality Gap" },
  { id: "dataset", label: "Dataset access & citation" },
];

export default function LeftRail() {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0.01 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <aside className="left-rail hidden lg:block fixed left-6 top-1/2 -translate-y-1/2 w-[220px] z-30">
      <div className="text-[10px] uppercase tracking-[0.18em] text-ink/50 mb-4">Contents</div>
      <nav className="flex flex-col">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`toc-link ${active === s.id ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <span className="leading-tight">{s.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
