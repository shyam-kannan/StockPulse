import { Search } from 'lucide-react';

export default function AnalysisPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Search className="w-6 h-6 text-electric" />
        <h1 className="text-2xl font-bold text-text-primary">Stock Analysis</h1>
      </div>
      <div className="bg-navy-800 border border-border rounded-xl p-8 text-center">
        <p className="text-text-secondary">Search for a ticker to get AI-powered analysis</p>
      </div>
    </div>
  );
}
