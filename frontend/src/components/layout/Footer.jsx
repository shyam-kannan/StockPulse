import { Activity } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-2 text-text-muted">
            <div className="w-5 h-5 rounded bg-electric/8 flex items-center justify-center">
              <Activity className="w-2.5 h-2.5 text-electric/70" />
            </div>
            <span className="text-xs font-medium font-[family-name:var(--font-mono)] text-text-muted/80">
              StockPulse
            </span>
          </div>

          {/* Disclaimer */}
          <p className="text-[11px] text-text-muted/60 text-center leading-relaxed max-w-md">
            For educational purposes only. This is not financial advice.
            Powered by Claude AI, yfinance, and Grok.
          </p>
        </div>
      </div>
    </footer>
  );
}
