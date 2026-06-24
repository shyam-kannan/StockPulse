import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Loader2, Newspaper, MessageSquare } from 'lucide-react';
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

      {/* ===== HERO — centered, full viewport feel ===== */}
      <section className="text-center pt-16 pb-20 sm:pt-24 sm:pb-28">
        <h1 className="text-5xl sm:text-7xl font-bold text-text-primary tracking-tight leading-[1.1]">
          {greeting()}
        </h1>
        <p className="text-xl sm:text-2xl text-text-muted mt-6 max-w-xl mx-auto leading-relaxed font-light">
          Here's what's moving the market today.
        </p>
      </section>

      {/* ===== WATCHLIST ===== */}
      {watchlist.length > 0 && (
        <section className="mb-24">
          <WatchlistSection watchlist={watchlist} setWatchlist={setWatchlist} trendingData={trending} />
        </section>
      )}

      {/* ===== AI BRIEFING — full bleed alt background ===== */}
      <section className="full-bleed-section alt-section py-20 sm:py-28 mb-0">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
          <DailyBriefing briefing={briefing} loading={briefingLoading} />
        </div>
      </section>

      {/* ===== TOP STOCKS — big centered section ===== */}
      <section className="py-20 sm:py-28">
        <div className="text-center mb-16">
          <p className="section-label mb-4">Most discussed in the last 24 hours</p>
          <h2 className="text-3xl sm:text-5xl font-bold text-text-primary tracking-tight">
            Top Stocks
          </h2>
        </div>

        <TrendingCards tickers={stocks} loading={trendingLoading} />

        <div className="flex justify-center mt-10">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2.5 px-7 py-3 text-sm font-medium text-text-muted bg-white/[0.04] border border-white/[0.08] rounded-full hover:border-white/[0.15] hover:text-text-secondary hover:bg-white/[0.06] transition-all duration-300 disabled:opacity-40 cursor-pointer"
          >
            {refreshing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <RefreshCw className="w-4 h-4" />
            }
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </section>

      {/* ===== TOP ETFs — alt background ===== */}
      {(trendingLoading || etfs.length > 0) && (
        <section className="full-bleed-section alt-section py-20 sm:py-28">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
            <div className="text-center mb-16">
              <p className="section-label mb-4">Most discussed exchange-traded funds</p>
              <h2 className="text-3xl sm:text-5xl font-bold text-text-primary tracking-tight">
                Top ETFs
              </h2>
            </div>

            <TrendingCards tickers={etfs} loading={trendingLoading} />
          </div>
        </section>
      )}

      {/* ===== TRENDING TABLE ===== */}
      <section className="py-20 sm:py-28">
        <div className="text-center mb-16">
          <p className="section-label mb-4">Full breakdown</p>
          <h2 className="text-3xl sm:text-5xl font-bold text-text-primary tracking-tight">
            Trending Tickers
          </h2>
        </div>

        <TrendingTable
          tickers={stocks}
          loading={trendingLoading}
          watchlist={watchlist}
          setWatchlist={setWatchlist}
          title="Trending Stocks"
        />

        {etfs.length > 0 && (
          <div className="mt-20">
            <TrendingTable
              tickers={etfs}
              loading={trendingLoading}
              watchlist={watchlist}
              setWatchlist={setWatchlist}
              title="Trending ETFs"
            />
          </div>
        )}
      </section>

      {/* ===== NEWS + SOCIAL — side by side, alt background ===== */}
      <section className="full-bleed-section alt-section py-20 sm:py-28">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center mb-16">
            <p className="section-label mb-4">What people are saying</p>
            <h2 className="text-3xl sm:text-5xl font-bold text-text-primary tracking-tight">
              News & Social
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <MessageSquare className="w-5 h-5 text-electric" />
                <h3 className="text-lg font-semibold text-text-primary">Reddit Buzz</h3>
              </div>
              <RedditBuzz posts={redditPosts} loading={redditLoading} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-8">
                <Newspaper className="w-5 h-5 text-amber" />
                <h3 className="text-lg font-semibold text-text-primary">Market News</h3>
              </div>
              <NewsFeed items={feed} loading={feedLoading} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
