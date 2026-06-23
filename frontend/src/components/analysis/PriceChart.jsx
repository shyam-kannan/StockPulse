import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

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

export default function PriceChart({ history, loading }) {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="h-5 shimmer rounded-lg w-36 mb-5" />
        <div className="h-[280px] shimmer rounded-xl" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-text-muted text-sm">No price history available</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-5">30-Day Price Action</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={history}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.06)" />
          <XAxis
            dataKey="date"
            stroke="transparent"
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickFormatter={(d) => {
              const parts = d.split('-');
              return `${parts[1]}/${parts[2]}`;
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="transparent"
            tick={{ fontSize: 10, fill: '#64748b' }}
            domain={['auto', 'auto']}
            tickFormatter={(v) => `$${v}`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="close"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#priceGradient)"
            dot={false}
            activeDot={{ r: 5, fill: '#10b981', stroke: '#06080f', strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
