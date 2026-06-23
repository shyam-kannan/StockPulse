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

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-10 fade-in">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          {greeting()}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Here is what is moving the market today.
        </p>
      </div>

      {/* Watchlist */}
      <WatchlistSection watchlist={watchlist} setWatchlist={setWatchlist} trendingData={trending} />

      {/* Daily Briefing */}
      <DailyBriefing briefing={briefing} loading={briefingLoading} />

      {/* Top Movers */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="section-title" style={{ marginBottom: 0 }}>
            <div className="icon-wrapper">
              <TrendingUp />
            </div>
            <div>
              <h2>Top Movers</h2>
              <p>Most discussed stocks in the last 24 hours</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-text-muted bg-white/[0.03] border border-white/[0.06] rounded-lg hover:border-white/[0.12] hover:text-text-secondary transition-all duration-200 disabled:opacity-40 cursor-pointer"
          >
            {refreshing
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <RefreshCw className="w-3 h-3" />
            }
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <TrendingCards tickers={trending} loading={trendingLoading} />
      </section>

      {/* Main content grid: 2/3 table + 1/3 sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
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
