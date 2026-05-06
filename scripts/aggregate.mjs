// Aggregate raw per-audio CSV rows into the JSON the UI consumes.
// Indic (First Benchmark): cohort dims = language, gender, region (same/cross state),
//   age group, overlap, gap, conv density. Metrics = WER, CER, SemanticSim, CS_F1, PIER, toWER, OIWER.
// International CSV: same metric set across global languages.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function parseCSV(text) {
  // Robust enough for these files: no embedded quoted commas observed in inspection.
  // Falls back gracefully on stray quoted fields.
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cols = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { cols.push(cur); cur = ""; continue; }
      cur += ch;
    }
    cols.push(cur);
    const obj = {};
    headers.forEach((h, i) => (obj[h] = cols[i]));
    return obj;
  });
}

// Some source columns (notably WER in the "final" indic CSV and the intl CSV)
// arrive as percent strings like "0.17%" or "382.24%". Others (CER, SemSim,
// CS_F1) arrive as decimals. Auto-divide by 100 when "%" is present so every
// downstream code path can assume a 0–1 decimal.
const num = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const s = String(v).trim();
  const hasPct = s.endsWith("%");
  const cleaned = hasPct ? s.slice(0, -1).trim() : s;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return hasPct ? n / 100 : n;
};

const indicRaw = parseCSV(fs.readFileSync(path.join(root, "data/source/indic-benchmark-final.csv"), "utf8"));
const intlRaw = parseCSV(fs.readFileSync(path.join(root, "data/source/intl.csv"), "utf8"));

// AWS Transcribe is included in the published BRIDGE leaderboard (15-model
// roster). Use this set to exclude any future contextual-only providers.
const EXCLUDED_PROVIDERS = new Set();

// Display names + speed tier for each provider/model combo.
const MODEL_INFO = {
  "elevenlabs/scribe_v2": { name: "ElevenLabs Scribe v2", short: "scribe v2", tier: "real-time" },
  "deepgram/nova-3": { name: "Deepgram Nova-3", short: "nova-3", tier: "real-time" },
  "gemini_pro/gemini-2.5-pro": { name: "Gemini 2.5 Pro", short: "gemini 2.5 pro", tier: "batch" },
  "gemini_flash/gemini-2.5-flash": { name: "Gemini 2.5 Flash", short: "gemini 2.5 flash", tier: "real-time" },
  "soniox/stt-async-v4": { name: "Soniox stt-async-v4", short: "soniox v4", tier: "batch" },
  "speechmatics/speechmatics-batch": { name: "Speechmatics", short: "speechmatics", tier: "batch" },
  "gladia/gladia-v2": { name: "Gladia v2", short: "gladia v2", tier: "real-time" },
  "assemblyai/universal": { name: "AssemblyAI Universal", short: "assemblyai", tier: "real-time" },
  "openai_gpt4o/gpt-4o-transcribe": { name: "OpenAI GPT-4o", short: "gpt-4o", tier: "batch" },
  "openai_gpt4o_mini/gpt-4o-mini-transcribe": { name: "OpenAI GPT-4o mini", short: "gpt-4o mini", tier: "batch" },
  "microsoft/ConversationTranscriber": { name: "Azure (Conv. Transcriber)", short: "azure", tier: "batch" },
  "aws_transcribe/aws-transcribe": { name: "AWS Transcribe", short: "aws", tier: "batch" },
  "sarvam_v2/saarika:v2.5": { name: "Sarvam saarika v2.5", short: "saarika v2.5", tier: "real-time" },
  "sarvam_v3/saaras:v3": { name: "Sarvam saaras v3", short: "saaras v3", tier: "real-time" },
  "gnani_vachana/vachana-stt-v3": { name: "Gnani Vachana v3", short: "vachana v3", tier: "real-time" },
};

function modelKey(provider, model) {
  return `${provider}/${model}`;
}

function modelDisplay(key) {
  return MODEL_INFO[key]?.name ?? key;
}

// Strip a trailing parenthetical e.g. "Medium (5-15 min)" -> "Medium"
const stripParen = (s) => (s || "").replace(/\s*\([^)]*\)\s*$/, "").trim();

