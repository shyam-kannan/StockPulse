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
    <div>

      {/* Hero */}
      <section className="pt-16 pb-14 sm:pt-24 sm:pb-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
          <FadeIn>
            <h1 className="text-4xl sm:text-6xl font-bold text-text-primary tracking-tight leading-[1.1]">
              {greeting()}
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-lg sm:text-xl text-text-muted mt-4 max-w-lg mx-auto font-light leading-relaxed">
              Here's what's moving the market today.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <section className="pb-8">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
            <WatchlistSection watchlist={watchlist} setWatchlist={setWatchlist} trendingData={trending} />
          </div>
        </section>
      )}

      {/* AI Briefing */}
      <section className="alt-section py-14 sm:py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <FadeInView>
            <DailyBriefing briefing={briefing} loading={briefingLoading} />
          </FadeInView>
        </div>
      </section>

      {/* Top Stocks */}
      <section className="py-14 sm:py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <FadeInView>
            <div className="text-center mb-10">
              <p className="section-label mb-3">Most discussed in the last 24 hours</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">Top Stocks</h2>
            </div>
          </FadeInView>

          <TrendingCards tickers={stocks} loading={trendingLoading} />

          <FadeInView delay={0.2}>
            <div className="flex justify-center mt-8">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-text-muted bg-white/[0.04] border border-white/[0.06] rounded-full hover:border-white/[0.14] hover:text-text-secondary hover:bg-white/[0.06] transition-all disabled:opacity-40 cursor-pointer"
              >
                {refreshing
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <RefreshCw className="w-4 h-4" />
                }
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* Top ETFs */}
      {(trendingLoading || etfs.length > 0) && (
        <section className="alt-section py-14 sm:py-20">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
            <FadeInView>
              <div className="text-center mb-10">
                <p className="section-label mb-3">Most discussed exchange-traded funds</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">Top ETFs</h2>
              </div>
            </FadeInView>

            <TrendingCards tickers={etfs} loading={trendingLoading} />
          </div>
        </section>
      )}

      {/* Trending Table */}
      <section className="py-14 sm:py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <FadeInView>
            <div className="text-center mb-10">
              <p className="section-label mb-3">Full breakdown</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">Trending Tickers</h2>
            </div>
          </FadeInView>

          <FadeInView delay={0.1}>
            <TrendingTable
              tickers={stocks}
              loading={trendingLoading}
              watchlist={watchlist}
              setWatchlist={setWatchlist}
              title="Trending Stocks"
            />
          </FadeInView>

          {etfs.length > 0 && (
            <FadeInView delay={0.15}>
              <div className="mt-10">
                <TrendingTable
                  tickers={etfs}
                  loading={trendingLoading}
                  watchlist={watchlist}
                  setWatchlist={setWatchlist}
                  title="Trending ETFs"
                />
              </div>
            </FadeInView>
          )}
        </div>
      </section>

      {/* News & Social */}
      <section className="alt-section py-14 sm:py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <FadeInView>
            <div className="text-center mb-10">
              <p className="section-label mb-3">What people are saying</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">News & Social</h2>
            </div>
          </FadeInView>

          <FadeInView delay={0.1}>
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
          </FadeInView>
        </div>
      </section>
    </div>
  );
}
