import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Target, Loader2, Zap, Building2, Cpu } from 'lucide-react';
import { api } from '../utils/api';
import { formatPrice, formatPercent, formatMarketCap, changeColor } from '../utils/formatters';
import SearchBar from '../components/analysis/SearchBar';
import AnalysisCard from '../components/analysis/AnalysisCard';
import PriceChart from '../components/analysis/PriceChart';
import PriceTargetBar from '../components/analysis/PriceTargetBar';
import RedditMentions from '../components/analysis/RedditMentions';

function ComputedBadge() {
  return (
    <span className="badge-computed">
      <Cpu className="w-3 h-3" />
      Computed from price data
    </span>
  );
}

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
    <div className="space-y-6">
      {data.computed_fallback && <ComputedBadge />}

      {data.one_liner && (
        <div className="p-5 bg-electric/[0.04] border border-electric/15 rounded-xl">
          <p className="text-sm text-electric/90 italic leading-relaxed">"{data.one_liner}"</p>
        </div>
      )}

      {data.momentum_rating && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted uppercase tracking-widest">Rating</span>
          <span className={`inline-block text-sm font-semibold px-3 py-1.5 rounded-lg ${ratingColor[data.momentum_rating] || 'bg-white/[0.04] text-text-secondary'}`}>
            {data.momentum_rating}
          </span>
        </div>
      )}

      {data.narrative && (
        <div>
          <p className="text-xs text-text-muted uppercase tracking-widest mb-2">Narrative</p>
          <p className="text-sm text-text-secondary leading-[1.8]">{data.narrative}</p>
        </div>
      )}

      {data.catalyst && (
        <div>
          <p className="text-xs text-text-muted uppercase tracking-widest mb-2">Catalyst</p>
          <p className="text-sm text-text-primary leading-[1.8]">{data.catalyst}</p>
        </div>
      )}

      {data.institutional_view && (
        <div>
          <p className="text-xs text-text-muted uppercase tracking-widest mb-2">Institutional View</p>
          <p className="text-sm text-text-secondary leading-[1.8]">{data.institutional_view}</p>
        </div>
      )}

      {data.key_levels && (data.key_levels.support > 0 || data.key_levels.resistance > 0) && (
        <div>
          <p className="text-xs text-text-muted uppercase tracking-widest mb-3">Key Levels</p>
          <div className="flex gap-6">
            {data.key_levels.support > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-electric" />
                <span className="text-text-muted text-sm">Support</span>
                <span className="text-electric font-semibold text-base font-[family-name:var(--font-mono)]">{formatPrice(data.key_levels.support)}</span>
              </div>
            )}
            {data.key_levels.resistance > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-danger" />
                <span className="text-text-muted text-sm">Resistance</span>
                <span className="text-danger font-semibold text-base font-[family-name:var(--font-mono)]">{formatPrice(data.key_levels.resistance)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FundamentalsContent({ data }) {
  if (!data || data.error) return <p className="text-text-muted text-sm">Analysis unavailable</p>;

  const healthColor = {
    'Strong': 'text-electric',
    'Adequate': 'text-amber',
    'Weak': 'text-danger',
  };

  return (
    <div className="space-y-6">
      {data.computed_fallback && <ComputedBadge />}

      {data.key_metrics && (
        <div className="flex gap-2 flex-wrap">
          {data.key_metrics.growth_quality && (
            <span className="text-sm px-3 py-2 bg-white/[0.04] rounded-lg text-text-secondary font-medium">
              Growth: {data.key_metrics.growth_quality}
            </span>
          )}
          {data.key_metrics.financial_health && (
            <span className={`text-sm px-3 py-2 bg-white/[0.04] rounded-lg font-medium ${healthColor[data.key_metrics.financial_health] || 'text-text-secondary'}`}>
              Health: {data.key_metrics.financial_health}
            </span>
          )}
        </div>
      )}

      {data.valuation_summary && (
        <div>
          <p className="text-xs text-text-muted uppercase tracking-widest mb-2">Valuation</p>
          <p className="text-sm text-text-secondary leading-[1.8]">{data.valuation_summary}</p>
        </div>
      )}

      {data.growth_assessment && (
        <div>
          <p className="text-xs text-text-muted uppercase tracking-widest mb-2">Growth</p>
          <p className="text-sm text-text-secondary leading-[1.8]">{data.growth_assessment}</p>
        </div>
      )}

      {data.fair_value_assessment && (
        <div className={`p-5 rounded-xl border ${
          data.fair_value_assessment === 'below_fair_value'
            ? 'bg-electric/[0.04] border-electric/15'
            : data.fair_value_assessment === 'above_fair_value'
            ? 'bg-danger/[0.04] border-danger/15'
            : 'bg-amber/[0.04] border-amber/15'
        }`}>
          <p className="text-xs text-text-muted mb-2 uppercase tracking-widest">Fair Value Assessment</p>
          <p className="text-base font-semibold capitalize">
            {data.fair_value_assessment.replace(/_/g, ' ')}
          </p>
          {data.fair_value_reasoning && (
            <p className="text-sm text-text-secondary mt-2 leading-[1.8]">{data.fair_value_reasoning}</p>
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
    <div className="space-y-6">
      {data.computed_fallback && <ComputedBadge />}
      <PriceTargetBar priceTargets={data} currentPrice={currentPrice} />
      <div className="space-y-2">
        {scenarios.map((s) => {
          const scenario = data[s.key];
          if (!scenario) return null;
          return (
            <div key={s.key} className="bg-white/[0.02] rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold ${s.color}`}>{s.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold font-[family-name:var(--font-mono)] ${s.color}`}>
                    {formatPrice(scenario.price)}
                  </span>
                  {s.timeframe && <span className="text-xs text-text-muted">{s.timeframe}</span>}
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

function MetricCard({ label, value }) {
  if (!value) return null;
  return (
    <div className="stat-card text-center">
      <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">{label}</p>
      <p className="text-base font-semibold text-text-primary font-[family-name:var(--font-mono)] leading-none">{value}</p>
    </div>
  );
}

export default function AnalysisPage() {
  const { ticker } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticker) { setData(null); return; }
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

  if (!ticker && !loading) {
    return (
      <div className="fade-in max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="pt-10">
          <SearchBar currentTicker={ticker} />
        </div>
        <div className="text-center py-28 sm:py-36">
          <div className="w-20 h-20 mx-auto mb-8 bg-white/[0.02] rounded-2xl flex items-center justify-center border border-border">
            <Target className="w-10 h-10 text-electric/30" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4 tracking-tight">Search for a Stock</h2>
          <p className="text-text-secondary text-lg max-w-lg mx-auto leading-relaxed font-light">
            Enter a ticker symbol above to get AI-powered momentum analysis,
            fundamental insights, and price target frameworks.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fade-in max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="pt-10">
          <SearchBar currentTicker={ticker} />
        </div>
        <div className="text-center py-28 sm:py-36">
          <Loader2 className="w-12 h-12 text-electric animate-spin mx-auto mb-6" />
          <p className="text-text-secondary text-xl font-light">
            Analyzing <span className="text-electric font-[family-name:var(--font-mono)] font-semibold">{ticker}</span>
          </p>
          <p className="text-text-muted text-sm mt-3">This may take 10-15 seconds</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="pt-10">
          <SearchBar currentTicker={ticker} />
        </div>
        <div className="bg-danger/[0.06] border border-danger/15 rounded-xl p-12 text-center max-w-lg mx-auto mt-16">
          <p className="text-danger font-semibold text-lg mb-3">Analysis Failed</p>
          <p className="text-text-secondary leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return (
    <div className="fade-in max-w-[1400px] mx-auto px-6 lg:px-10 pt-10">
      <SearchBar currentTicker={ticker} />
    </div>
  );

  return (
    <div className="fade-in">

      {/* Hero — ticker + price */}
      <section className="pt-10 pb-10 sm:pt-14 sm:pb-12">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <SearchBar currentTicker={ticker} />

          <div className="mt-8">
            <div className="flex items-baseline gap-4 flex-wrap">
              <h1 className="text-5xl sm:text-6xl font-bold gradient-text font-[family-name:var(--font-mono)] leading-none tracking-tighter">
                {data.ticker}
              </h1>
              {data.company_name && (
                <span className="text-lg text-text-muted">{data.company_name}</span>
              )}
            </div>

            <div className="flex items-baseline gap-4 mt-4">
              {yf?.current_price ? (
                <>
                  <span className="text-4xl sm:text-5xl font-semibold text-text-primary font-[family-name:var(--font-mono)] tracking-tight">
                    {formatPrice(yf.current_price)}
                  </span>
                  {priceChange != null && (
                    <span className={`text-xl sm:text-2xl font-semibold font-[family-name:var(--font-mono)] ${changeColor(priceChange)}`}>
                      {formatPercent(priceChange)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-lg text-text-muted">Price loading...</span>
              )}
              {data.from_cache && (
                <span className="text-[10px] bg-amber/10 text-amber px-2.5 py-1 rounded-lg font-medium uppercase tracking-wider">Cached</span>
              )}
            </div>

            {/* Stat row */}
            <div className="flex flex-wrap gap-3 mt-8">
              <MetricCard label="Market Cap" value={yf?.market_cap ? formatMarketCap(yf.market_cap) : null} />
              <MetricCard label="P/E (TTM)" value={yf?.pe_ratio ? yf.pe_ratio.toFixed(1) : null} />
              <MetricCard label="Fwd P/E" value={yf?.forward_pe ? yf.forward_pe.toFixed(1) : null} />
              <MetricCard
                label="52W Range"
                value={yf?.fifty_two_week_low && yf?.fifty_two_week_high
                  ? `${formatPrice(yf.fifty_two_week_low)} - ${formatPrice(yf.fifty_two_week_high)}`
                  : null
                }
              />
              <MetricCard label="Sector" value={yf?.sector || null} />
              <MetricCard label="Beta" value={yf?.beta ? yf.beta.toFixed(2) : null} />
            </div>
          </div>
        </div>
      </section>

      {/* Chart + Price Targets */}
      <section className="alt-section py-10 sm:py-14">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PriceChart history={yf?.history} loading={false} />
            <AnalysisCard title="Price Targets" icon={Target} accentColor="electric" loading={false}>
              <PriceTargetContent data={data.price_targets} currentPrice={yf?.current_price} />
            </AnalysisCard>
          </div>
        </div>
      </section>

      {/* Momentum */}
      <section className="py-10 sm:py-14">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="mb-6">
            <p className="section-label mb-2">Technical Analysis</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Momentum</h2>
          </div>
          <AnalysisCard title="Momentum Analysis" icon={Zap} accentColor="electric" loading={false}>
            <MomentumContent data={data.momentum} />
          </AnalysisCard>
        </div>
      </section>

      {/* Fundamentals */}
      <section className="alt-section py-10 sm:py-14">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="mb-6">
            <p className="section-label mb-2">Financial Health</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Fundamentals</h2>
          </div>
          <AnalysisCard title="Fundamental Snapshot" icon={Building2} accentColor="amber" loading={false}>
            <FundamentalsContent data={data.fundamentals} />
          </AnalysisCard>
        </div>
      </section>

      {/* Social */}
      <section className="py-10 sm:py-14">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="mb-6">
            <p className="section-label mb-2">What people are saying</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Social Mentions</h2>
          </div>
          <RedditMentions posts={data.reddit_posts} loading={false} />
        </div>
      </section>
    </div>
  );
}
