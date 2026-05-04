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

const num = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const s = String(v).replace("%", "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const indicRaw = parseCSV(fs.readFileSync(path.join(root, "data/indic.csv"), "utf8"));
const intlRaw = parseCSV(fs.readFileSync(path.join(root, "data/intl.csv"), "utf8"));

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

// Indic region uses categorical labels like "Same State" / "Different State".
// Intl region holds city names (Jacareí, São Paulo, ...) which don't belong
// on the same axis, so we drop region for those rows entirely.
const VALID_REGIONS = new Set(["Same State", "Different State", "Cross State", "Unknown"]);
const cleanRegion = (s) => (VALID_REGIONS.has(s) ? s : "");

// Normalize an indic row.
const indicRows = indicRaw
  .filter((r) => r.provider && r.model)
  .map((r) => {
    const wer = num(r.WER);
    const cer = num(r.CER);
    return {
      key: modelKey(r.provider, r.model),
      provider: r.provider,
      model: r.model,
      language: (r.language || "").trim(),
      cohort: (r.Cohort || "").trim(),
      sub_cohort: (r.Sub_Cohort || "").trim(),
      gender: (r.Gender_Type || "").trim(),
      region: cleanRegion((r.Region || "").trim()),
      age: (r.Age_Group || "").trim(),
      overlap: stripParen(r.Overlap),
      gap: stripParen(r.Gap),
      density: stripParen(r.Conv_Density),
      duration_cat: stripParen(r.Duration_Cat),
      WER: wer,
      CER: cer,
      SemanticSim: num(r.SemanticSim),
      CS_F1: num(r.CS_F1),
      CS_Recall: num(r.CS_Recall),
      CS_Precision: num(r.CS_Precision),
      PIER: num(r.PIER),
      toWER: num(r.toWER),
      OIWER: num(r.OIWER),
      LevenshteinSim: num(r.LevenshteinSim),
    };
  });

const intlRows = intlRaw
  .filter((r) => r.provider && r.model)
  .map((r) => {
    const wer = num(String(r.WER).replace("%", ""));
    return {
      key: modelKey(r.provider, r.model),
      provider: r.provider,
      model: r.model,
      locale: r.locale,
      language: (r.Language || r.locale || "").trim(),
      cohort: (r.Cohort || "").trim(),
      sub_cohort: (r.Sub_Cohort || "").trim(),
      gender: (r.Gender_Type || "").trim(),
      region: cleanRegion((r.Region || "").trim()),
      age: (r.Age_Group || "").trim(),
      overlap: stripParen(r.Overlap),
      gap: stripParen(r.Gap),
      density: stripParen(r.Conv_Density),
      duration_cat: stripParen(r.Duration_Cat),
      WER: wer === null ? null : wer / 100,
      CER: num(r.CER),
      SemanticSim: num(r.SemanticSim),
      // Code-switch / phonetic / overlap-informed metrics are not in the international CSV.
      CS_F1: null,
      CS_Recall: null,
      CS_Precision: null,
      PIER: null,
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

const METRICS = ["WER", "CER", "SemanticSim", "CS_F1", "PIER", "toWER", "OIWER"];
const METRIC_LABELS = {
  WER: "Word Error Rate",
  CER: "Character Error Rate",
  SemanticSim: "Semantic Similarity",
  CS_F1: "Code-Switch F1",
  PIER: "Phoneme-Informed ER",
  toWER: "Time-Offset WER",
  OIWER: "Overlap-Informed WER",
};
// For these, lower is better. For SemanticSim and CS_F1, higher is better.
const HIGHER_IS_BETTER = new Set(["SemanticSim", "CS_F1"]);

// 1. Per-language overall leaderboard for each metric.
const languages = Array.from(new Set(allRows.map((r) => r.language).filter(Boolean))).sort();

function leaderboardFor(language, metric) {
  const rows = language === "All" ? allRows : allRows.filter((r) => r.language === language);
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
      // pair metric: WER alongside whatever is selected (so the right-of-bar number is meaningful)
      wer: mean(group.map((r) => r.WER).filter((v) => v !== null)),
    });
  }
  out.sort((a, b) => (HIGHER_IS_BETTER.has(metric) ? b.value - a.value : a.value - b.value));
  return out;
}

const leaderboard = {};
for (const lang of ["All", ...languages]) {
  leaderboard[lang] = {};
  for (const metric of METRICS) {
    leaderboard[lang][metric] = leaderboardFor(lang, metric);
  }
}

// 2. Cohort splits — by region (same/cross state), gender, age, overlap, density, gap, duration.
const COHORT_DIMS = {
  Region: "region",
  Gender: "gender",
  Age: "age",
  Overlap: "overlap",
  Gap: "gap",
  Density: "density",
  Duration: "duration_cat",
};

function cohortSplit(dim, metric) {
  const field = COHORT_DIMS[dim];
  if (!field) return [];
  const byKey = groupBy(allRows.filter((r) => r[field]), (r) => r.key);
  const cats = Array.from(new Set(allRows.map((r) => r[field]).filter(Boolean)));
  const out = [];
  for (const [key, group] of byKey.entries()) {
    const perCat = {};
    for (const cat of cats) {
      const xs = group.filter((g) => g[field] === cat).map((g) => g[metric]).filter((v) => v !== null);
      if (xs.length < 2) continue;
      perCat[cat] = { value: mean(xs), n: xs.length };
    }
    const valuesArr = Object.values(perCat).map((v) => v.value);
    if (valuesArr.length < 2) continue;
    const overall = mean(group.map((r) => r[metric]).filter((v) => v !== null));
    const spread = Math.max(...valuesArr) - Math.min(...valuesArr);
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
for (const dim of Object.keys(COHORT_DIMS)) {
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
    if (xs.length < 5) continue;
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
  cohorts: Object.keys(COHORT_DIMS).length,
};

// 6. Best-of summary for findings.
const findings = (() => {
  const overall = leaderboardFor("All", "WER");
  const csOverall = leaderboardFor("All", "CS_F1");
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
  leaderboard,
  cohort,
  cohortDims: Object.keys(COHORT_DIMS),
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
console.log("leaderboard sample:", leaderboardFor("All", "WER").slice(0, 5).map((r) => `${r.name}: ${(r.value * 100).toFixed(2)}%`));
