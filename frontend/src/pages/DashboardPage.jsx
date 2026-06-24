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

const ETF_TICKERS = new Set(['QQQ', 'SPY', 'SMH', 'IGV', 'IWM', 'DIA', 'XLF', 'XLE', 'XLK', 'XLV', 'XLI', 'XLP', 'XLU', 'XLB', 'XLRE', 'XLC', 'XLY', 'GLD', 'SLV', 'TLT', 'HYG', 'VTI', 'VOO', 'ARKK', 'ARKG', 'SOXX', 'SOXL', 'TQQQ', 'SQQQ', 'VXX', 'UVXY', 'EEM', 'EFA', 'IBIT', 'FBTC']);

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

  const stocks = trending?.filter(t => !ETF_TICKERS.has(t.ticker)) || [];
  const etfs = trending?.filter(t => ETF_TICKERS.has(t.ticker)) || [];

  return (
    <div className="fade-in">

      {/* Hero header */}
      <div className="pt-4 pb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight leading-tight">
          {greeting()}
        </h1>
        <p className="text-lg text-text-muted mt-4 max-w-2xl leading-relaxed">
          Here is what is moving the market today.
        </p>
      </div>

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <div className="mb-20">
          <WatchlistSection watchlist={watchlist} setWatchlist={setWatchlist} trendingData={trending} />
        </div>
      )}

      {/* Daily Briefing */}
      <div className="mb-20">
        <DailyBriefing briefing={briefing} loading={briefingLoading} />
      </div>

      <div className="section-divider" />

      {/* Top Movers — Stocks */}
      <section className="py-16">
        <div className="flex items-center justify-between mb-10">
          <div className="section-title" style={{ marginBottom: 0 }}>
            <div className="icon-wrapper">
              <TrendingUp />
            </div>
            <div>
              <h2 className="!text-xl">Top Stocks</h2>
              <p className="!text-sm mt-1">Most discussed individual stocks in the last 24 hours</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium text-text-muted bg-white/[0.03] border border-white/[0.06] rounded-xl hover:border-white/[0.12] hover:text-text-secondary transition-all duration-200 disabled:opacity-40 cursor-pointer"
          >
            {refreshing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <RefreshCw className="w-4 h-4" />
            }
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <TrendingCards tickers={stocks} loading={trendingLoading} />
      </section>

      {/* Top Movers — ETFs */}
      {(trendingLoading || etfs.length > 0) && (
        <section className="pb-16">
          <div className="mb-10">
            <div className="section-title" style={{ marginBottom: 0 }}>
              <div className="icon-wrapper" style={{ background: 'rgba(251, 191, 36, 0.10)' }}>
                <TrendingUp style={{ color: '#fbbf24' }} />
              </div>
              <div>
                <h2 className="!text-xl">Top ETFs</h2>
                <p className="!text-sm mt-1">Most discussed exchange-traded funds</p>
              </div>
            </div>
          </div>

          <TrendingCards tickers={etfs} loading={trendingLoading} />
        </section>
      )}

      <div className="section-divider" />

      {/* Main content grid */}
      <div className="py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-16">
          <TrendingTable
            tickers={stocks}
            loading={trendingLoading}
            watchlist={watchlist}
            setWatchlist={setWatchlist}
            title="Trending Stocks"
          />
          {etfs.length > 0 && (
            <TrendingTable
              tickers={etfs}
              loading={trendingLoading}
              watchlist={watchlist}
              setWatchlist={setWatchlist}
              title="Trending ETFs"
            />
          )}
        </div>

        <div className="space-y-12">
          <RedditBuzz posts={redditPosts} loading={redditLoading} />
          <NewsFeed items={feed} loading={feedLoading} />
        </div>
      </div>
    </div>
  );
}