// ---- Cohort schemas --------------------------------------------------------
// Each cohort dimension has a fixed canonical category set + display order.
// The map() function normalises every raw value (Indic + Intl) onto that set;
// anything that doesn't map (city names, "Unknown", "Youth", "Male"/"Female"
// gender labels, etc.) returns "" so the row is excluded from cohort splits
// for that dimension while still contributing to overall leaderboard numbers.
const COHORT_SCHEMAS = {
  Region: {
    field: "region",
    order: ["Same State", "Cross State"],
    map: (raw) => {
      const v = stripParen(raw);
      if (!v) return "";
      if (v === "Same State") return "Same State";
      if (v === "Cross State" || v === "Different State") return "Cross State";
      return "";
    },
  },
  Gender: {
    field: "gender",
    order: ["Same Gender", "Mixed Gender"],
    map: (raw) => {
      const v = stripParen(raw);
      if (!v) return "";
      const t = v.toLowerCase();
      if (t === "same" || t === "same gender") return "Same Gender";
      if (t === "mixed" || t === "mixed gender") return "Mixed Gender";
      return "";
    },
  },
  Age: {
    field: "age",
    order: ["Same Age Group", "Mixed Age Group"],
    map: (raw) => {
      const v = stripParen(raw);
      if (!v) return "";
      const t = v.toLowerCase();
      if (t === "same" || t === "same age" || t === "same age group") return "Same Age Group";
      if (t === "mixed" || t === "mixed age" || t === "mixed age group") return "Mixed Age Group";
      return "";
    },
  },
  Density: {
    field: "density",
    order: ["Monologue-like", "Balanced Dialogue", "Rapid Exchange"],
    map: (raw) => {
      const v = stripParen(raw);
      if (!v) return "";
      const t = v.toLowerCase();
      if (t === "low" || t.includes("monologue")) return "Monologue-like";
      if (t === "medium" || t.includes("balanced")) return "Balanced Dialogue";
      if (t === "high" || t.includes("rapid")) return "Rapid Exchange";
      return "";
    },
  },
  Duration: {
    field: "duration_cat",
    order: ["Short", "Medium", "Long", "Very Long"],
    map: (raw) => {
      const v = stripParen(raw);
      if (!v) return "";
      if (["Short", "Medium", "Long", "Very Long"].includes(v)) return v;
      return "";
    },
  },
  Overlap: {
    field: "overlap",
    order: ["No Overlap", "Has Overlap"],
    map: (raw) => {
      const v = stripParen(raw);
      if (!v) return "";
      const t = v.toLowerCase();
      if (t === "no overlap" || t === "none" || t === "no") return "No Overlap";
      if (t === "has overlap" || t === "yes" || t === "overlap" || t.startsWith("low") || t.startsWith("high")) return "Has Overlap";
      return "";
    },
  },
  Gap: {
    field: "gap",
    order: ["No Gap", "Low", "Medium", "High"],
    map: (raw) => {
      const v = stripParen(raw);
      if (!v) return "";
      const t = v.toLowerCase();
      if (t === "no gap" || t === "none") return "No Gap";
      if (t.startsWith("low")) return "Low";
      if (t.startsWith("medium")) return "Medium";
      if (t.startsWith("high")) return "High";
      return "";
    },
  },
};

// Apply every schema's map() to a raw row, producing the cohort fields used
// downstream by aggregation.
function normaliseCohorts(raw) {
  const out = {};
  for (const dim of Object.keys(COHORT_SCHEMAS)) {
    const s = COHORT_SCHEMAS[dim];
    out[s.field] = s.map(raw[s.field] ?? "");
  }
  return out;
}

// Normalize an indic row.
const indicRows = indicRaw
  .filter((r) => r.provider && r.model && !EXCLUDED_PROVIDERS.has(r.provider))
  .map((r) => {
    const wer = num(r.WER);
    const cer = num(r.CER);
    const cohorts = normaliseCohorts({
      region: r.Region,
      gender: r.Gender_Type,
      age: r.Age_Group,
      overlap: r.Overlap,
      gap: r.Gap,
      density: r.Conv_Density,
      duration_cat: r.Duration_Cat,
    });
    return {
      key: modelKey(r.provider, r.model),
      provider: r.provider,
      model: r.model,
      language: (r.language || "").trim(),
      cohort: (r.Cohort || "").trim(),
      sub_cohort: (r.Sub_Cohort || "").trim(),
      ...cohorts,
      WER: wer,
      CER: cer,
      SemanticSim: num(r.SemanticSim),
      CS_F1: num(r.CS_F1),
      CS_Recall: num(r.CS_Recall),
      CS_Precision: num(r.CS_Precision),
      PIER: num(r.PIER),
      lwWER: num(r.lwWER),
      WIL: num(r.WIL),
      // toWER / OIWER are still parsed for archival completeness but are
      // not exposed in the published metric set.
      toWER: num(r.toWER),
      OIWER: num(r.OIWER),
      LevenshteinSim: num(r.LevenshteinSim),
    };
  });

