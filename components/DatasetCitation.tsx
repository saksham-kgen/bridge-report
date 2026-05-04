"use client";
import { useState } from "react";
import SectionHeader from "./SectionHeader";

const CITATION = `@misc{humynlabs_indicbench_2026,
  title  = {HumynLabs-IndicBench: State of Indic Conversational ASR},
  author = {HumynLabs Research Team},
  year   = {2026},
  month  = {April},
  note   = {Benchmark evaluating 14+ commercial ASR APIs on dual-speaker Indic conversations across 15+ languages, 7 cohort dimensions},
  url    = {https://humynlabs.ai/indicbench},
  howpublished = {HumynLabs}
}`;

export default function DatasetCitation() {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(CITATION);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <section id="dataset" className="pt-28 md:pt-36 pb-32 scroll-mt-24">
      <SectionHeader
        eyebrow="Access the dataset"
        title="Dataset access & citation"
        intro="IndicBench data is available on Hugging Face. If you use this benchmark in your research, please cite the following."
      />

      <div className="mt-10 rounded-[20px] bg-accent text-white p-8 md:p-10 overflow-hidden relative">
        <div className="absolute inset-0 opacity-15 mix-blend-overlay">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 30% 20%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 80%, #fff 0%, transparent 50%)",
            }}
          />
        </div>
        <div className="relative">
          <div className="eyebrow !text-white/85">Access the dataset</div>
          <p className="mt-4 max-w-[760px] text-[16px] md:text-[17px] leading-[1.6] text-white/90">
            Audio files, golden transcripts, speaker metadata, cohort labels, and evaluation scripts are available under the IndicBench dataset card. Additional languages and an overlap-focused corpus are in preparation.
          </p>
          <a
            href="https://huggingface.co/humyn-labs/datasets"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-3 rounded-full bg-white text-ink px-5 py-3 font-medium hover:bg-ink hover:text-white transition-colors"
          >
            <span aria-hidden>🤗</span>
            Hugging Face
            <span aria-hidden>↗</span>
          </a>
        </div>
      </div>

      <div className="mt-6 rounded-[20px] border border-ink/10 bg-white/60 backdrop-blur-sm p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="eyebrow">Citation</div>
          <button
            type="button"
            onClick={onCopy}
            className="text-[12px] uppercase tracking-[0.16em] px-3 py-1.5 rounded-full border border-ink/25 hover:bg-ink hover:text-cream transition-colors"
          >
            {copied ? "Copied" : "Copy BibTeX"}
          </button>
        </div>
        <pre className="mt-4 text-[13px] leading-[1.65] font-mono text-ink/85 whitespace-pre-wrap break-words">
{CITATION}
        </pre>
      </div>

      <div className="mt-16 text-center max-w-[640px] mx-auto">
        <div className="eyebrow">Collaborate or partner</div>
        <p className="mt-4 text-[15px] leading-[1.7] text-ink/75">
          If you work on Indic ASR and want to submit your model for evaluation, or partner on expanding the corpus, contact the IndicBench team at{" "}
          <a className="underline decoration-accent underline-offset-4" href="https://humynlabs.ai">
            humynlabs.ai
          </a>
          .
        </p>
      </div>
    </section>
  );
}
