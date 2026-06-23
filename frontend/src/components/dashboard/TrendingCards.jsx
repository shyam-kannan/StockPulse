import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { formatPrice, formatPercent, changeColor } from '../../utils/formatters';

function SkeletonCard() {
  return (
    <div className="min-w-[220px] card p-5">
      <div className="h-5 shimmer rounded-lg w-16 mb-2" />
      <div className="h-3 shimmer rounded-lg w-28 mb-4" />
      <div className="h-7 shimmer rounded-lg w-24 mb-2" />
      <div className="h-4 shimmer rounded-lg w-16" />
    </div>
  );
}

export default function TrendingCards({ tickers, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!tickers || tickers.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-text-muted text-sm">No trending tickers yet. Data is being collected...</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {tickers.slice(0, 10).map((t, i) => (
        <button
          key={t.ticker}
          onClick={() => navigate(`/analysis/${t.ticker}`)}
          className="min-w-[220px] card p-5 text-left hover:border-electric/20 group shrink-0"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-lg font-bold text-electric font-[family-name:var(--font-mono)]">
              {t.ticker}
            </span>
            <span className="text-[10px] text-text-muted bg-white/[0.04] px-2 py-0.5 rounded-md font-[family-name:var(--font-mono)]">
              #{i + 1}
            </span>
          </div>
          <p className="text-xs text-text-muted mb-4 truncate">{t.company_name}</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-semibold text-text-primary font-[family-name:var(--font-mono)]">
              {formatPrice(t.current_price)}
            </span>
            {t.price_change_pct != null && (
              <span className={`text-sm font-medium font-[family-name:var(--font-mono)] ${changeColor(t.price_change_pct)}`}>
                {formatPercent(t.price_change_pct)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-3 h-3" />
              {t.mention_count} mentions
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
