import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Loader2 } from 'lucide-react';
import { usePolling } from '../hooks/usePolling';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { api } from '../utils/api';
import DailyBriefing from '../components/dashboard/DailyBriefing';
import TrendingCards from '../components/dashboard/TrendingCards';
import TrendingTable from '../components/dashboard/TrendingTable';
import NewsFeed from '../components/dashboard/NewsFeed';
import RedditBuzz from '../components/dashboard/RedditBuzz';
import WatchlistSection from '../components/dashboard/WatchlistSection';

export default function DashboardPage() {
  const { data: trending, loading: trendingLoading, refetch: refetchTrending } = usePolling(api.getTrending, 5 * 60 * 1000);
  const { data: feed, loading: feedLoading } = usePolling(api.getFeed, 5 * 60 * 1000);
  const { data: redditPosts, loading: redditLoading } = usePolling(api.getRedditActivity, 5 * 60 * 1000);
  const [watchlist, setWatchlist] = useLocalStorage('stockpulse-watchlist', []);

  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadBriefing() {
      setBriefingLoading(true);
      try {
        const data = await api.getDailyBriefing();
        if (!cancelled) setBriefing(data);
      } catch (err) {
        console.error('Briefing failed:', err);
        if (!cancelled) setBriefing(null);
      } finally {
        if (!cancelled) setBriefingLoading(false);
      }
    }
    loadBriefing();
    return () => { cancelled = true; };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.triggerScrape();
      setTimeout(() => {
        refetchTrending();
        setRefreshing(false);
      }, 3000);
    } catch (err) {
      console.error('Refresh failed:', err);
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <WatchlistSection watchlist={watchlist} setWatchlist={setWatchlist} trendingData={trending} />

      <DailyBriefing briefing={briefing} loading={briefingLoading} />

      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-electric/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-electric" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Top Movers</h2>
              <p className="text-xs text-text-muted">Most discussed stocks in the last 24 hours</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary bg-white/[0.04] border border-border rounded-xl hover:border-border-hover hover:text-text-primary transition-all disabled:opacity-50 cursor-pointer"
          >
            {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <TrendingCards tickers={trending} loading={trendingLoading} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TrendingTable
            tickers={trending}
            loading={trendingLoading}
            watchlist={watchlist}
            setWatchlist={setWatchlist}
          />
        </div>
        <div className="space-y-6">
          <RedditBuzz posts={redditPosts} loading={redditLoading} />
          <NewsFeed items={feed} loading={feedLoading} />
        </div>
      </div>
    </div>
  );
}
