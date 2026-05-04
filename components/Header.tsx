"use client";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { label: "Expert profiles", href: "#" },
  { label: "How it works", href: "#methodology" },
  { label: "Datasets", href: "#dataset" },
  { label: "About", href: "#" },
  { label: "News", href: "#" },
  { label: "Blogs", href: "#" },
  { label: "Contact Us", href: "#" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-[#e5e3df]/85 backdrop-blur-md border-b border-ink/8" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 h-[80px] flex items-center justify-between">
        <a href="#top" className="flex items-center" aria-label="Humyn Labs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/logo-orange.svg" alt="humyn labs" className="h-9 md:h-10 w-auto" />
        </a>
        <nav className="hidden lg:flex items-center gap-9 text-[14px] text-ink/80">
          {NAV_ITEMS.map((it) => (
            <a key={it.label} href={it.href} className="hover:text-ink transition-colors">
              {it.label}
            </a>
          ))}
        </nav>
        <a
          href="#dataset"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-ink/30 text-[13px] hover:bg-ink hover:text-cream transition-colors invisible"
          aria-hidden
        >
          Get the dataset
          <span>→</span>
        </a>
      </div>
    </header>
  );
}
