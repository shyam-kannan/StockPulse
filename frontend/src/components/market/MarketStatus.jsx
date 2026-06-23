import { Clock, Sun, Moon, Sunrise } from 'lucide-react';
import { usePolling } from '../../hooks/usePolling';
import { api } from '../../utils/api';

const statusConfig = {
  open: { label: 'Market Open', color: 'text-electric', bg: 'bg-electric/10', icon: Sun, pulse: true },
  pre_market: { label: 'Pre-Market', color: 'text-amber', bg: 'bg-amber/10', icon: Sunrise, pulse: false },
  after_hours: { label: 'After Hours', color: 'text-amber', bg: 'bg-amber/10', icon: Moon, pulse: false },
  closed: { label: 'Market Closed', color: 'text-danger', bg: 'bg-danger/10', icon: Moon, pulse: false },
};

function TimelineBar({ status }) {
  const segments = [
    { label: 'Pre', start: 4, end: 9.5, color: 'bg-amber/30' },
    { label: 'Regular', start: 9.5, end: 16, color: 'bg-electric/40' },
    { label: 'After', start: 16, end: 20, color: 'bg-amber/30' },
  ];

  const now = new Date();
  const etHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const currentHour = etHour.getHours() + etHour.getMinutes() / 60;
  const totalRange = 20 - 4;
  const nowPct = Math.max(0, Math.min(100, ((currentHour - 4) / totalRange) * 100));

  return (
    <div className="mt-4">
      <div className="relative h-6 bg-navy-700 rounded-full overflow-hidden">
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
      <div className="flex justify-between mt-1 text-[10px] text-text-muted font-[family-name:var(--font-mono)]">
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
      <div className="bg-navy-800 border border-border rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-navy-700 rounded w-40 mb-4" />
        <div className="h-10 bg-navy-700 rounded w-32 mb-4" />
        <div className="h-6 bg-navy-700 rounded w-full" />
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
    <div className="bg-navy-800 border border-border rounded-xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}>
            <StatusIcon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${config.color === 'text-electric' ? 'bg-electric' : config.color === 'text-amber' ? 'bg-amber' : 'bg-danger'} ${config.pulse ? 'animate-pulse' : ''}`} />
              <h3 className={`text-lg font-semibold ${config.color}`}>{config.label}</h3>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
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
          <p className="text-sm text-text-secondary">
            Opens at <span className="text-electric font-[family-name:var(--font-mono)]">{formatTime(data.next_open)}</span>
          </p>
        )}
        {data.next_close && (
          <p className="text-sm text-text-secondary">
            Closes at <span className="text-amber font-[family-name:var(--font-mono)]">{formatTime(data.next_close)}</span>
          </p>
        )}

        <TimelineBar status={data.status} />
      </div>

      {/* Market Hours Guide */}
      <div className="border-t border-border px-6 py-4 space-y-3">
        <h4 className="text-sm font-semibold text-text-primary">Market Hours Guide</h4>
        <div className="grid grid-cols-1 gap-2">
          {[
            { label: 'Pre-Market', time: data.market_hours.pre_market.start + ' - ' + data.market_hours.pre_market.end, color: 'border-l-amber' },
            { label: 'Regular', time: data.market_hours.regular.start + ' - ' + data.market_hours.regular.end, color: 'border-l-electric' },
            { label: 'After Hours', time: data.market_hours.after_hours.start + ' - ' + data.market_hours.after_hours.end, color: 'border-l-amber' },
          ].map((h) => (
            <div key={h.label} className={`bg-navy-700/50 rounded px-3 py-2 border-l-2 ${h.color}`}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-text-primary">{h.label}</span>
                <span className="text-xs font-[family-name:var(--font-mono)] text-text-secondary">{h.time}</span>
              </div>
            </div>
          ))}
        </div>

        {data.guide && (
          <div className="space-y-2 mt-3">
            {data.guide.best_times && (
              <div className="bg-electric/5 border border-electric/20 rounded-lg p-3">
                <p className="text-xs font-medium text-electric mb-1">Best Times to Trade</p>
                <p className="text-xs text-text-secondary leading-relaxed">{data.guide.best_times}</p>
              </div>
            )}
            {data.guide.settlement && (
              <div className="bg-navy-700/50 rounded-lg p-3">
                <p className="text-xs font-medium text-amber mb-1">Settlement (T+1)</p>
                <p className="text-xs text-text-secondary leading-relaxed">{data.guide.settlement}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
