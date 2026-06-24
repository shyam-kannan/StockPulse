import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatPrice, formatPercent, changeColor } from '../../utils/formatters';

function SkeletonCard() {
  return (
    <div className="min-w-[320px] glass-card p-10">
      <div className="h-7 shimmer rounded-xl w-24 mb-4" />
      <div className="h-4 shimmer rounded-xl w-44 mb-10" />
      <div className="h-10 shimmer rounded-xl w-36 mb-4" />
      <div className="h-5 shimmer rounded-xl w-24" />
    </div>
  );
}

export default function TrendingCards({ tickers, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!tickers || tickers.length === 0) {
    return (
      <div className="glass-card p-20 text-center">
        <p className="text-text-muted text-lg">No trending tickers yet. Data is being collected...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {tickers.slice(0, 8).map((t, i) => {
        const isUp = t.price_change_pct >= 0;
        return (
          <button
            key={t.ticker}
            onClick={() => navigate(`/analysis/${t.ticker}`)}
            className="glass-card p-8 sm:p-10 text-left group relative overflow-hidden"
          >
            <div className="absolute top-6 right-6 text-text-muted/20 font-[family-name:var(--font-mono)] text-6xl font-bold leading-none select-none">
              {i + 1}
            </div>

            <div className="relative">
              <span className="text-2xl font-bold text-electric font-[family-name:var(--font-mono)] tracking-tight">
                {t.ticker}
              </span>
              <p className="text-sm text-text-muted mt-2 truncate max-w-[200px]">{t.company_name}</p>

              <div className="mt-8 flex items-baseline gap-3">
                <span className="text-3xl font-semibold text-text-primary font-[family-name:var(--font-mono)] tracking-tight">
                  {formatPrice(t.current_price)}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-4">
                {t.price_change_pct != null && (
                  <span className={`flex items-center gap-1.5 text-base font-semibold font-[family-name:var(--font-mono)] ${changeColor(t.price_change_pct)}`}>
                    {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {formatPercent(t.price_change_pct)}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm text-text-muted">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {t.mention_count}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
