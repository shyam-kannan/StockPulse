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
    <div className="space-y-4">
      {/* Main range bar */}
      <div className="relative pt-8 pb-6">
        {/* Bar background */}
        <div className="relative h-3 bg-navy-700 rounded-full overflow-hidden">
          {/* Gradient fill from bear to stretched */}
          {markers.length >= 2 && (
            <div
              className="absolute h-full rounded-full"
              style={{
                left: `${pct(markers[0].price)}%`,
                width: `${pct(markers[markers.length - 1].price) - pct(markers[0].price)}%`,
                background: 'linear-gradient(to right, #ff4757, #ffb800, #00cc6a, #00ff88)',
              }}
            />
          )}
        </div>

        {/* Price markers */}
        {markers.map((m) => (
          <div
            key={m.label}
            className="absolute flex flex-col items-center"
            style={{ left: `${pct(m.price)}%`, transform: 'translateX(-50%)' }}
          >
            <span className={`text-[10px] font-medium ${m.textColor} -mt-1`} style={{ position: 'absolute', top: '-24px' }}>
              {m.label}
            </span>
            <div className={`w-2.5 h-2.5 ${m.color} rounded-full border-2 border-navy-800`} style={{ position: 'absolute', top: '0px', marginTop: '-1px' }} />
            <span className="text-[10px] font-[family-name:var(--font-mono)] text-text-muted" style={{ position: 'absolute', top: '18px' }}>
              {formatPrice(m.price)}
            </span>
          </div>
        ))}

        {/* Current price marker */}
        {currentPrice && currentPrice > 0 && (
          <div
            className="absolute flex flex-col items-center"
            style={{ left: `${pct(currentPrice)}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-0.5 h-6 bg-text-primary" style={{ position: 'absolute', top: '-4px' }} />
            <span className="text-[10px] font-semibold text-text-primary font-[family-name:var(--font-mono)] bg-navy-800 px-1 rounded" style={{ position: 'absolute', top: '22px' }}>
              NOW {formatPrice(currentPrice)}
            </span>
          </div>
        )}
      </div>

      {/* Entry/Trim/Stop levels */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {entryLow && entryHigh && (
          <div className="bg-navy-700/50 rounded-lg p-2">
            <p className="text-[10px] uppercase text-text-muted mb-0.5">Entry Zone</p>
            <p className="text-xs font-[family-name:var(--font-mono)] text-electric">
              {formatPrice(entryLow)} - {formatPrice(entryHigh)}
            </p>
          </div>
        )}
        {priceTargets.trim_levels?.length > 0 && (
          <div className="bg-navy-700/50 rounded-lg p-2">
            <p className="text-[10px] uppercase text-text-muted mb-0.5">Trim Levels</p>
            <p className="text-xs font-[family-name:var(--font-mono)] text-amber">
              {priceTargets.trim_levels.map((p) => formatPrice(p)).join(' / ')}
            </p>
          </div>
        )}
        {hardStop && (
          <div className="bg-navy-700/50 rounded-lg p-2">
            <p className="text-[10px] uppercase text-text-muted mb-0.5">Hard Stop</p>
            <p className="text-xs font-[family-name:var(--font-mono)] text-danger">
              {formatPrice(hardStop)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
