import { Activity } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-navy-900/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-text-muted text-xs">
            <Activity className="w-3 h-3" />
            <span className="font-[family-name:var(--font-mono)]">StockPulse</span>
            <span>&middot;</span>
            <span>AI-Powered Research</span>
          </div>
          <p className="text-text-muted text-xs text-center">
            For educational purposes only. Not financial advice. Always do your own research.
          </p>
        </div>
      </div>
    </footer>
  );
}
