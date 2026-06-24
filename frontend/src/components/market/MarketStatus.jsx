import { Clock, Sun, Moon, Sunrise } from 'lucide-react';
import { usePolling } from '../../hooks/usePolling';
import { api } from '../../utils/api';

const statusConfig = {
  open: { label: 'Market Open', color: 'text-accent', bg: 'bg-accent/10', icon: Sun, pulse: true },
  pre_market: { label: 'Pre-Market', color: 'text-amber', bg: 'bg-amber/10', icon: Sunrise, pulse: false },
  after_hours: { label: 'After Hours', color: 'text-amber', bg: 'bg-amber/10', icon: Moon, pulse: false },
  closed: { label: 'Market Closed', color: 'text-danger', bg: 'bg-danger/10', icon: Moon, pulse: false },
};

function TimelineBar({ status }) {
  const segments = [
    { label: 'Pre', start: 4, end: 9.5, color: 'bg-amber/20' },
    { label: 'Regular', start: 9.5, end: 16, color: 'bg-accent/30' },
    { label: 'After', start: 16, end: 20, color: 'bg-amber/20' },
  ];

  const now = new Date();
  const etHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const currentHour = etHour.getHours() + etHour.getMinutes() / 60;
  const totalRange = 20 - 4;
  const nowPct = Math.max(0, Math.min(100, ((currentHour - 4) / totalRange) * 100));

  return (
    <div className="mt-7">
      <div className="relative h-6 bg-white/[0.04] rounded-full overflow-hidden">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`absolute h-full ${seg.color}`}
            style={{
              left: `${((seg.start - 4) / totalRange) * 100}%`,
              width: `${((seg.end - seg.start) / totalRange) * 100}%`,
            }}
          />
        ))}
        {currentHour >= 4 && currentHour <= 20 && (
          <div
            className="absolute top-0 h-full w-0.5 bg-text-primary z-10"
            style={{ left: `${nowPct}%` }}
          />
        )}
      </div>
      <div className="flex justify-between mt-3 text-xs text-text-muted font-[family-name:var(--font-mono)]">
        <span>4AM</span>
        <span>9:30AM</span>
        <span>4PM</span>
        <span>8PM</span>
      </div>
    </div>
  );
}

export default function MarketStatus() {
  const { data, loading } = usePolling(api.getMarketStatus, 60000);

  if (loading) {
    return (
      <div className="card p-10">
        <div className="h-7 shimmer rounded-lg w-44 mb-5" />
        <div className="h-12 shimmer rounded-lg w-36 mb-5" />
        <div className="h-6 shimmer rounded-lg w-full" />
      </div>
    );
  }

  if (!data) return null;

  const config = statusConfig[data.status] || statusConfig.closed;
  const StatusIcon = config.icon;

  const formatTime = (isoStr) => {
    if (!isoStr) return null;
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }) + ' ET';
    } catch {
      return null;
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="p-8">
        <div className="flex items-center gap-5 mb-7">
          <div className={`w-14 h-14 rounded-lg ${config.bg} flex items-center justify-center`}>
            <StatusIcon className={`w-7 h-7 ${config.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${config.color === 'text-accent' ? 'bg-accent' : config.color === 'text-amber' ? 'bg-amber' : 'bg-danger'} ${config.pulse ? 'animate-pulse' : ''}`} />
              <h3 className={`text-2xl font-semibold ${config.color}`}>{config.label}</h3>
            </div>
            <p className="text-sm text-text-muted mt-1.5">
              {new Date(data.current_time_et).toLocaleTimeString('en-US', {
                timeZone: 'America/New_York',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })} ET
            </p>
          </div>
        </div>

        {data.next_open && (
          <p className="text-base text-text-secondary mb-1">
            Opens at <span className="text-accent font-[family-name:var(--font-mono)] font-medium">{formatTime(data.next_open)}</span>
          </p>
        )}
        {data.next_close && (
          <p className="text-base text-text-secondary">
            Closes at <span className="text-amber font-[family-name:var(--font-mono)] font-medium">{formatTime(data.next_close)}</span>
          </p>
        )}

        <TimelineBar status={data.status} />
      </div>

      <div className="border-t border-border px-8 py-7 space-y-4">
        <h4 className="text-base font-semibold text-text-primary">Market Hours</h4>
        <div className="grid grid-cols-1 gap-3">
          {[
            { label: 'Pre-Market', time: data.market_hours.pre_market.start + ' - ' + data.market_hours.pre_market.end, color: 'border-l-amber' },
            { label: 'Regular', time: data.market_hours.regular.start + ' - ' + data.market_hours.regular.end, color: 'border-l-electric' },
            { label: 'After Hours', time: data.market_hours.after_hours.start + ' - ' + data.market_hours.after_hours.end, color: 'border-l-amber' },
          ].map((h) => (
            <div key={h.label} className={`bg-white/[0.02] rounded-lg px-5 py-3.5 border-l-2 ${h.color}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-text-primary">{h.label}</span>
                <span className="text-sm font-[family-name:var(--font-mono)] text-text-secondary">{h.time}</span>
              </div>
            </div>
          ))}
        </div>

        {data.guide && (
          <div className="space-y-3 mt-5">
            {data.guide.best_times && (
              <div className="bg-accent/[0.04] border border-electric/10 rounded-lg p-5">
                <p className="text-sm font-medium text-accent mb-2">Best Times to Trade</p>
                <p className="text-sm text-text-secondary leading-relaxed">{data.guide.best_times}</p>
              </div>
            )}
            {data.guide.settlement && (
              <div className="bg-white/[0.02] rounded-lg p-5">
                <p className="text-sm font-medium text-amber mb-2">Settlement (T+1)</p>
                <p className="text-sm text-text-secondary leading-relaxed">{data.guide.settlement}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
