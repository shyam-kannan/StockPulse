import { Activity } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6 text-electric" />
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
      </div>
      <div className="bg-navy-800 border border-border rounded-xl p-8 text-center">
        <p className="text-text-secondary">Loading trending data...</p>
      </div>
    </div>
  );
}
