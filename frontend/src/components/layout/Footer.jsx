import { Activity } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-text-muted text-sm">
            <div className="w-6 h-6 rounded-md bg-electric/10 flex items-center justify-center">
              <Activity className="w-3 h-3 text-electric" />
            </div>
            <span className="font-[family-name:var(--font-mono)] font-medium">StockPulse</span>
            <span className="text-text-muted/40">|</span>
            <span>AI-Powered Market Intelligence</span>
          </div>
          <p className="text-text-muted text-xs text-center">
            For educational purposes only. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
