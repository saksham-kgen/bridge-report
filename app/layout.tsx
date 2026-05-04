import type { Metadata } from "next";
import { Rethink_Sans } from "next/font/google";
import "./globals.css";

const rethink = Rethink_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BRIDGE Report — Humyn Labs",
  description:
    "BRIDGE: an independent Global South ASR benchmark evaluating 14+ commercial models across 20+ languages on a 7-metric stack.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${rethink.variable} smooth-scroll`}>
      <body>{children}</body>
    </html>
  );
}
