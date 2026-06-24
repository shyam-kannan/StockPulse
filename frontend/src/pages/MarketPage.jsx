import MarketStatus from '../components/market/MarketStatus';
import EducationAccordion from '../components/market/EducationAccordion';
import Glossary from '../components/market/Glossary';

export default function MarketPage() {
  return (
    <div className="fade-in">

      {/* ===== HERO ===== */}
      <section className="text-center pt-16 pb-20 sm:pt-24 sm:pb-28">
        <h1 className="text-5xl sm:text-7xl font-bold text-text-primary tracking-tight leading-[1.1]">
          Learn & Market
        </h1>
        <p className="text-xl sm:text-2xl text-text-muted mt-6 max-w-2xl mx-auto leading-relaxed font-light">
          Real-time market status, trading fundamentals, and key terminology every investor should know.
        </p>
      </section>

      {/* ===== MARKET STATUS ===== */}
      <section className="full-bleed-section alt-section py-20 sm:py-28">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center mb-14">
            <p className="section-label mb-4">Live Data</p>
            <h2 className="text-3xl sm:text-5xl font-bold text-text-primary tracking-tight">Market Status</h2>
          </div>
          <div className="max-w-2xl mx-auto">
            <MarketStatus />
          </div>
        </div>
      </section>

      {/* ===== GLOSSARY ===== */}
      <section className="py-20 sm:py-28">
        <div className="text-center mb-14">
          <p className="section-label mb-4">Key Terminology</p>
          <h2 className="text-3xl sm:text-5xl font-bold text-text-primary tracking-tight">Glossary</h2>
          <p className="text-lg text-text-muted mt-4 max-w-lg mx-auto">Every term you need to know, from bullish to short squeeze.</p>
        </div>
        <Glossary />
      </section>

      {/* ===== TRADING FUNDAMENTALS ===== */}
      <section className="full-bleed-section alt-section py-20 sm:py-28">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center mb-14">
            <p className="section-label mb-4">In-Depth Lessons</p>
            <h2 className="text-3xl sm:text-5xl font-bold text-text-primary tracking-tight">Trading Fundamentals</h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <EducationAccordion />
          </div>
        </div>
      </section>
    </div>
  );
}
