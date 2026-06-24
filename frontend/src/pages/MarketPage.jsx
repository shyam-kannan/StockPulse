import { BarChart2, GraduationCap, BookOpen } from 'lucide-react';
import MarketStatus from '../components/market/MarketStatus';
import EducationAccordion from '../components/market/EducationAccordion';
import Glossary from '../components/market/Glossary';

export default function MarketPage() {
  return (
    <div className="fade-in">

      {/* Page header */}
      <div className="pt-4 pb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight leading-tight">
          Learn & Market
        </h1>
        <p className="text-lg text-text-muted mt-4 max-w-2xl leading-relaxed">
          Real-time market status, trading fundamentals, and key terminology every investor should know.
        </p>
      </div>

      {/* Market Status — full width */}
      <section className="mb-20">
        <div className="section-title">
          <div className="icon-wrapper">
            <BarChart2 />
          </div>
          <div>
            <h2 className="!text-xl">Market Status</h2>
            <p className="!text-sm mt-1">Live US market hours and session info</p>
          </div>
        </div>
        <div className="max-w-2xl">
          <MarketStatus />
        </div>
      </section>

      <div className="section-divider" />

      {/* Glossary — full width */}
      <section className="py-16">
        <div className="section-title">
          <div className="icon-wrapper" style={{ background: 'rgba(251, 191, 36, 0.10)' }}>
            <BookOpen style={{ color: '#fbbf24' }} />
          </div>
          <div>
            <h2 className="!text-xl">Glossary</h2>
            <p className="!text-sm mt-1">Key terms and definitions every investor should know</p>
          </div>
        </div>
        <Glossary />
      </section>

      <div className="section-divider" />

      {/* Education — full width */}
      <section className="py-16">
        <div className="section-title">
          <div className="icon-wrapper">
            <GraduationCap />
          </div>
          <div>
            <h2 className="!text-xl">Trading Fundamentals</h2>
            <p className="!text-sm mt-1">Expand your knowledge with in-depth lessons</p>
          </div>
        </div>
        <EducationAccordion />
      </section>
    </div>
  );
}
