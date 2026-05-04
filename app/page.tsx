import dataJson from "@/lib/data.json";

// data.json is shape-checked at the component boundary; the inferred JSON
// type narrows category keys per-row which collides with the generic
// `Record<string, ...>` props the components accept.
const data = dataJson as unknown as {
  hero: { models: number; languages: number; cohorts: number };
  metrics: string[];
  metricLabels: Record<string, string>;
  higherIsBetter: string[];
  languages: string[];
  leaderboard: Record<string, Record<string, any[]>>;
  cohort: Record<string, Record<string, any[]>>;
  cohortDims: string[];
  csF1: any[];
  findings: any;
};
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LeftRail from "@/components/LeftRail";
import WhySection from "@/components/WhySection";
import Methodology from "@/components/Methodology";
import Leaderboard from "@/components/Leaderboard";
import KeyFindings from "@/components/KeyFindings";
import CohortAnalysis from "@/components/CohortAnalysis";
import HiddenQualityGap from "@/components/HiddenQualityGap";
import DatasetCitation from "@/components/DatasetCitation";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Header />
      <Hero hero={data.hero} />
      <div className="relative">
        <LeftRail />
        <div className="mx-auto max-w-page px-6 lg:pl-[260px] lg:pr-10">
          <WhySection />
          <Methodology />
          <Leaderboard data={data} />
          <KeyFindings data={data} />
          <CohortAnalysis data={data} />
          <HiddenQualityGap data={data} />
          <DatasetCitation />
        </div>
      </div>
      <Footer />
    </main>
  );
}
