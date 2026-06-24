import { useNavigate } from 'react-router-dom';
import { Star, X } from 'lucide-react';

export default function WatchlistSection({ watchlist, setWatchlist, trendingData }) {
  const navigate = useNavigate();

  if (!watchlist || watchlist.length === 0) return null;

  const getTickerData = (ticker) => {
    if (!trendingData) return null;
    return trendingData.find((t) => t.ticker === ticker);
  };

  const removeFromWatchlist = (e, ticker) => {
    e.stopPropagation();
    setWatchlist(watchlist.filter((t) => t !== ticker));
  };

  return (
    <div className="card p-8 fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Star className="w-5 h-5 text-amber fill-amber" />
          <h3 className="text-base font-semibold text-text-primary">Watchlist</h3>
        </div>
        <span className="text-sm text-text-muted font-[family-name:var(--font-mono)]">{watchlist.length} tickers</span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {watchlist.map((ticker) => {
          const data = getTickerData(ticker);
          return (
            <button
              key={ticker}
              onClick={() => navigate(`/analysis/${ticker}`)}
              className="shrink-0 flex items-center gap-4 px-5 py-3.5 bg-white/[0.03] border border-border rounded-xl hover:border-border-hover hover:bg-white/[0.06] transition-all group"
            >
              <span className="text-base font-semibold text-electric font-[family-name:var(--font-mono)]">
                {ticker}
              </span>
              {data?.current_price && (
                <span className="text-sm text-text-secondary font-[family-name:var(--font-mono)]">
                  ${data.current_price}
                </span>
              )}
              {data?.price_change_pct != null && (
                <span className={`text-sm font-medium font-[family-name:var(--font-mono)] ${data.price_change_pct >= 0 ? 'text-electric' : 'text-danger'}`}>
                  {data.price_change_pct >= 0 ? '+' : ''}{data.price_change_pct}%
                </span>
              )}
              <X
                className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger transition-all"
                onClick={(e) => removeFromWatchlist(e, ticker)}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
