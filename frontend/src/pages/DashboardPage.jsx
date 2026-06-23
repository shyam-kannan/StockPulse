import { TrendingUp, RefreshCw } from 'lucide-react';
import { usePolling } from '../hooks/usePolling';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { api } from '../utils/api';
import TrendingCards from '../components/dashboard/TrendingCards';
import TrendingTable from '../components/dashboard/TrendingTable';
import NewsFeed from '../components/dashboard/NewsFeed';
import WatchlistSection from '../components/dashboard/WatchlistSection';

export default function DashboardPage() {
  const { data: trending, loading: trendingLoading, refetch: refetchTrending } = usePolling(api.getTrending, 5 * 60 * 1000);
  const { data: feed, loading: feedLoading } = usePolling(api.getFeed, 5 * 60 * 1000);
  const [watchlist, setWatchlist] = useLocalStorage('stockpulse-watchlist', []);

  const handleRefresh = async () => {
    try {
      await api.triggerScrape();
      setTimeout(refetchTrending, 3000);
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      <WatchlistSection watchlist={watchlist} setWatchlist={setWatchlist} trendingData={trending} />

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-electric" />
            <h2 className="text-lg font-semibold text-text-primary">Today's Top Movers</h2>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary bg-navy-800 border border-border rounded-md hover:border-electric/50 hover:text-electric transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh Data
          </button>
        </div>
        <TrendingCards tickers={trending} loading={trendingLoading} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendingTable
            tickers={trending}
            loading={trendingLoading}
            watchlist={watchlist}
            setWatchlist={setWatchlist}
          />
        </div>
        <div>
          <NewsFeed items={feed} loading={feedLoading} />
        </div>
      </div>
    </div>
  );
}
