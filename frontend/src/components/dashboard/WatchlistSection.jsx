import { useNavigate } from 'react-router-dom';
import { Star, X, RefreshCw } from 'lucide-react';

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
    <div className="bg-navy-800/50 border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber fill-amber" />
          <h3 className="text-sm font-semibold text-text-primary">Watchlist</h3>
        </div>
        <span className="text-xs text-text-muted">{watchlist.length} tickers</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {watchlist.map((ticker) => {
          const data = getTickerData(ticker);
          return (
            <button
              key={ticker}
              onClick={() => navigate(`/analysis/${ticker}`)}
              className="shrink-0 flex items-center gap-2 px-3 py-2 bg-navy-700 border border-border rounded-lg hover:border-electric/50 transition-colors group"
            >
              <span className="text-sm font-semibold text-electric font-[family-name:var(--font-mono)]">
                {ticker}
              </span>
              {data?.current_price && (
                <span className="text-xs text-text-secondary font-[family-name:var(--font-mono)]">
                  ${data.current_price}
                </span>
              )}
              {data?.price_change_pct != null && (
                <span className={`text-xs font-[family-name:var(--font-mono)] ${data.price_change_pct >= 0 ? 'text-electric' : 'text-danger'}`}>
                  {data.price_change_pct >= 0 ? '+' : ''}{data.price_change_pct}%
                </span>
              )}
              <X
                className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger transition-all"
                onClick={(e) => removeFromWatchlist(e, ticker)}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
