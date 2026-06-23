import { Clock } from 'lucide-react';

export default function MarketPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="w-6 h-6 text-electric" />
        <h1 className="text-2xl font-bold text-text-primary">Market Hours & Education</h1>
      </div>
      <div className="bg-navy-800 border border-border rounded-xl p-8 text-center">
        <p className="text-text-secondary">Loading market data...</p>
      </div>
    </div>
  );
}
