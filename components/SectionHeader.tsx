export default function SectionHeader({
  eyebrow,
  title,
  intro,
  inverse,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  inverse?: boolean;
}) {
  return (
    <div className="max-w-content">
      <div className={inverse ? "eyebrow-light" : "eyebrow"}>{eyebrow}</div>
      <div className="mt-4 flex items-end gap-6">
        <h2
          className={`display capitalize text-[40px] md:text-[52px] leading-[1.05] ${
            inverse ? "text-cream" : "text-ink"
          }`}
        >
          {title}
        </h2>
        <div className={`flex items-center gap-3 flex-1 mb-5 ${inverse ? "text-cream" : "text-ink"}`}>
          <i className="block flex-1 h-px bg-current opacity-15" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/section-glyph.svg" alt="" className="h-[22px] w-auto opacity-90" />
        </div>
      </div>
      {intro ? (
        <p
          className={`mt-5 max-w-[780px] text-[16px] md:text-[18px] leading-[1.55] tracking-[-0.02em] ${
            inverse ? "text-cream/75" : "text-ink/80"
          }`}
        >
          {intro}
        </p>
      ) : null}
    </div>
  );
}