const intlRows = intlRaw
  .filter((r) => r.provider && r.model && !EXCLUDED_PROVIDERS.has(r.provider))
  .map((r) => {
    const cohorts = normaliseCohorts({
      region: r.Region,
      gender: r.Gender_Type,
      age: r.Age_Group,
      overlap: r.Overlap,
      gap: r.Gap,
      density: r.Conv_Density,
      duration_cat: r.Duration_Cat,
    });
    return {
      key: modelKey(r.provider, r.model),
      provider: r.provider,
      model: r.model,
      locale: r.locale,
      language: (r.Language || r.locale || "").trim(),
      cohort: (r.Cohort || "").trim(),
      sub_cohort: (r.Sub_Cohort || "").trim(),
      ...cohorts,
      WER: num(r.WER),
      CER: num(r.CER),
      SemanticSim: num(r.SemanticSim),
      WIL: num(r.WIL),
      // Code-switch / phonetic / loan-word metrics are not in the
      // international CSV (no Indic-style code-switching to measure).
      CS_F1: null,
      CS_Recall: null,
      CS_Precision: null,
      PIER: null,
      lwWER: null,
      toWER: null,
      OIWER: null,
      LevenshteinSim: num(r.LevenshteinSim),
      _scope: "International",
    };
  });

// Tag indic rows with scope and merge into a single corpus that drives
// leaderboard + cohort. Per-metric filtering naturally drops null cells
// (so e.g. CS_F1 only ranks indic models).
for (const r of indicRows) r._scope = "Indic";
const allRows = [...indicRows, ...intlRows];

// ----- Aggregations -----

function groupBy(rows, keyFn) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
}

