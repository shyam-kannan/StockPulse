import MarketStatus from '../components/market/MarketStatus';
import EducationAccordion from '../components/market/EducationAccordion';

export default function MarketPage() {
  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary mb-1">Market & Education</h1>
        <p className="text-sm text-text-secondary">Real-time market status and trading fundamentals</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MarketStatus />
        <EducationAccordion />
      </div>
    </div>
  );
}
