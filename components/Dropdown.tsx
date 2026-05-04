"use client";
import { useEffect, useRef, useState } from "react";

export default function Dropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  formatOption,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
  formatOption?: (v: T) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const fmt = (v: T) => (formatOption ? formatOption(v) : v);
  return (
    <div className="relative" ref={ref}>
      <button type="button" className="dropdown-pill" onClick={() => setOpen((s) => !s)}>
        <span className="label">{label} :</span>
        <span className="value">{fmt(value)}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/chevron-down.svg"
          alt=""
          className={`w-[14px] h-[14px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="absolute left-0 top-full mt-2 z-30 min-w-[220px] max-h-[320px] overflow-auto rounded-2xl border border-ink/15 bg-white shadow-xl shadow-ink/10 py-2">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-[14px] ${
                o === value ? "text-accent font-medium" : "text-ink/85 hover:bg-ink/5"
              }`}
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
            >
              <span>{fmt(o)}</span>
              {o === value ? <span aria-hidden>✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
