import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { formatPrice, formatPercent, changeColor } from '../../utils/formatters';

function SkeletonCard() {
  return (
    <div className="min-w-[280px] card p-8">
      <div className="h-6 shimmer rounded-xl w-20 mb-3" />
      <div className="h-4 shimmer rounded-xl w-36 mb-8" />
      <div className="h-8 shimmer rounded-xl w-28 mb-3" />
      <div className="h-5 shimmer rounded-xl w-20" />
    </div>
  );
}

export default function TrendingCards({ tickers, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!tickers || tickers.length === 0) {
    return (
      <div className="card p-14 text-center">
        <p className="text-text-muted text-base">No trending tickers yet. Data is being collected...</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {tickers.slice(0, 10).map((t, i) => (
        <button
          key={t.ticker}
          onClick={() => navigate(`/analysis/${t.ticker}`)}
          className="min-w-[280px] card p-8 text-left hover:border-electric/20 group shrink-0"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl font-bold text-electric font-[family-name:var(--font-mono)]">
              {t.ticker}
            </span>
            <span className="text-xs text-text-muted bg-white/[0.04] px-3 py-1.5 rounded-lg font-[family-name:var(--font-mono)]">
              #{i + 1}
            </span>
          </div>
          <p className="text-sm text-text-muted mb-8 truncate">{t.company_name}</p>
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-2xl font-semibold text-text-primary font-[family-name:var(--font-mono)]">
              {formatPrice(t.current_price)}
            </span>
            {t.price_change_pct != null && (
              <span className={`text-base font-medium font-[family-name:var(--font-mono)] ${changeColor(t.price_change_pct)}`}>
                {formatPercent(t.price_change_pct)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-text-muted">
            <span className="flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5" />
              {t.mention_count} mentions
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
