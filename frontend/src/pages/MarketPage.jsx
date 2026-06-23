import MarketStatus from '../components/market/MarketStatus';
import EducationAccordion from '../components/market/EducationAccordion';

export default function MarketPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <MarketStatus />
      </div>
      <div>
        <EducationAccordion />
      </div>
    </div>
  );
}
