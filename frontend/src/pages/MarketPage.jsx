import { FadeIn, FadeInView } from '../components/motion';
import MarketStatus from '../components/market/MarketStatus';
import EducationAccordion from '../components/market/EducationAccordion';
import Glossary from '../components/market/Glossary';

export default function MarketPage() {
  return (
    <div>

      {/* Hero */}
      <section className="pt-16 pb-14 sm:pt-24 sm:pb-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
          <FadeIn>
            <h1 className="text-4xl sm:text-6xl font-bold text-text-primary tracking-tight leading-[1.1]">
              Learn & Market
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-lg sm:text-xl text-text-muted mt-4 max-w-xl mx-auto font-light leading-relaxed">
              Real-time market status, trading fundamentals, and key terminology every investor should know.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Market Status */}
      <section className="alt-section py-14 sm:py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <FadeInView>
            <div className="text-center mb-10">
              <p className="section-label mb-3">Live Data</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">Market Status</h2>
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
      <section className="py-14 sm:py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <FadeInView>
            <div className="text-center mb-10">
              <p className="section-label mb-3">Key Terminology</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">Glossary</h2>
              <p className="text-sm text-text-muted mt-3 max-w-md mx-auto">Every term you need to know, from bullish to short squeeze.</p>
            </div>
          </FadeInView>
          <FadeInView delay={0.1}>
            <Glossary />
          </FadeInView>
        </div>
      </section>

      {/* Trading Fundamentals */}
      <section className="alt-section py-14 sm:py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <FadeInView>
            <div className="text-center mb-10">
              <p className="section-label mb-3">In-Depth Lessons</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">Trading Fundamentals</h2>
            </div>
          </FadeInView>
          <FadeInView delay={0.1}>
            <div className="max-w-3xl mx-auto">
              <EducationAccordion />
            </div>
          </FadeInView>
        </div>
      </section>
    </div>
  );
}
