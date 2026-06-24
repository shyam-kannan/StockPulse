import MarketStatus from '../components/market/MarketStatus';
import EducationAccordion from '../components/market/EducationAccordion';
import Glossary from '../components/market/Glossary';

export default function MarketPage() {
  return (
    <div className="fade-in">

      {/* Hero */}
      <section className="pt-10 pb-12 sm:pt-14 sm:pb-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight">
            Learn & Market
          </h1>
          <p className="text-lg text-text-muted mt-3 max-w-xl font-light leading-relaxed">
            Real-time market status, trading fundamentals, and key terminology every investor should know.
          </p>
        </div>
      </section>

      {/* Market Status */}
      <section className="alt-section py-10 sm:py-14">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="mb-6">
            <p className="section-label mb-2">Live Data</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Market Status</h2>
          </div>
          <div className="max-w-2xl">
            <MarketStatus />
          </div>
        </div>
      </section>

      {/* Glossary */}
      <section className="py-10 sm:py-14">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="mb-6">
            <p className="section-label mb-2">Key Terminology</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Glossary</h2>
            <p className="text-sm text-text-muted mt-2">Every term you need to know, from bullish to short squeeze.</p>
          </div>
          <Glossary />
        </div>
      </section>

      {/* Trading Fundamentals */}
      <section className="alt-section py-10 sm:py-14">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="mb-6">
            <p className="section-label mb-2">In-Depth Lessons</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Trading Fundamentals</h2>
          </div>
          <div className="max-w-3xl">
            <EducationAccordion />
          </div>
        </div>
      </section>
    </div>
  );
}
