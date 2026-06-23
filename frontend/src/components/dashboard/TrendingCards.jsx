import { useNavigate } from 'react-router-dom';
import { TrendingUp, MessageCircle, Newspaper } from 'lucide-react';
import { formatPrice, formatPercent, changeColor } from '../../utils/formatters';

function SkeletonCard() {
  return (
    <div className="min-w-[200px] bg-navy-800 border border-border rounded-xl p-4 animate-pulse">
      <div className="h-5 bg-navy-700 rounded w-16 mb-2" />
      <div className="h-3 bg-navy-700 rounded w-28 mb-3" />
      <div className="h-6 bg-navy-700 rounded w-20 mb-1" />
      <div className="h-4 bg-navy-700 rounded w-14" />
    </div>
  );
}

export default function TrendingCards({ tickers, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!tickers || tickers.length === 0) {
    return (
      <div className="bg-navy-800 border border-border rounded-xl p-6 text-center">
        <p className="text-text-muted text-sm">No trending tickers yet. Data is being scraped...</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {tickers.slice(0, 10).map((t, i) => (
        <button
          key={t.ticker}
          onClick={() => navigate(`/analysis/${t.ticker}`)}
          className="min-w-[200px] bg-navy-800 border border-border rounded-xl p-4 text-left hover:border-electric/50 hover:bg-navy-700/50 transition-all group shrink-0"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-lg font-bold text-electric font-[family-name:var(--font-mono)]">
              {t.ticker}
            </span>
            <span className="text-xs text-text-muted bg-navy-700 px-2 py-0.5 rounded font-[family-name:var(--font-mono)]">
              #{i + 1}
            </span>
          </div>
          <p className="text-xs text-text-secondary mb-3 truncate">{t.company_name}</p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg font-semibold text-text-primary font-[family-name:var(--font-mono)]">
              {formatPrice(t.current_price)}
            </span>
            {t.price_change_pct != null && (
              <span className={`text-sm font-medium font-[family-name:var(--font-mono)] ${changeColor(t.price_change_pct)}`}>
                {formatPercent(t.price_change_pct)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {t.mention_count}
            </span>
            {t.sources?.includes('reddit') && (
              <span className="text-amber">Reddit</span>
            )}
            {t.sources?.includes('news') && (
              <span className="text-electric-dim">News</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
