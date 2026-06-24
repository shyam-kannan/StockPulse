import { Activity } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <Activity className="w-4 h-4 text-accent/50" />
          <span className="text-sm font-semibold text-text-muted tracking-tight">StockPulse</span>
        </div>
        <p className="text-[12px] text-text-muted/60 max-w-lg mx-auto leading-relaxed">
          For educational purposes only. Not financial advice. All analysis is AI-generated and may contain inaccuracies.
        </p>
      </div>
    </footer>
  );
}
