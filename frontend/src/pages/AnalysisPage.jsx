import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Target, Loader2, Zap, Building2, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../utils/api';
import { formatPrice, formatPercent, formatMarketCap, changeColor } from '../utils/formatters';
import { FadeIn, FadeInView } from '../components/motion';
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
    'Strong Bullish': 'bg-accent/12 text-accent',
    'Bullish': 'bg-accent/8 text-accent-dim',
    'Neutral': 'bg-warning/10 text-warning',
    'Bearish': 'bg-danger/8 text-danger',
    'Strong Bearish': 'bg-danger/12 text-danger',
  };

  return (
    <div className="space-y-5">
      {data.computed_fallback && <ComputedBadge />}
      {data.one_liner && (
        <div className="p-4 bg-accent-subtle border border-accent/12 rounded-lg">
          <p className="text-sm text-accent/90 italic leading-relaxed">"{data.one_liner}"</p>
        </div>
      )}
      {data.momentum_rating && (
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-text-muted uppercase tracking-widest">Rating</span>
          <span className={`text-sm font-semibold px-3 py-1 rounded-lg ${ratingColor[data.momentum_rating] || 'bg-white/[0.04] text-text-secondary'}`}>
            {data.momentum_rating}
          </span>
        </div>
      )}
      {data.narrative && (
        <div>
          <p className="text-[11px] text-text-muted uppercase tracking-widest mb-1.5">Narrative</p>
          <p className="text-sm text-text-secondary leading-[1.7]">{data.narrative}</p>
        </div>
      )}
      {data.catalyst && (
        <div>
          <p className="text-[11px] text-text-muted uppercase tracking-widest mb-1.5">Catalyst</p>
          <p className="text-sm text-text-primary leading-[1.7]">{data.catalyst}</p>
        </div>
      )}
      {data.institutional_view && (
        <div>
          <p className="text-[11px] text-text-muted uppercase tracking-widest mb-1.5">Institutional View</p>
          <p className="text-sm text-text-secondary leading-[1.7]">{data.institutional_view}</p>
        </div>
      )}
      {data.key_levels && (data.key_levels.support > 0 || data.key_levels.resistance > 0) && (
        <div>
          <p className="text-[11px] text-text-muted uppercase tracking-widest mb-2">Key Levels</p>
          <div className="flex gap-5">
            {data.key_levels.support > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-text-muted text-sm">Support</span>
                <span className="text-accent font-semibold font-[family-name:var(--font-mono)]">{formatPrice(data.key_levels.support)}</span>
              </div>
            )}
            {data.key_levels.resistance > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-danger" />
                <span className="text-text-muted text-sm">Resistance</span>
                <span className="text-danger font-semibold font-[family-name:var(--font-mono)]">{formatPrice(data.key_levels.resistance)}</span>
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
  const healthColor = { 'Strong': 'text-accent', 'Adequate': 'text-warning', 'Weak': 'text-danger' };
  return (
    <div className="space-y-5">
      {data.computed_fallback && <ComputedBadge />}
      {data.key_metrics && (
        <div className="flex gap-2 flex-wrap">
          {data.key_metrics.growth_quality && (
            <span className="text-sm px-3 py-1.5 bg-white/[0.04] rounded-lg text-text-secondary font-medium">Growth: {data.key_metrics.growth_quality}</span>
          )}
          {data.key_metrics.financial_health && (
            <span className={`text-sm px-3 py-1.5 bg-white/[0.04] rounded-lg font-medium ${healthColor[data.key_metrics.financial_health] || 'text-text-secondary'}`}>Health: {data.key_metrics.financial_health}</span>
          )}
        </div>
      )}
      {data.valuation_summary && (
        <div>
          <p className="text-[11px] text-text-muted uppercase tracking-widest mb-1.5">Valuation</p>
          <p className="text-sm text-text-secondary leading-[1.7]">{data.valuation_summary}</p>
        </div>
      )}
      {data.growth_assessment && (
        <div>
          <p className="text-[11px] text-text-muted uppercase tracking-widest mb-1.5">Growth</p>
          <p className="text-sm text-text-secondary leading-[1.7]">{data.growth_assessment}</p>
        </div>
      )}
      {data.fair_value_assessment && (
        <div className={`p-4 rounded-lg border ${
          data.fair_value_assessment === 'below_fair_value' ? 'bg-accent-subtle border-accent/12'
          : data.fair_value_assessment === 'above_fair_value' ? 'bg-danger-subtle border-danger/12'
          : 'bg-warning-subtle border-warning/12'
        }`}>
          <p className="text-[11px] text-text-muted mb-1.5 uppercase tracking-widest">Fair Value Assessment</p>
          <p className="text-sm font-semibold capitalize">{data.fair_value_assessment.replace(/_/g, ' ')}</p>
          {data.fair_value_reasoning && <p className="text-sm text-text-secondary mt-1.5 leading-[1.7]">{data.fair_value_reasoning}</p>}
        </div>
      )}
    </div>
  );
}

function PriceTargetContent({ data, currentPrice }) {
  if (!data || data.error) return <p className="text-text-muted text-sm">Analysis unavailable</p>;
  const scenarios = [
    { key: 'bear_case', label: 'Bear', color: 'text-danger', timeframe: data.bear_case?.timeframe },
    { key: 'base_case', label: 'Base', color: 'text-warning', timeframe: data.base_case?.timeframe },
    { key: 'bull_case', label: 'Bull', color: 'text-accent-dim', timeframe: data.bull_case?.timeframe },
    { key: 'stretched_bull', label: 'Stretched Bull', color: 'text-accent', timeframe: data.stretched_bull?.timeframe },
  ];
  return (
    <div className="space-y-5">
      {data.computed_fallback && <ComputedBadge />}
      <PriceTargetBar priceTargets={data} currentPrice={currentPrice} />
      <div className="space-y-2">
        {scenarios.map((s) => {
          const scenario = data[s.key];
          if (!scenario) return null;
          return (
            <div key={s.key} className="bg-white/[0.02] rounded-lg p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold ${s.color}`}>{s.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold font-[family-name:var(--font-mono)] ${s.color}`}>{formatPrice(scenario.price)}</span>
                  {s.timeframe && <span className="text-[11px] text-text-muted">{s.timeframe}</span>}
                </div>
              </div>
              {scenario.reasoning && <p className="text-[12px] text-text-muted leading-relaxed mt-1">{scenario.reasoning}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricPill({ label, value }) {
  if (!value) return null;
  return (
    <div className="stat-card text-center">
      <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-semibold text-text-primary font-[family-name:var(--font-mono)] leading-none">{value}</p>
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
    api.getStock(ticker).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [ticker]);

  const yf = data?.yfinance;
  const priceChange = yf?.current_price && yf?.previous_close
    ? ((yf.current_price - yf.previous_close) / yf.previous_close) * 100 : null;

  if (!ticker && !loading) {
    return (
      <div>
        <section className="py-16 sm:py-24">
          <div className="max-w-2xl mx-auto px-6">
            <SearchBar currentTicker={ticker} />
            <FadeIn>
              <div className="text-center mt-16">
                <div className="w-16 h-16 mx-auto mb-6 bg-bg-elevated rounded-2xl flex items-center justify-center border border-border">
                  <Target className="w-8 h-8 text-accent/30" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3 tracking-[-0.02em]">Search for a Stock</h2>
                <p className="text-text-secondary max-w-md mx-auto leading-relaxed">
                  Enter a ticker symbol to get AI-powered momentum analysis, fundamental insights, and price targets.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <section className="py-16 sm:py-24">
          <div className="max-w-2xl mx-auto px-6">
            <SearchBar currentTicker={ticker} />
            <div className="text-center mt-20">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 mx-auto mb-5">
                <Loader2 className="w-10 h-10 text-accent" />
              </motion.div>
              <p className="text-text-secondary text-lg">
                Analyzing <span className="text-accent font-[family-name:var(--font-mono)] font-semibold">{ticker}</span>
              </p>
              <p className="text-text-muted text-sm mt-2">This may take 10-15 seconds</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <section className="py-16">
          <div className="max-w-2xl mx-auto px-6">
            <SearchBar currentTicker={ticker} />
            <div className="bg-danger-subtle border border-danger/12 rounded-lg p-8 text-center max-w-md mx-auto mt-12">
              <p className="text-danger font-semibold mb-2">Analysis Failed</p>
              <p className="text-sm text-text-secondary leading-relaxed">{error}</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!data) return (
    <section className="py-16"><div className="max-w-2xl mx-auto px-6"><SearchBar currentTicker={ticker} /></div></section>
  );

  return (
    <div>
      {/* Hero — centered ticker + price */}
      <section className="pt-12 pb-16 sm:pt-16 sm:pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mx-auto mb-10">
            <SearchBar currentTicker={ticker} />
          </div>

          <div className="text-center">
            <FadeIn>
              <h1 className="text-5xl sm:text-7xl font-bold text-accent font-[family-name:var(--font-mono)] leading-none tracking-tighter">
                {data.ticker}
              </h1>
              {data.company_name && (
                <p className="text-base text-text-muted mt-2">{data.company_name}</p>
              )}
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="flex items-baseline justify-center gap-4 mt-5">
                {yf?.current_price ? (
                  <>
                    <span className="text-4xl sm:text-5xl font-semibold text-text-primary font-[family-name:var(--font-mono)] tracking-tight">
                      {formatPrice(yf.current_price)}
                    </span>
                    {priceChange != null && (
                      <span className={`text-xl font-semibold font-[family-name:var(--font-mono)] ${changeColor(priceChange)}`}>
                        {formatPercent(priceChange)}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-text-muted">Price loading...</span>
                )}
              </div>
            </FadeIn>

            {data.from_cache && (
              <span className="inline-block mt-3 text-[10px] bg-warning/10 text-warning px-2.5 py-1 rounded font-medium uppercase tracking-wider">Cached</span>
            )}

            <FadeIn delay={0.15}>
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                <MetricPill label="Market Cap" value={yf?.market_cap ? formatMarketCap(yf.market_cap) : null} />
                <MetricPill label="P/E (TTM)" value={yf?.pe_ratio ? yf.pe_ratio.toFixed(1) : null} />
                <MetricPill label="Fwd P/E" value={yf?.forward_pe ? yf.forward_pe.toFixed(1) : null} />
                <MetricPill label="52W Range" value={yf?.fifty_two_week_low && yf?.fifty_two_week_high ? `${formatPrice(yf.fifty_two_week_low)} – ${formatPrice(yf.fifty_two_week_high)}` : null} />
                <MetricPill label="Sector" value={yf?.sector || null} />
                <MetricPill label="Beta" value={yf?.beta ? yf.beta.toFixed(2) : null} />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Chart + Price Targets */}
      <section className="alt-section py-14 sm:py-18">
        <div className="max-w-5xl mx-auto px-6">
          <FadeInView>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriceChart history={yf?.history} loading={false} />
              <AnalysisCard title="Price Targets" icon={Target} accentColor="electric" loading={false}>
                <PriceTargetContent data={data.price_targets} currentPrice={yf?.current_price} />
              </AnalysisCard>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* Momentum */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <FadeInView>
            <div className="text-center mb-8">
              <p className="section-label mb-2">Technical Analysis</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-[-0.02em]">Momentum</h2>
            </div>
          </FadeInView>
          <FadeInView delay={0.1}>
            <AnalysisCard title="Momentum Analysis" icon={Zap} accentColor="electric" loading={false}>
              <MomentumContent data={data.momentum} />
            </AnalysisCard>
          </FadeInView>
        </div>
      </section>

      {/* Fundamentals */}
      <section className="alt-section py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <FadeInView>
            <div className="text-center mb-8">
              <p className="section-label mb-2">Financial Health</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-[-0.02em]">Fundamentals</h2>
            </div>
          </FadeInView>
          <FadeInView delay={0.1}>
            <AnalysisCard title="Fundamental Snapshot" icon={Building2} accentColor="amber" loading={false}>
              <FundamentalsContent data={data.fundamentals} />
            </AnalysisCard>
          </FadeInView>
        </div>
      </section>

      {/* Social */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <FadeInView>
            <div className="text-center mb-8">
              <p className="section-label mb-2">What people are saying</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-[-0.02em]">Social Mentions</h2>
            </div>
          </FadeInView>
          <FadeInView delay={0.1}>
            <RedditMentions posts={data.reddit_posts} loading={false} />
          </FadeInView>
        </div>
      </section>
    </div>
  );
}
