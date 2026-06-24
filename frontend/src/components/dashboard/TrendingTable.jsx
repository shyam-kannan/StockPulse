import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowUpDown } from 'lucide-react';
import { formatPrice, formatPercent, changeColor, sentimentColor } from '../../utils/formatters';

export default function TrendingTable({ tickers, loading, watchlist, setWatchlist, title = 'Trending Tickers' }) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState('mention_count');
  const [sortDir, setSortDir] = useState('desc');

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="p-8 border-b border-border">
          <div className="h-6 shimmer rounded-lg w-48" />
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-5 px-8 py-5 border-b border-border">
            <div className="h-4 shimmer rounded w-10" />
            <div className="h-4 shimmer rounded w-20" />
            <div className="h-4 shimmer rounded w-32 flex-1" />
            <div className="h-4 shimmer rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (!tickers || tickers.length === 0) return null;

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...tickers].sort((a, b) => {
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const isWatchlisted = (ticker) => watchlist.includes(ticker);

  const toggleWatchlist = (e, ticker) => {
    e.stopPropagation();
    if (isWatchlisted(ticker)) {
      setWatchlist(watchlist.filter((t) => t !== ticker));
    } else {
      setWatchlist([...watchlist, ticker]);
    }
  };

  const SortHeader = ({ label, keyName, className = '' }) => (
    <button
      onClick={() => toggleSort(keyName)}
      className={`flex items-center gap-2 text-xs font-medium text-text-muted hover:text-text-secondary uppercase tracking-wider transition-colors ${className}`}
    >
      {label}
      <ArrowUpDown className="w-3 h-3 opacity-50" />
    </button>
  );

  return (
    <div className="card overflow-hidden">
      <div className="px-8 py-6 border-b border-border flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary tracking-tight">{title}</h3>
        <span className="text-sm text-text-muted font-[family-name:var(--font-mono)]">{tickers.length} tickers</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-8 py-4 w-10">
                <span className="text-xs text-text-muted">#</span>
              </th>
              <th className="text-left px-8 py-4"><SortHeader label="Ticker" keyName="ticker" /></th>
              <th className="text-right px-8 py-4 hidden sm:table-cell"><SortHeader label="Price" keyName="current_price" className="justify-end" /></th>
              <th className="text-right px-8 py-4"><SortHeader label="Change" keyName="price_change_pct" className="justify-end" /></th>
              <th className="text-right px-8 py-4"><SortHeader label="Mentions" keyName="mention_count" className="justify-end" /></th>
              <th className="text-right px-8 py-4 hidden md:table-cell"><SortHeader label="Sentiment" keyName="avg_sentiment" className="justify-end" /></th>
              <th className="text-center px-8 py-4 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => (
              <tr
                key={t.ticker}
                onClick={() => navigate(`/analysis/${t.ticker}`)}
                className="border-b border-border hover:bg-white/[0.02] cursor-pointer transition-colors"
              >
                <td className="px-8 py-5 text-sm text-text-muted font-[family-name:var(--font-mono)]">{i + 1}</td>
                <td className="px-8 py-5">
                  <div>
                    <span className="text-base font-semibold text-accent font-[family-name:var(--font-mono)]">{t.ticker}</span>
                    <p className="text-xs text-text-muted truncate max-w-[200px] mt-1">{t.company_name}</p>
                  </div>
                </td>
                <td className="px-8 py-5 text-right text-sm font-[family-name:var(--font-mono)] text-text-primary hidden sm:table-cell">
                  {formatPrice(t.current_price)}
                </td>
                <td className={`px-8 py-5 text-right text-sm font-semibold font-[family-name:var(--font-mono)] ${changeColor(t.price_change_pct)}`}>
                  {formatPercent(t.price_change_pct)}
                </td>
                <td className="px-8 py-5 text-right">
                  <span className="text-sm font-[family-name:var(--font-mono)] text-amber">{t.mention_count}</span>
                </td>
                <td className="px-8 py-5 text-right hidden md:table-cell">
                  <div className="flex items-center justify-end gap-3">
                    <div className="w-20 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${t.avg_sentiment > 0 ? 'bg-electric' : t.avg_sentiment < 0 ? 'bg-danger' : 'bg-amber'}`}
                        style={{ width: `${Math.min(100, Math.abs(t.avg_sentiment) * 100 + 50)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-[family-name:var(--font-mono)] ${sentimentColor(t.avg_sentiment)}`}>
                      {t.avg_sentiment > 0 ? '+' : ''}{t.avg_sentiment?.toFixed(2)}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                  <button
                    onClick={(e) => toggleWatchlist(e, t.ticker)}
                    className="p-2.5 rounded-lg hover:bg-white/[0.06] transition-all"
                  >
                    <Star
                      className={`w-4 h-4 transition-colors ${isWatchlisted(t.ticker) ? 'text-amber fill-amber' : 'text-text-muted/40 hover:text-text-muted'}`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
