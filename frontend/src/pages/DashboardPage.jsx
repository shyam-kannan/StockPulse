import { useState, useEffect } from 'react';
import { RefreshCw, Loader2, Newspaper, MessageSquare } from 'lucide-react';
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

      {/* Hero */}
      <section className="pt-10 pb-12 sm:pt-14 sm:pb-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight">
            {greeting()}
          </h1>
          <p className="text-lg text-text-muted mt-3 font-light">
            Here's what's moving the market today.
          </p>
        </div>
      </section>

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <section className="pb-10">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
            <WatchlistSection watchlist={watchlist} setWatchlist={setWatchlist} trendingData={trending} />
          </div>
        </section>
      )}

      {/* AI Briefing */}
      <section className="alt-section py-12 sm:py-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <DailyBriefing briefing={briefing} loading={briefingLoading} />
        </div>
      </section>

      {/* Top Stocks */}
      <section className="py-12 sm:py-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="section-label mb-2">Most discussed in the last 24 hours</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Top Stocks</h2>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-text-muted bg-white/[0.04] border border-white/[0.06] rounded-xl hover:border-white/[0.12] hover:text-text-secondary transition-all disabled:opacity-40 cursor-pointer"
            >
              {refreshing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <RefreshCw className="w-4 h-4" />
              }
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <TrendingCards tickers={stocks} loading={trendingLoading} />
        </div>
      </section>

      {/* Top ETFs */}
      {(trendingLoading || etfs.length > 0) && (
        <section className="alt-section py-12 sm:py-16">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
            <div className="mb-8">
              <p className="section-label mb-2">Most discussed exchange-traded funds</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Top ETFs</h2>
            </div>
            <TrendingCards tickers={etfs} loading={trendingLoading} />
          </div>
        </section>
      )}

      {/* Trending Table */}
      <section className="py-12 sm:py-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="mb-8">
            <p className="section-label mb-2">Full breakdown</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Trending Tickers</h2>
          </div>

          <TrendingTable
            tickers={stocks}
            loading={trendingLoading}
            watchlist={watchlist}
            setWatchlist={setWatchlist}
            title="Trending Stocks"
          />

          {etfs.length > 0 && (
            <div className="mt-10">
              <TrendingTable
                tickers={etfs}
                loading={trendingLoading}
                watchlist={watchlist}
                setWatchlist={setWatchlist}
                title="Trending ETFs"
              />
            </div>
          )}
        </div>
      </section>

      {/* News & Social */}
      <section className="alt-section py-12 sm:py-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="mb-8">
            <p className="section-label mb-2">What people are saying</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">News & Social</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <MessageSquare className="w-4 h-4 text-electric" />
                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Reddit Buzz</h3>
              </div>
              <RedditBuzz posts={redditPosts} loading={redditLoading} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <Newspaper className="w-4 h-4 text-amber" />
                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Market News</h3>
              </div>
              <NewsFeed items={feed} loading={feedLoading} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
