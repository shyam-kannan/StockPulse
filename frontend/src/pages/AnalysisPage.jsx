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

function MomentumContent({ data }) {
  if (!data || data.error) return <p className="text-text-muted text-sm">Analysis unavailable</p>;

  const ratingColor = {
    'Strong Bullish': 'bg-electric/20 text-electric',
    'Bullish': 'bg-electric/10 text-electric-dim',
    'Neutral': 'bg-amber/10 text-amber',
    'Bearish': 'bg-danger/10 text-danger-dim',
    'Strong Bearish': 'bg-danger/20 text-danger',
  };

  return (
    <div className="space-y-3">
      {data.momentum_rating && (
        <span className={`inline-block text-xs font-medium px-2 py-1 rounded ${ratingColor[data.momentum_rating] || 'bg-navy-700 text-text-secondary'}`}>
          {data.momentum_rating}
        </span>
      )}
      {data.narrative && (
        <p className="text-sm text-text-secondary leading-relaxed">{data.narrative}</p>
      )}
      {data.catalyst && (
        <div>
          <p className="text-xs text-text-muted uppercase mb-1">Catalyst</p>
          <p className="text-sm text-text-primary">{data.catalyst}</p>
        </div>
      )}
      {data.institutional_view && (
        <div>
          <p className="text-xs text-text-muted uppercase mb-1">Institutional View</p>
          <p className="text-sm text-text-secondary">{data.institutional_view}</p>
        </div>
      )}
      {data.key_levels && (
        <div className="flex gap-4 text-xs font-[family-name:var(--font-mono)]">
          {data.key_levels.support && (
            <span className="text-electric">Support: {formatPrice(data.key_levels.support)}</span>
          )}
          {data.key_levels.resistance && (
            <span className="text-danger">Resistance: {formatPrice(data.key_levels.resistance)}</span>
          )}
        </div>
      )}
      {data.one_liner && (
        <div className="mt-3 p-3 bg-electric/5 border border-electric/20 rounded-lg">
          <p className="text-sm text-electric italic">"{data.one_liner}"</p>
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
    <div className="space-y-3">
      {/* Key metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'P/E (TTM)', value: yfinance?.pe_ratio?.toFixed(1) },
          { label: 'Fwd P/E', value: yfinance?.forward_pe?.toFixed(1) },
          { label: 'EV/Rev', value: yfinance?.ev_to_revenue?.toFixed(1) },
          { label: 'Rev Growth', value: yfinance?.revenue_growth ? `${(yfinance.revenue_growth * 100).toFixed(1)}%` : null },
          { label: 'Profit Margin', value: yfinance?.profit_margin ? `${(yfinance.profit_margin * 100).toFixed(1)}%` : null },
          { label: 'Beta', value: yfinance?.beta?.toFixed(2) },
        ].map((m) => (
          <div key={m.label} className="bg-navy-700/50 rounded px-2 py-1.5">
            <p className="text-[10px] text-text-muted">{m.label}</p>
            <p className="text-sm font-[family-name:var(--font-mono)] text-text-primary">{m.value || '—'}</p>
          </div>
        ))}
      </div>

      {data.key_metrics && (
        <div className="flex gap-2 flex-wrap">
          {data.key_metrics.growth_quality && (
            <span className="text-xs px-2 py-0.5 bg-navy-700 rounded text-text-secondary">
              Growth: {data.key_metrics.growth_quality}
            </span>
          )}
          {data.key_metrics.financial_health && (
            <span className={`text-xs px-2 py-0.5 bg-navy-700 rounded ${healthColor[data.key_metrics.financial_health] || 'text-text-secondary'}`}>
              Health: {data.key_metrics.financial_health}
            </span>
          )}
        </div>
      )}

      {data.valuation_summary && (
        <p className="text-sm text-text-secondary leading-relaxed">{data.valuation_summary}</p>
      )}
      {data.growth_assessment && (
        <p className="text-sm text-text-secondary leading-relaxed">{data.growth_assessment}</p>
      )}

      {data.fair_value_assessment && (
        <div className={`mt-2 p-3 rounded-lg border ${
          data.fair_value_assessment === 'below_fair_value'
            ? 'bg-electric/5 border-electric/20'
            : data.fair_value_assessment === 'above_fair_value'
            ? 'bg-danger/5 border-danger/20'
            : 'bg-amber/5 border-amber/20'
        }`}>
          <p className="text-xs text-text-muted mb-1">Fair Value Assessment</p>
          <p className="text-sm font-medium capitalize">
            {data.fair_value_assessment.replace(/_/g, ' ')}
          </p>
          {data.fair_value_reasoning && (
            <p className="text-xs text-text-secondary mt-1">{data.fair_value_reasoning}</p>
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
    <div className="space-y-4">
      <PriceTargetBar priceTargets={data} currentPrice={currentPrice} />

      <div className="space-y-2">
        {scenarios.map((s) => {
          const scenario = data[s.key];
          if (!scenario) return null;
          return (
            <div key={s.key} className="bg-navy-700/30 rounded-lg p-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-xs font-medium ${s.color}`}>{s.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold font-[family-name:var(--font-mono)] ${s.color}`}>
                    {formatPrice(scenario.price)}
                  </span>
                  {s.timeframe && <span className="text-[10px] text-text-muted">{s.timeframe}</span>}
                </div>
              </div>
              {scenario.reasoning && (
                <p className="text-xs text-text-muted leading-relaxed">{scenario.reasoning}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

  return (
    <div className="space-y-6">
      <SearchBar currentTicker={ticker} />

      {!ticker && !loading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-navy-800 rounded-full flex items-center justify-center">
            <Target className="w-8 h-8 text-electric/50" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Search for a Stock</h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto">
            Enter a ticker symbol above to get AI-powered momentum analysis,
            fundamental insights, and price target frameworks.
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 text-electric animate-spin mx-auto mb-4" />
          <p className="text-text-secondary text-sm">
            Running AI analysis on <span className="text-electric font-[family-name:var(--font-mono)]">{ticker}</span>...
          </p>
          <p className="text-text-muted text-xs mt-1">This may take 10-15 seconds</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-6 text-center">
          <p className="text-danger font-medium">Analysis Failed</p>
          <p className="text-text-secondary text-sm mt-1">{error}</p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Header with ticker info */}
          <div className="flex items-baseline gap-4 flex-wrap">
            <h2 className="text-3xl font-bold text-electric font-[family-name:var(--font-mono)]">{data.ticker}</h2>
            <span className="text-lg text-text-secondary">{data.company_name}</span>
            {yf?.current_price && (
              <div className="flex items-baseline gap-2 ml-auto">
                <span className="text-2xl font-semibold text-text-primary font-[family-name:var(--font-mono)]">
                  {formatPrice(yf.current_price)}
                </span>
                {priceChange != null && (
                  <span className={`text-lg font-medium font-[family-name:var(--font-mono)] ${changeColor(priceChange)}`}>
                    {formatPercent(priceChange)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quick stats bar */}
          {yf && (
            <div className="flex gap-4 overflow-x-auto text-xs font-[family-name:var(--font-mono)] text-text-muted">
              {yf.market_cap && <span>MCap: {formatMarketCap(yf.market_cap)}</span>}
              {yf.sector && <span>Sector: {yf.sector}</span>}
              {yf.fifty_two_week_low && yf.fifty_two_week_high && (
                <span>52W: {formatPrice(yf.fifty_two_week_low)} - {formatPrice(yf.fifty_two_week_high)}</span>
              )}
              {data.from_cache && <span className="text-amber">Cached</span>}
            </div>
          )}

          {/* Three analysis cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AnalysisCard title="Momentum Analysis" icon={TrendingUp} accentColor="electric" loading={false}>
              <MomentumContent data={data.momentum} />
            </AnalysisCard>
            <AnalysisCard title="Fundamental Snapshot" icon={BarChart3} accentColor="amber" loading={false}>
              <FundamentalsContent data={data.fundamentals} yfinance={yf} />
            </AnalysisCard>
            <AnalysisCard title="Price Targets" icon={Target} accentColor="electric" loading={false}>
              <PriceTargetContent data={data.price_targets} currentPrice={yf?.current_price} />
            </AnalysisCard>
          </div>

          {/* Chart and Reddit mentions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PriceChart history={yf?.history} loading={false} />
            <RedditMentions posts={data.reddit_posts} loading={false} />
          </div>
        </>
      )}
    </div>
  );
}