function mean(arr) {
  const xs = arr.filter((x) => x !== null && Number.isFinite(x));
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

const METRICS = ["WER", "CER", "SemanticSim", "CS_F1", "lwWER", "PIER", "WIL"];
const METRIC_LABELS = {
  WER: "Word Error Rate",
  CER: "Character Error Rate",
  SemanticSim: "Semantic Similarity",
  CS_F1: "Code-Switch F1",
  lwWER: "Loan Word WER",
  PIER: "Phoneme-Informed ER",
  WIL: "Word Information Lost",
};
// Higher = better for similarity and F1 scores; lower = better for everything
// else (WER, CER, lwWER, PIER, WIL).
const HIGHER_IS_BETTER = new Set(["SemanticSim", "CS_F1"]);

// 1. Per-(scope, language) leaderboard for each metric.
//    Scope = "All" | "Indic" | "International". Language list is filtered
//    to whatever exists within the selected scope so the UI never offers
//    an invalid combination.
const allLanguages = Array.from(new Set(allRows.map((r) => r.language).filter(Boolean))).sort();
const indicLanguages = Array.from(new Set(indicRows.map((r) => r.language).filter(Boolean))).sort();
const intlLanguagesAll = Array.from(new Set(intlRows.map((r) => r.language).filter(Boolean))).sort();

function rowsForScope(scope) {
  if (scope === "Indic") return indicRows;
  if (scope === "International") return intlRows;
  return allRows;
}

function leaderboardFor(scope, language, metric) {
  const base = rowsForScope(scope);
  const rows = language === "All" ? base : base.filter((r) => r.language === language);
  const byModel = groupBy(rows, (r) => r.key);
  const out = [];
  for (const [key, group] of byModel.entries()) {
    const values = group.map((r) => r[metric]).filter((v) => v !== null);
    if (values.length < 2) continue;
    const m = mean(values);
    if (m === null) continue;
    out.push({
      key,
      name: modelDisplay(key),
      value: m,
      n: values.length,
      tier: MODEL_INFO[key]?.tier ?? "—",
      wer: mean(group.map((r) => r.WER).filter((v) => v !== null)),
    });
  }
  out.sort((a, b) => (HIGHER_IS_BETTER.has(metric) ? b.value - a.value : a.value - b.value));
  return out;
}

const SCOPES = ["All", "Indic", "International"];
const scopedLanguages = {
  All: allLanguages,
  Indic: indicLanguages,
  International: intlLanguagesAll,
};
const leaderboard = {};
for (const scope of SCOPES) {
  leaderboard[scope] = {};
  for (const lang of ["All", ...scopedLanguages[scope]]) {
    leaderboard[scope][lang] = {};
    for (const metric of METRICS) {
      leaderboard[scope][lang][metric] = leaderboardFor(scope, lang, metric);
    }
  }
}

// Keep `languages` as a flat list for any legacy consumer (cohort code etc.)
const languages = allLanguages;

// 2. Cohort splits — every model is reported for every canonical category in
//    the dimension, so the chart always has a consistent axis. Models with no
//    samples in a given category get { value: null, n: 0 } so the UI can
//    render an empty cell instead of pretending the model is missing data.
const COHORT_DIMS = Object.keys(COHORT_SCHEMAS); // [Region, Gender, Age, Overlap, Gap, Density, Duration]

function cohortSplit(dim, metric) {
  const schema = COHORT_SCHEMAS[dim];
  if (!schema) return [];
  const field = schema.field;
  const cats = schema.order; // canonical, ordered
  // Group every model that exists; inside each group, restrict to rows whose
  // dim-field landed in a canonical category. `overall` is computed on that
  // same restricted set so the bars and the headline number are internally
  // consistent (a weighted average of the visible categories).
  const byKeyAll = groupBy(allRows, (r) => r.key);
  const out = [];
  for (const [key, allForModel] of byKeyAll.entries()) {
    const dimRows = allForModel.filter((r) => r[field]);
    const perCat = {};
    let havePerCatData = false;
    let weightedSum = 0;
    let weightedN = 0;
    for (const cat of cats) {
      const xs = dimRows.filter((g) => g[field] === cat).map((g) => g[metric]).filter((v) => v !== null);
      if (xs.length >= 2) {
        const m = mean(xs);
        perCat[cat] = { value: m, n: xs.length };
        weightedSum += m * xs.length;
        weightedN += xs.length;
        havePerCatData = true;
      } else {
        perCat[cat] = { value: null, n: xs.length };
      }
    }
    if (!havePerCatData) {
      // Surface the model with empty bars rather than silently dropping it,
      // but skip computing a synthetic "overall" we can't substantiate.
      const fallback = mean(allForModel.map((r) => r[metric]).filter((v) => v !== null));
      if (fallback === null) continue;
      out.push({
        key,
        name: modelDisplay(key),
        overall: fallback,
        delta: 0,
        categories: perCat,
      });
      continue;
    }
    const overall = weightedN ? weightedSum / weightedN : null;
    const valuesArr = Object.values(perCat).filter((v) => v.value !== null).map((v) => v.value);
    const spread = valuesArr.length >= 2 ? Math.max(...valuesArr) - Math.min(...valuesArr) : 0;
    out.push({
      key,
      name: modelDisplay(key),
      overall,
      delta: spread,
      categories: perCat,
    });
  }
  out.sort((a, b) => (HIGHER_IS_BETTER.has(metric) ? b.overall - a.overall : a.overall - b.overall));
  return out;
}

const cohort = {};
for (const dim of COHORT_DIMS) {
  cohort[dim] = {};
  for (const metric of METRICS) {
    cohort[dim][metric] = cohortSplit(dim, metric);
  }
}

// 3. CS F1 buckets — list each model with their mean CS_F1 across all rows.
//    CS_F1 is indic-only, so this aggregation stays scoped to indicRows.
function csF1Summary() {
  const byKey = groupBy(indicRows, (r) => r.key);
  const out = [];
  for (const [key, group] of byKey.entries()) {
    const xs = group.map((r) => r.CS_F1).filter((v) => v !== null);
    // Threshold of 2 keeps small-coverage providers (e.g. Gnani) in the
    // chart so the model set lines up with the leaderboard above.
    if (xs.length < 2) continue;
    out.push({ key, name: modelDisplay(key), value: mean(xs), n: xs.length });
  }
  out.sort((a, b) => b.value - a.value);
  return out;
}
const csF1 = csF1Summary();

// 4. International leaderboard — by locale and by metric.
const intlLanguages = Array.from(new Set(intlRows.map((r) => r.language).filter(Boolean))).sort();
function intlLeaderboard(lang, metric) {
  const rows = lang === "All" ? intlRows : intlRows.filter((r) => r.language === lang);
  const byKey = groupBy(rows, (r) => r.key);
  const out = [];
  for (const [key, group] of byKey.entries()) {
    const xs = group.map((r) => r[metric]).filter((v) => v !== null);
    if (xs.length < 2) continue;
    out.push({
      key,
      name: modelDisplay(key),
      value: mean(xs),
      n: xs.length,
    });
  }
  out.sort((a, b) => (HIGHER_IS_BETTER.has(metric) ? b.value - a.value : a.value - b.value));
  return out;
}
const intl = {};
for (const lang of ["All", ...intlLanguages]) {
  intl[lang] = {};
  for (const metric of ["WER", "CER", "SemanticSim"]) {
    intl[lang][metric] = intlLeaderboard(lang, metric);
  }
}

// 5. Hero numbers: derive ASR models tested (distinct keys), languages (distinct), cohort dims.
const heroStats = {
  models: Array.from(new Set([...indicRows.map((r) => r.key), ...intlRows.map((r) => r.key)])).length,
  languages: Array.from(new Set([...indicRows.map((r) => r.language), ...intlRows.map((r) => r.language)].filter(Boolean))).length,
  cohorts: COHORT_DIMS.length,
};

// 6. Best-of summary for findings.
const findings = (() => {
  const overall = leaderboardFor("All", "All", "WER");
  const csOverall = leaderboardFor("All", "All", "CS_F1");
  const overlapSplit = cohortSplit("Overlap", "WER");
  const regionSplit = cohortSplit("Region", "WER");
  return {
    werLeader: overall[0] ?? null,
    csLeader: csOverall[0] ?? null,
    overlapDelta: overlapSplit.length ? overlapSplit[0].delta : null,
    regionDelta: regionSplit.length ? regionSplit[0].delta : null,
  };
})();

const out = {
  meta: {
    generatedAt: new Date().toISOString(),
    rowsIndic: indicRows.length,
    rowsIntl: intlRows.length,
  },
  metrics: METRICS,
  metricLabels: METRIC_LABELS,
  higherIsBetter: Array.from(HIGHER_IS_BETTER),
  modelInfo: MODEL_INFO,
  hero: heroStats,
  languages,
  intlLanguages,
  scopes: SCOPES,
  scopedLanguages,
  leaderboard,
  cohort,
  cohortDims: COHORT_DIMS,
  cohortSchemas: Object.fromEntries(
    Object.entries(COHORT_SCHEMAS).map(([k, v]) => [k, { field: v.field, order: v.order }])
  ),
  // Compact per-row dataset for client-side cohort aggregation. Field-key
  // shorthand keeps the JSON small (~340 KB for ~2.2k rows).
  rawRows: allRows.map((r) => ({
    k: r.key,
    s: r._scope,
    l: r.language,
    region: r.region,
    gender: r.gender,
    age: r.age,
    density: r.density,
    duration_cat: r.duration_cat,
    overlap: r.overlap,
    gap: r.gap,
    WER: r.WER,
    CER: r.CER,
    SemanticSim: r.SemanticSim,
    CS_F1: r.CS_F1,
    lwWER: r.lwWER,
    PIER: r.PIER,
    WIL: r.WIL,
  })),
  modelInfoFlat: Object.fromEntries(
    Object.entries(MODEL_INFO).map(([k, v]) => [k, v.name])
  ),
  csF1,
  intl,
  findings,
};

const outDir = path.join(root, "lib");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "data.json"), JSON.stringify(out));
console.log("Wrote lib/data.json");
console.log("hero:", heroStats);
console.log("languages:", languages.length, "intl:", intlLanguages.length);
console.log("leaderboard sample:", leaderboardFor("All", "All", "WER").slice(0, 5).map((r) => `${r.name}: ${(r.value * 100).toFixed(2)}%`));
