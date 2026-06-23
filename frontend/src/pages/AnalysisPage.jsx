import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TrendingUp, BarChart3, Target, Loader2 } from 'lucide-react';
import { api } from '../utils/api';
import { formatPrice, formatPercent, formatMarketCap, changeColor } from '../utils/formatters';
import SearchBar from '../components/analysis/SearchBar';
import AnalysisCard from '../components/analysis/AnalysisCard';
import PriceChart from '../components/analysis/PriceChart';
import PriceTargetBar from '../components/analysis/PriceTargetBar';
import RedditMentions from '../components/analysis/RedditMentions';

/* ─────────────────────────────────────────────
   Inline content components
   ───────────────────────────────────────────── */

function MomentumContent({ data }) {
  if (!data || data.error) return <p className="text-text-muted text-sm">Analysis unavailable</p>;

  const ratingColor = {
    'Strong Bullish': 'bg-electric/15 text-electric',
    'Bullish': 'bg-electric/10 text-electric-dim',
    'Neutral': 'bg-amber/10 text-amber',
    'Bearish': 'bg-danger/10 text-danger-dim',
    'Strong Bearish': 'bg-danger/15 text-danger',
  };

  return (
    <div className="space-y-5">
      {/* One-liner quote — visually prominent at the top */}
      {data.one_liner && (
        <div className="p-5 bg-electric/[0.04] border border-electric/15 rounded-xl">
          <p className="text-sm text-electric/90 italic leading-relaxed">"{data.one_liner}"</p>
        </div>
      )}

      {/* Rating badge */}
      {data.momentum_rating && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted uppercase tracking-wider">Rating</span>
          <span className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-lg ${ratingColor[data.momentum_rating] || 'bg-white/[0.04] text-text-secondary'}`}>
            {data.momentum_rating}
          </span>
        </div>
      )}

      {/* Narrative */}
      {data.narrative && (
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Narrative</p>
          <p className="text-sm text-text-secondary leading-relaxed">{data.narrative}</p>
        </div>
      )}

      {/* Catalyst */}
      {data.catalyst && (
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Catalyst</p>
          <p className="text-sm text-text-primary leading-relaxed">{data.catalyst}</p>
        </div>
      )}

      {/* Institutional view */}
      {data.institutional_view && (
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Institutional View</p>
          <p className="text-sm text-text-secondary leading-relaxed">{data.institutional_view}</p>
        </div>
      )}

      {/* Key levels */}
      {data.key_levels && (
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Key Levels</p>
          <div className="flex gap-4 text-sm font-[family-name:var(--font-mono)]">
            {data.key_levels.support && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-electric" />
                <span className="text-text-muted text-xs">Support</span>
                <span className="text-electric font-medium">{formatPrice(data.key_levels.support)}</span>
              </div>
            )}
            {data.key_levels.resistance && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-danger" />
                <span className="text-text-muted text-xs">Resistance</span>
                <span className="text-danger font-medium">{formatPrice(data.key_levels.resistance)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FundamentalsContent({ data, yfinance }) {
  if (!data || data.error) return <p className="text-text-muted text-sm">Analysis unavailable</p>;

  const healthColor = {
    'Strong': 'text-electric',
    'Adequate': 'text-amber',
    'Weak': 'text-danger',
  };

  return (
    <div className="space-y-5">
      {/* Quality badges */}
      {data.key_metrics && (
        <div className="flex gap-2 flex-wrap">
          {data.key_metrics.growth_quality && (
            <span className="text-xs px-3 py-1.5 bg-white/[0.04] rounded-lg text-text-secondary font-medium">
              Growth: {data.key_metrics.growth_quality}
            </span>
          )}
          {data.key_metrics.financial_health && (
            <span className={`text-xs px-3 py-1.5 bg-white/[0.04] rounded-lg font-medium ${healthColor[data.key_metrics.financial_health] || 'text-text-secondary'}`}>
              Health: {data.key_metrics.financial_health}
            </span>
          )}
        </div>
      )}

      {/* Valuation summary */}
      {data.valuation_summary && (
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Valuation</p>
          <p className="text-sm text-text-secondary leading-relaxed">{data.valuation_summary}</p>
        </div>
      )}

      {/* Growth assessment */}
      {data.growth_assessment && (
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Growth</p>
          <p className="text-sm text-text-secondary leading-relaxed">{data.growth_assessment}</p>
        </div>
      )}

      {/* Fair value callout */}
      {data.fair_value_assessment && (
        <div className={`p-4 rounded-xl border ${
          data.fair_value_assessment === 'below_fair_value'
            ? 'bg-electric/[0.04] border-electric/15'
            : data.fair_value_assessment === 'above_fair_value'
            ? 'bg-danger/[0.04] border-danger/15'
            : 'bg-amber/[0.04] border-amber/15'
        }`}>
          <p className="text-xs text-text-muted mb-1.5 uppercase tracking-wider">Fair Value Assessment</p>
          <p className="text-sm font-semibold capitalize">
            {data.fair_value_assessment.replace(/_/g, ' ')}
          </p>
          {data.fair_value_reasoning && (
            <p className="text-xs text-text-secondary mt-2 leading-relaxed">{data.fair_value_reasoning}</p>
          )}
        </div>
      )}
    </div>
  );
}

function PriceTargetContent({ data, currentPrice }) {
  if (!data || data.error) return <p className="text-text-muted text-sm">Analysis unavailable</p>;

  const scenarios = [
    { key: 'bear_case', label: 'Bear', color: 'text-danger', timeframe: data.bear_case?.timeframe },
    { key: 'base_case', label: 'Base', color: 'text-amber', timeframe: data.base_case?.timeframe },
    { key: 'bull_case', label: 'Bull', color: 'text-electric-dim', timeframe: data.bull_case?.timeframe },
    { key: 'stretched_bull', label: 'Stretched Bull', color: 'text-electric', timeframe: data.stretched_bull?.timeframe },
  ];

  return (
    <div className="space-y-5">
      <PriceTargetBar priceTargets={data} currentPrice={currentPrice} />

      <div className="space-y-2">
        {scenarios.map((s) => {
          const scenario = data[s.key];
          if (!scenario) return null;
          return (
            <div key={s.key} className="bg-white/[0.02] rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-semibold ${s.color}`}>{s.label}</span>
                <div className="flex items-center gap-2.5">
                  <span className={`text-sm font-semibold font-[family-name:var(--font-mono)] ${s.color}`}>
                    {formatPrice(scenario.price)}
                  </span>
                  {s.timeframe && <span className="text-[10px] text-text-muted">{s.timeframe}</span>}
                </div>
              </div>
              {scenario.reasoning && (
                <p className="text-xs text-text-muted leading-relaxed mt-1">{scenario.reasoning}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Key metrics pill strip
   ───────────────────────────────────────────── */

function MetricPill({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col items-center bg-white/[0.03] border border-border rounded-xl px-4 py-2.5 whitespace-nowrap shrink-0">
      <span className="text-[10px] text-text-muted uppercase tracking-wider leading-none mb-1">{label}</span>
      <span className="text-xs font-medium text-text-primary font-[family-name:var(--font-mono)] leading-none">{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main page component
   ───────────────────────────────────────────── */

export default function AnalysisPage() {
  const { ticker } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticker) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    api.getStock(ticker)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  const yf = data?.yfinance;
  const priceChange = yf?.current_price && yf?.previous_close
    ? ((yf.current_price - yf.previous_close) / yf.previous_close) * 100
    : null;

  /* ── Empty state: no ticker ── */
  if (!ticker && !loading) {
    return (
      <div className="space-y-8 fade-in">
        <SearchBar currentTicker={ticker} />
        <div className="text-center py-24">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/[0.03] rounded-3xl flex items-center justify-center border border-border">
            <Target className="w-9 h-9 text-electric/40" />
          </div>
          <h2 className="text-2xl font-semibold text-text-primary mb-3">Search for a Stock</h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto leading-relaxed">
            Enter a ticker symbol above to get AI-powered momentum analysis,
            fundamental insights, and price target frameworks.
          </p>
        </div>
      </div>
    );
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="space-y-8 fade-in">
        <SearchBar currentTicker={ticker} />
        <div className="text-center py-24">
          <Loader2 className="w-9 h-9 text-electric animate-spin mx-auto mb-5" />
          <p className="text-text-secondary text-base">
            Analyzing <span className="text-electric font-[family-name:var(--font-mono)] font-semibold">{ticker}</span>
          </p>
          <p className="text-text-muted text-xs mt-2">This may take 10-15 seconds</p>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="space-y-8 fade-in">
        <SearchBar currentTicker={ticker} />
        <div className="bg-danger/[0.06] border border-danger/15 rounded-2xl p-10 text-center max-w-lg mx-auto">
          <p className="text-danger font-semibold text-lg mb-2">Analysis Failed</p>
          <p className="text-text-secondary text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  /* ── No data (shouldn't happen, but guard) ── */
  if (!data) {
    return (
      <div className="space-y-8 fade-in">
        <SearchBar currentTicker={ticker} />
      </div>
    );
  }

  /* ── Data loaded: full analysis layout ── */
  return (
    <div className="space-y-8 fade-in">

      {/* 1. Search bar */}
      <SearchBar currentTicker={ticker} />

      {/* 2. Stock header */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-5">
          {/* Ticker + company name */}
          <div className="flex items-baseline gap-3">
            <h1 className="text-4xl sm:text-5xl font-bold gradient-text font-[family-name:var(--font-mono)] leading-none">
              {data.ticker}
            </h1>
            {data.company_name && (
              <span className="text-base sm:text-lg text-text-secondary truncate max-w-[260px]">
                {data.company_name}
              </span>
            )}
          </div>

          {/* Price + change */}
          {yf?.current_price && (
            <div className="flex items-baseline gap-3 sm:ml-auto">
              <span className="text-3xl sm:text-4xl font-semibold text-text-primary font-[family-name:var(--font-mono)]">
                {formatPrice(yf.current_price)}
              </span>
              {priceChange != null && (
                <span className={`text-lg font-semibold font-[family-name:var(--font-mono)] ${changeColor(priceChange)}`}>
                  {formatPercent(priceChange)}
                </span>
              )}
              {data.from_cache && (
                <span className="text-[10px] bg-amber/10 text-amber px-2.5 py-1 rounded-lg font-medium uppercase tracking-wider">Cached</span>
              )}
            </div>
          )}
        </div>

        {/* 3. Key metrics strip */}
        {yf && (
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
            <MetricPill label="Market Cap" value={yf.market_cap ? formatMarketCap(yf.market_cap) : null} />
            <MetricPill label="P/E (TTM)" value={yf.pe_ratio ? yf.pe_ratio.toFixed(1) : null} />
            <MetricPill label="Fwd P/E" value={yf.forward_pe ? yf.forward_pe.toFixed(1) : null} />
            <MetricPill
              label="52W Range"
              value={yf.fifty_two_week_low && yf.fifty_two_week_high
                ? `${formatPrice(yf.fifty_two_week_low)} - ${formatPrice(yf.fifty_two_week_high)}`
                : null
              }
            />
            <MetricPill label="Sector" value={yf.sector || null} />
            <MetricPill label="Beta" value={yf.beta ? yf.beta.toFixed(2) : null} />
          </div>
        )}
      </div>

      {/* 4. Chart + Price Targets row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <PriceChart history={yf?.history} loading={false} />
        </div>
        <div className="lg:col-span-2">
          <AnalysisCard title="Price Targets" icon={Target} accentColor="electric" loading={false}>
            <PriceTargetContent data={data.price_targets} currentPrice={yf?.current_price} />
          </AnalysisCard>
        </div>
      </div>

      {/* 5. Momentum + Fundamentals row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <AnalysisCard title="Momentum Analysis" icon={TrendingUp} accentColor="electric" loading={false}>
            <MomentumContent data={data.momentum} />
          </AnalysisCard>
        </div>
        <div className="lg:col-span-2">
          <AnalysisCard title="Fundamental Snapshot" icon={BarChart3} accentColor="amber" loading={false}>
            <FundamentalsContent data={data.fundamentals} yfinance={yf} />
          </AnalysisCard>
        </div>
      </div>

      {/* 6. Social Mentions — full width */}
      <RedditMentions posts={data.reddit_posts} loading={false} />
    </div>
  );
}
