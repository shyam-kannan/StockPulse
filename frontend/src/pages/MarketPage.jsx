import { FadeIn, FadeInView } from '../components/motion';
import MarketStatus from '../components/market/MarketStatus';
import EducationAccordion from '../components/market/EducationAccordion';
import Glossary from '../components/market/Glossary';

export default function MarketPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <FadeIn>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary tracking-[-0.03em] leading-[1.1]">
              Learn & Market
            </h1>
            <p className="text-base sm:text-lg text-text-secondary mt-4 max-w-lg mx-auto">
              Real-time market status, trading fundamentals, and key terminology.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Market Status */}
      <section className="alt-section py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <FadeInView>
            <div className="text-center mb-10">
              <p className="section-label mb-2">Live</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-[-0.02em]">Market Status</h2>
            </div>
          </FadeInView>
          <FadeInView delay={0.1}>
            <div className="max-w-2xl mx-auto">
              <MarketStatus />
            </div>
          </FadeInView>
        </div>
      </section>

      {/* Glossary */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <FadeInView>
            <div className="text-center mb-10">
              <p className="section-label mb-2">Reference</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-[-0.02em]">Glossary</h2>
              <p className="text-text-secondary mt-2 max-w-md mx-auto">
                Every term you need to know, from bullish to short squeeze.
              </p>
            </div>
          </FadeInView>
          <FadeInView delay={0.1}>
            <Glossary />
          </FadeInView>
        </div>
      </section>

      {/* Trading Fundamentals */}
      <section className="alt-section py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <FadeInView>
            <div className="text-center mb-10">
              <p className="section-label mb-2">Education</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-[-0.02em]">Trading Fundamentals</h2>
            </div>
          </FadeInView>
          <FadeInView delay={0.1}>
            <EducationAccordion />
          </FadeInView>
        </div>
      </section>
    </div>
  );
}
