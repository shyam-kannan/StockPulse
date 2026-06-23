import { formatPrice } from '../../utils/formatters';

export default function PriceTargetBar({ priceTargets, currentPrice }) {
  if (!priceTargets || priceTargets.parse_error || priceTargets.error) return null;

  const bear = priceTargets.bear_case?.price;
  const base = priceTargets.base_case?.price;
  const bull = priceTargets.bull_case?.price;
  const stretched = priceTargets.stretched_bull?.price;

  const prices = [bear, base, bull, stretched, currentPrice].filter((p) => p && p > 0);
  if (prices.length < 2) return null;

  const min = Math.min(...prices) * 0.95;
  const max = Math.max(...prices) * 1.05;
  const range = max - min;

  const pct = (price) => ((price - min) / range) * 100;

  const markers = [
    { price: bear, label: 'Bear', color: 'bg-danger', textColor: 'text-danger' },
    { price: base, label: 'Base', color: 'bg-amber', textColor: 'text-amber' },
    { price: bull, label: 'Bull', color: 'bg-electric-dim', textColor: 'text-electric-dim' },
    { price: stretched, label: 'Stretched', color: 'bg-electric', textColor: 'text-electric' },
  ].filter((m) => m.price && m.price > 0);

  const entryLow = priceTargets.entry_zone?.low;
  const entryHigh = priceTargets.entry_zone?.high;
  const hardStop = priceTargets.hard_stop?.price;

  return (
    <div className="space-y-5">
      <div className="relative pt-8 pb-6">
        <div className="relative h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
          {markers.length >= 2 && (
            <div
              className="absolute h-full rounded-full"
              style={{
                left: `${pct(markers[0].price)}%`,
                width: `${pct(markers[markers.length - 1].price) - pct(markers[0].price)}%`,
                background: 'linear-gradient(to right, #ef4444, #f59e0b, #059669, #10b981)',
              }}
            />
          )}
        </div>

        {markers.map((m) => (
          <div
            key={m.label}
            className="absolute flex flex-col items-center"
            style={{ left: `${pct(m.price)}%`, transform: 'translateX(-50%)' }}
          >
            <span className={`text-[10px] font-medium ${m.textColor}`} style={{ position: 'absolute', top: '-24px' }}>
              {m.label}
            </span>
            <div className={`w-3 h-3 ${m.color} rounded-full border-2 border-navy-800 shadow-sm`} style={{ position: 'absolute', top: '0px', marginTop: '-2px' }} />
            <span className="text-[10px] font-[family-name:var(--font-mono)] text-text-muted" style={{ position: 'absolute', top: '18px' }}>
              {formatPrice(m.price)}
            </span>
          </div>
        ))}

        {currentPrice && currentPrice > 0 && (
          <div
            className="absolute flex flex-col items-center"
            style={{ left: `${pct(currentPrice)}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-0.5 h-6 bg-text-primary" style={{ position: 'absolute', top: '-4px' }} />
            <span className="text-[10px] font-semibold text-text-primary font-[family-name:var(--font-mono)] bg-navy-800 px-1.5 rounded-md" style={{ position: 'absolute', top: '22px' }}>
              NOW {formatPrice(currentPrice)}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {entryLow && entryHigh && (
          <div className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-[10px] uppercase text-text-muted mb-1 tracking-wider">Entry Zone</p>
            <p className="text-xs font-[family-name:var(--font-mono)] text-electric font-medium">
              {formatPrice(entryLow)} - {formatPrice(entryHigh)}
            </p>
          </div>
        )}
        {priceTargets.trim_levels?.length > 0 && (
          <div className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-[10px] uppercase text-text-muted mb-1 tracking-wider">Trim Levels</p>
            <p className="text-xs font-[family-name:var(--font-mono)] text-amber font-medium">
              {priceTargets.trim_levels.map((p) => formatPrice(p)).join(' / ')}
            </p>
          </div>
        )}
        {hardStop && (
          <div className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-[10px] uppercase text-text-muted mb-1 tracking-wider">Hard Stop</p>
            <p className="text-xs font-[family-name:var(--font-mono)] text-danger font-medium">
              {formatPrice(hardStop)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
