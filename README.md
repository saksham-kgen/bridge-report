# BRIDGE Report

Independent Global South ASR benchmark by **Humyn Labs** — evaluating 14+ commercial ASR APIs across Indic, Spanish (3 dialects), Brazilian Portuguese, and Vietnamese on a 7-metric stack.

> **Live:** https://bridge-report-hazel.vercel.app

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Recharts (charts)
- Rethink Sans (Google Fonts)

All metric/leaderboard/cohort data is precomputed from CSV at build time via [`scripts/aggregate.mjs`](scripts/aggregate.mjs) into `lib/data.json` (already committed; rerun the script if you swap CSVs).

## Local development

```bash
npm install
npm run dev          # http://localhost:3007
```

To regenerate aggregated data after changing the source CSVs in `data/`:

```bash
node scripts/aggregate.mjs
```

## Project structure

```
app/                    Next.js App Router (layout, globals.css, page)
components/             All section components
  Header.tsx            Top nav
  Hero.tsx              BRIDGE Report hero with stats counter
  WhySection.tsx        Collapsible "Why this Benchmark exists?" card
  Methodology.tsx       Methodology + 7 metric pills
  Leaderboard.tsx       Interactive model leaderboard (filter by language + metric)
  KeyFindings.tsx       6-finding accordion
  CohortAnalysis.tsx    3-axis cohort chart (cohort × metric × model)
  HiddenQualityGap.tsx  CS F1 chart + bucket selector
  DatasetCitation.tsx   Hugging Face CTA + BibTeX
  Footer.tsx
data/                   Source CSVs (Indic + International)
lib/data.json           Aggregated data consumed by the page
public/                 Static assets — Figma SVG icons + hero floral image
scripts/aggregate.mjs   CSV → data.json aggregation
```

## Deployment

Production deploys to Vercel:

```bash
npx vercel --prod
```

The project is linked to `saksham-s-projects12/bridge-report` on Vercel (see `.vercel/project.json`, gitignored).
