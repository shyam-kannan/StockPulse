import { FadeIn, FadeInView } from '../components/motion';
import MarketStatus from '../components/market/MarketStatus';
import EducationAccordion from '../components/market/EducationAccordion';
import Glossary from '../components/market/Glossary';

export default function MarketPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 lg:px-8">

      {/* Header */}
      <FadeIn>
        <div className="pt-8 pb-6 border-b border-border">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Learn & Market</h1>
          <p className="text-sm text-text-muted mt-1">
            Real-time market status, trading fundamentals, and key terminology.
          </p>
        </div>
      </FadeIn>

      {/* Market Status */}
      <FadeInView>
        <div className="py-8">
          <h2 className="text-lg font-semibold text-text-primary tracking-tight mb-5">Market Status</h2>
          <div className="max-w-2xl">
            <MarketStatus />
          </div>
        </div>
      </FadeInView>

      {/* Glossary */}
      <FadeInView>
        <div className="py-8 border-t border-border">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-text-primary tracking-tight">Glossary</h2>
            <p className="text-[13px] text-text-muted mt-0.5">Every term you need to know, from bullish to short squeeze.</p>
          </div>
          <Glossary />
        </div>
      </FadeInView>

      {/* Trading Fundamentals */}
      <FadeInView>
        <div className="py-8 border-t border-border pb-16">
          <h2 className="text-lg font-semibold text-text-primary tracking-tight mb-5">Trading Fundamentals</h2>
          <div className="max-w-3xl">
            <EducationAccordion />
          </div>
        </div>
      </FadeInView>
    </div>
  );
}
