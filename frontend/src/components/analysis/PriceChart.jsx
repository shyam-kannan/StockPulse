import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-navy-900 border border-border rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-sm font-semibold text-electric font-[family-name:var(--font-mono)]">
        ${data.close?.toFixed(2)}
      </p>
      {data.volume && (
        <p className="text-xs text-text-muted mt-1">
          Vol: {(data.volume / 1e6).toFixed(1)}M
        </p>
      )}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-5 h-5 shimmer rounded-md" />
        <div className="h-4 shimmer rounded-lg w-28" />
      </div>
      <div className="h-[280px] shimmer rounded-xl" />
    </div>
  );
}

function ChartEmpty() {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2.5 mb-6">
        <TrendingUp className="w-4 h-4 text-text-muted" />
        <h3 className="text-sm font-medium text-text-secondary">Price History</h3>
      </div>
      <div className="h-[280px] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-border flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-text-muted" />
        </div>
        <p className="text-sm text-text-muted">Price chart loading...</p>
      </div>
    </div>
  );
}

export default function PriceChart({ history, loading }) {
  if (loading) return <ChartSkeleton />;

  if (!history || history.length === 0) return <ChartEmpty />;

  return (
    <div className="card p-6 fade-in">
      <div className="flex items-center gap-2.5 mb-6">
        <TrendingUp className="w-4 h-4 text-electric" />
        <h3 className="text-sm font-medium text-text-primary">Price History</h3>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.1} />
              <stop offset="80%" stopColor="#10b981" stopOpacity={0.02} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148, 163, 184, 0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="transparent"
            tick={{ fontSize: 10, fill: '#475569' }}
            tickFormatter={(d) => {
              const parts = d.split('-');
              return `${parts[1]}/${parts[2]}`;
            }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            stroke="transparent"
            tick={{ fontSize: 10, fill: '#475569' }}
            domain={['auto', 'auto']}
            tickFormatter={(v) => `$${v}`}
            axisLine={false}
            tickLine={false}
            dx={-4}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="close"
            stroke="#10b981"
            strokeWidth={1.5}
            fill="url(#priceGradient)"
            dot={false}
            activeDot={{
              r: 4,
              fill: '#10b981',
              stroke: '#06080f',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
