import { useState, useEffect } from 'react';
import { RefreshCw, Loader2, Newspaper, MessageSquare } from 'lucide-react';
import { usePolling } from '../hooks/usePolling';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { api } from '../utils/api';
import { FadeIn, FadeInView } from '../components/motion';
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
    <div className="max-w-[1280px] mx-auto px-6 lg:px-8">

      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between pt-8 pb-6 border-b border-border">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
              {greeting()}
            </h1>
            <p className="text-sm text-text-muted mt-1">Here's what's moving the market today.</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-text-muted bg-white/[0.03] border border-border rounded-lg hover:border-border-hover hover:text-text-secondary transition-all disabled:opacity-40 cursor-pointer"
          >
            {refreshing
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <RefreshCw className="w-3.5 h-3.5" />
            }
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </FadeIn>

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <div className="pt-6">
          <WatchlistSection watchlist={watchlist} setWatchlist={setWatchlist} trendingData={trending} />
        </div>
      )}

      {/* AI Briefing */}
      <FadeInView>
        <div className="pt-10 pb-8">
          <DailyBriefing briefing={briefing} loading={briefingLoading} />
        </div>
      </FadeInView>

      {/* Top Stocks */}
      <FadeInView>
        <div className="py-8">
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-text-primary tracking-tight">Top Stocks</h2>
              <p className="text-[13px] text-text-muted mt-0.5">Most discussed in the last 24 hours</p>
            </div>
          </div>
          <TrendingCards tickers={stocks} loading={trendingLoading} />
        </div>
      </FadeInView>

      {/* Top ETFs */}
      {(trendingLoading || etfs.length > 0) && (
        <FadeInView>
          <div className="py-8 border-t border-border">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-text-primary tracking-tight">Top ETFs</h2>
              <p className="text-[13px] text-text-muted mt-0.5">Most discussed exchange-traded funds</p>
            </div>
            <TrendingCards tickers={etfs} loading={trendingLoading} />
          </div>
        </FadeInView>
      )}

      {/* Trending Table */}
      <FadeInView>
        <div className="py-8 border-t border-border">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-text-primary tracking-tight">All Trending</h2>
          </div>

          <TrendingTable
            tickers={stocks}
            loading={trendingLoading}
            watchlist={watchlist}
            setWatchlist={setWatchlist}
            title="Stocks"
          />

          {etfs.length > 0 && (
            <div className="mt-6">
              <TrendingTable
                tickers={etfs}
                loading={trendingLoading}
                watchlist={watchlist}
                setWatchlist={setWatchlist}
                title="ETFs"
              />
            </div>
          )}
        </div>
      </FadeInView>

      {/* News & Social */}
      <FadeInView>
        <div className="py-8 border-t border-border pb-16">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-text-primary tracking-tight">News & Social</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RedditBuzz posts={redditPosts} loading={redditLoading} />
            <NewsFeed items={feed} loading={feedLoading} />
          </div>
        </div>
      </FadeInView>
    </div>
  );
}
