import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-navy-900 border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-sm font-semibold text-electric font-[family-name:var(--font-mono)]">
        ${data.close?.toFixed(2)}
      </p>
      {data.volume && (
        <p className="text-xs text-text-muted mt-0.5">
          Vol: {(data.volume / 1e6).toFixed(1)}M
        </p>
      )}
    </div>
  );
}

export default function PriceChart({ history, loading }) {
  if (loading) {
    return (
      <div className="bg-navy-800 border border-border rounded-xl p-4">
        <div className="h-5 bg-navy-700 rounded w-32 mb-4 animate-pulse" />
        <div className="h-[250px] bg-navy-700/50 rounded animate-pulse" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="bg-navy-800 border border-border rounded-xl p-6 text-center">
        <p className="text-text-muted text-sm">No price history available</p>
      </div>
    );
  }

  return (
    <div className="bg-navy-800 border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-4">30-Day Price Action</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2340" />
          <XAxis
            dataKey="date"
            stroke="#5a6577"
            tick={{ fontSize: 10, fill: '#5a6577' }}
            tickFormatter={(d) => {
              const parts = d.split('-');
              return `${parts[1]}/${parts[2]}`;
            }}
          />
          <YAxis
            stroke="#5a6577"
            tick={{ fontSize: 10, fill: '#5a6577' }}
            domain={['auto', 'auto']}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#00ff88"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#00ff88', stroke: '#0a0e17', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
