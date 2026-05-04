const COLS = [
  {
    head: "Legal",
    links: ["T&C", "Privacy Policy", "Documentation"],
  },
  {
    head: "Social",
    links: ["X", "Reddit", "LinkedIn", "Instagram"],
  },
  {
    head: "Company",
    links: ["Careers", "News", "Case Studies"],
  },
];

export default function Footer() {
  return (
    <footer className="relative bg-ink text-cream pt-20 pb-14 mt-24 overflow-hidden">
      <div className="absolute inset-0 opacity-30 mix-blend-overlay">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/blue-grain.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </div>
      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-12">
          {COLS.map((c) => (
            <div key={c.head}>
              <h4 className="text-[18px] font-medium text-cream">{c.head}</h4>
              <ul className="mt-5 space-y-3 text-[14px] text-cream/65">
                {c.links.map((l) => (
                  <li key={l}>
                    <a className="hover:text-cream transition-colors" href="#">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="md:text-right">
            <div className="display italic text-[18px] text-cream/85">Keeping (intelligence) real.</div>
          </div>
        </div>

        <div className="mt-16 flex items-end justify-between gap-6 border-t border-cream/12 pt-10">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/logo-white-large.svg" alt="humyn labs" className="h-14 md:h-20 w-auto" />
            <div className="mt-4 text-[12px] text-cream/55">
              © {new Date().getFullYear()} Humyn Labs. BRIDGE Report v1.0.
            </div>
          </div>
          <div className="hidden md:flex items-end gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/logo-white-small.svg" alt="" className="h-12 w-auto opacity-80" />
            <div className="text-[11px] uppercase tracking-[0.2em] text-cream/45 pb-1">
              Independent Benchmark · Built in public
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
