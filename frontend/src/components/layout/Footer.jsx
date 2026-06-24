import { Activity } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-text-muted">
            <Activity className="w-3.5 h-3.5 text-accent/50" />
            <span className="text-[13px] font-medium tracking-tight">StockPulse</span>
          </div>
          <p className="text-[12px] text-text-muted/60 text-center leading-relaxed">
            For educational purposes only. Not financial advice. Powered by Claude AI & yfinance.
          </p>
        </div>
      </div>
    </footer>
  );
}
