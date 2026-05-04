import SectionHeader from "./SectionHeader";

const METRICS = [
  "WER — Word Error Rate",
  "CER — Character Error Rate",
  "Semantic Similarity",
  "CS F1 — Code-Switch F1",
  "PIER — Phoneme-Informed ER",
  "toWER — Time-Offset WER",
  "OIWER — Overlap-Informed WER",
];

const CARDS = [
  {
    head: "(Data collection)",
    body:
      "Dual-speaker audio collected from real conversations: 22+ Indian states across the Indic corpus; three Latin-American Spanish dialects (Argentinian, Peruvian, Venezuelan), Brazilian Portuguese, and Vietnamese on the international side. Contributors sourced to reflect diverse demographics — age, gender, region — with no scripting or prompting. Every file is a genuine naturalistic conversation.",
  },
  {
    head: "(Text normalisation)",
    body:
      "Before any metric runs, both reference and hypothesis pass through three normalisation layers: base cleaning (lowercasing, punctuation stripping, Unicode marks preserved), loanword normalisation (script-variant English words unified), and OIWER normalisation (British/American spelling + mixed-script token expansion).",
  },
  {
    head: "(7-metric evaluation stack)",
    body:
      "Each (audio, model) pair scored on: WER & CER (word/character accuracy), Semantic Similarity (meaning preservation via multilingual embeddings), CS F1 (code-switching quality, Indic-only), PIER (English token recall), toWER (phonetic WER via ITRANS), and OIWER (orthography-informed WER). WER alone is insufficient — on Vietnamese, models can post WER above 17% while SemanticSim stays above 0.93 simply because of tone-mark encoding variation.",
  },
  {
    head: "(Cohort attribution)",
    body:
      "Every conversation is tagged across 7 dimensions: language, gender mix, region (same/cross-state on Indic; dialect on Spanish), age group, speaker overlap, conversational density, and gap pattern. The same scheme runs over both corpora so cross-language comparisons stay apples-to-apples.",
  },
];

export default function Methodology() {
  return (
    <section id="methodology" className="pt-28 md:pt-36 scroll-mt-24">
      <SectionHeader
        eyebrow="Methodology"
        title="How the Benchmark was built?"
        intro="A naturalistic dual-speaker corpus, three normalisation layers run on every transcript, and a 7-metric scoring stack tagged across 7 cohort dimensions — the same pipeline applied identically to Indic and International audio so cross-language results stay comparable."
      />

      <div className="mt-14">
        <div className="text-[16px] font-medium text-ink mb-4">7 Metric Evaluation Stack</div>
        <div className="flex flex-wrap gap-2">
          {METRICS.map((m) => (
            <span key={m} className="metric-pill">{m}</span>
          ))}
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">
        {CARDS.map((c) => (
          <div key={c.head} className="border-t border-ink/15 pt-6">
            <div className="display italic text-[20px] text-ink/85">{c.head}</div>
            <p className="mt-4 text-[16px] leading-[1.65] text-ink/75">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
