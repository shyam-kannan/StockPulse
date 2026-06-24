import { Activity } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] mt-auto">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">

          {/* Brand */}
          <div className="flex items-center gap-2.5 text-text-muted">
            <div className="w-6 h-6 rounded-lg bg-electric/8 flex items-center justify-center">
              <Activity className="w-3 h-3 text-electric/70" />
            </div>
            <span className="text-sm font-medium font-[family-name:var(--font-mono)] text-text-muted/80">
              StockPulse
            </span>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-text-muted/60 text-center leading-relaxed max-w-lg">
            For educational purposes only. This is not financial advice.
            Powered by Claude AI, yfinance, and Grok.
          </p>
        </div>
      </div>
    </footer>
  );
}
