import { BarChart2, GraduationCap } from 'lucide-react';
import MarketStatus from '../components/market/MarketStatus';
import EducationAccordion from '../components/market/EducationAccordion';

export default function MarketPage() {
  return (
    <div className="space-y-10 fade-in">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Market & Education
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Real-time market status and trading fundamentals
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Market Status */}
        <div>
          <div className="section-title">
            <div className="icon-wrapper">
              <BarChart2 />
            </div>
            <h2>Market Status</h2>
          </div>
          <MarketStatus />
        </div>

        {/* Education */}
        <div>
          <div className="section-title">
            <div className="icon-wrapper">
              <GraduationCap />
            </div>
            <h2>Trading Fundamentals</h2>
          </div>
          <EducationAccordion />
        </div>
      </div>
    </div>
  );
}
