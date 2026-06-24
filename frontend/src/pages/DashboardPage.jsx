import { useState, useEffect } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
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
    <div>
      {/* Hero */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <FadeIn>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary tracking-[-0.03em] leading-[1.1]">
              {greeting()}
            </h1>
            <p className="text-base sm:text-lg text-text-secondary mt-4 max-w-md mx-auto">
              Here's what's moving the market today.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="mt-8 inline-flex items-center gap-2.5 px-6 py-3 text-sm font-medium text-text-primary bg-accent/10 border border-accent/20 rounded-full hover:bg-accent/15 transition-all disabled:opacity-40 cursor-pointer"
            >
              {refreshing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <RefreshCw className="w-4 h-4" />
              }
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </FadeIn>
        </div>
      </section>

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <section className="pb-12">
          <div className="max-w-6xl mx-auto px-6">
            <WatchlistSection watchlist={watchlist} setWatchlist={setWatchlist} trendingData={trending} />
          </div>
        </section>
      )}

      {/* AI Briefing */}
      <section className="alt-section py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <FadeInView>
            <DailyBriefing briefing={briefing} loading={briefingLoading} />
          </FadeInView>
        </div>
      </section>

      {/* Top Stocks */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <FadeInView>
            <div className="text-center mb-10">
              <p className="section-label mb-2">Most discussed in the last 24 hours</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-[-0.02em]">Top Stocks</h2>
            </div>
          </FadeInView>
          <TrendingCards tickers={stocks} loading={trendingLoading} />
        </div>
      </section>

      {/* Top ETFs */}
      {(trendingLoading || etfs.length > 0) && (
        <section className="alt-section py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-6">
            <FadeInView>
              <div className="text-center mb-10">
                <p className="section-label mb-2">Most discussed exchange-traded funds</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-[-0.02em]">Top ETFs</h2>
              </div>
            </FadeInView>
            <TrendingCards tickers={etfs} loading={trendingLoading} />
          </div>
        </section>
      )}

      {/* Trending Table */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <FadeInView>
            <div className="text-center mb-10">
              <p className="section-label mb-2">Full breakdown</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-[-0.02em]">All Trending</h2>
            </div>
          </FadeInView>

          <FadeInView delay={0.1}>
            <TrendingTable
              tickers={stocks}
              loading={trendingLoading}
              watchlist={watchlist}
              setWatchlist={setWatchlist}
              title="Stocks"
            />
          </FadeInView>

          {etfs.length > 0 && (
            <FadeInView delay={0.15}>
              <div className="mt-8">
                <TrendingTable
                  tickers={etfs}
                  loading={trendingLoading}
                  watchlist={watchlist}
                  setWatchlist={setWatchlist}
                  title="ETFs"
                />
              </div>
            </FadeInView>
          )}
        </div>
      </section>

      {/* News & Social */}
      <section className="alt-section py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <FadeInView>
            <div className="text-center mb-10">
              <p className="section-label mb-2">What people are saying</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-[-0.02em]">News & Social</h2>
            </div>
          </FadeInView>
          <FadeInView delay={0.1}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RedditBuzz posts={redditPosts} loading={redditLoading} />
              <NewsFeed items={feed} loading={feedLoading} />
            </div>
          </FadeInView>
        </div>
      </section>
    </div>
  );
}
