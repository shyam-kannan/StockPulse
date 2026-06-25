import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, TrendingUp, Shield, AlertTriangle, Target, Clock, RefreshCw, Loader2, ChevronRight, XCircle } from 'lucide-react';
import { api } from '../utils/api';
import { formatPrice, formatPercent, changeColor } from '../utils/formatters';
import { FadeIn, FadeInView, Stagger, staggerChild } from '../components/motion';

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="stat-card text-center">
      <div className="flex items-center justify-center gap-1.5 mb-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-text-muted" />}
        <span className="text-[11px] text-text-muted uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-lg font-semibold text-text-primary tracking-tight">{value || '—'}</p>
      {sub && <p className="text-[11px] text-text-muted mt-1">{sub}</p>}
    </div>
  );
}

function ConvictionBadge({ level }) {
  const styles = {
    high: 'bg-accent/12 text-accent border-accent/20',
    medium: 'bg-warning/12 text-warning border-warning/20',
    low: 'bg-white/[0.06] text-text-secondary border-white/[0.08]',
  };
  return (
    <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${styles[level] || styles.low}`}>
      {level}
    </span>
  );
}

function ActionBadge({ action }) {
  const styles = {
    BUY: 'bg-accent/12 text-accent',
    HOLD: 'bg-warning/12 text-warning',
    WATCH: 'bg-white/[0.06] text-text-secondary',
  };
  return (
    <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded ${styles[action] || styles.WATCH}`}>
      {action}
    </span>
  );
}

function PositionCard({ position, onNavigate }) {
  const upside = position.current_price || position.entry_price
    ? (((position.target_price - (position.current_price || position.entry_price)) / (position.current_price || position.entry_price)) * 100)
    : null;

  return (
    <motion.div
      variants={staggerChild}
      className="card p-5 cursor-pointer group"
      onClick={() => onNavigate(`/analysis/${position.ticker}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/8 flex items-center justify-center font-bold text-accent text-[13px] font-[family-name:var(--font-mono)] group-hover:bg-accent/12 transition-colors">
            {position.ticker?.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text-primary font-[family-name:var(--font-mono)]">
                {position.ticker}
              </h3>
              <ActionBadge action={position.action} />
            </div>
            <p className="text-[12px] text-text-muted mt-0.5 max-w-[200px] truncate">{position.company}</p>
          </div>
        </div>

        <div className="text-right flex items-center gap-2">
          <div>
            <ConvictionBadge level={position.conviction} />
            <p className="text-base font-semibold text-text-primary font-[family-name:var(--font-mono)] mt-1.5">
              {position.allocation_pct}%
            </p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">allocation</p>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white/[0.03] rounded-lg px-3 py-2">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Entry</p>
          <p className="text-[13px] font-medium text-accent font-[family-name:var(--font-mono)]">
            {formatPrice(position.entry_price)}
          </p>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-3 py-2">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Target</p>
          <p className="text-[13px] font-medium text-text-primary font-[family-name:var(--font-mono)]">
            {formatPrice(position.target_price)}
          </p>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-3 py-2">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Stop Loss</p>
          <p className="text-[13px] font-medium text-danger font-[family-name:var(--font-mono)]">
            {formatPrice(position.stop_loss)}
          </p>
        </div>
      </div>

      <p className="text-[13px] text-text-secondary leading-[1.6] mb-2">{position.reasoning}</p>
      {position.risk && (
        <p className="text-[12px] text-danger/80 leading-relaxed flex items-start gap-1.5">
          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
          {position.risk}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <span className="text-[11px] text-text-muted uppercase tracking-wider">{position.sector}</span>
        {upside != null && (
          <span className={`text-[13px] font-semibold font-[family-name:var(--font-mono)] ${upside >= 0 ? 'text-accent' : 'text-danger'}`}>
            {upside >= 0 ? '+' : ''}{upside.toFixed(1)}% upside
          </span>
        )}
      </div>
    </motion.div>
  );
}

function SectorBar({ sector, pct, maxPct }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] text-text-secondary w-28 shrink-0 truncate">{sector}</span>
      <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-accent rounded-full"
          initial={{ width: 0 }}
          whileInView={{ width: `${(pct / maxPct) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
      <span className="text-[13px] font-medium text-text-primary font-[family-name:var(--font-mono)] w-10 text-right">
        {pct}%
      </span>
    </div>
  );
}

function AvoidCard({ stock }) {
  return (
    <div className="flex items-start gap-2.5 p-3 bg-danger-subtle border border-danger/10 rounded-lg">
      <XCircle className="w-3.5 h-3.5 text-danger mt-0.5 shrink-0" />
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-semibold text-text-primary font-[family-name:var(--font-mono)]">{stock.ticker}</span>
          <span className="text-[12px] text-text-muted">{stock.company}</span>
        </div>
        <p className="text-[12px] text-text-secondary leading-relaxed">{stock.reason}</p>
      </div>
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div>
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="h-12 shimmer rounded w-72 mx-auto mb-4" />
          <div className="h-5 shimmer rounded w-96 mx-auto" />
        </div>
      </section>
      <section className="alt-section py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="stat-card">
                <div className="h-3 shimmer rounded w-16 mb-2 mx-auto" />
                <div className="h-6 shimmer rounded w-20 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-5">
                <div className="h-4 shimmer rounded w-28 mb-3" />
                <div className="h-4 shimmer rounded w-full mb-2" />
                <div className="h-4 shimmer rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function PortfolioPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const result = await api.getPortfolioRecommendation();
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <PortfolioSkeleton />;

  if (error) {
    return (
      <div>
        <section className="py-16 sm:py-24">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary tracking-[-0.03em]">Portfolio Builder</h1>
          </div>
        </section>
        <section className="py-12">
          <div className="max-w-md mx-auto px-6">
            <div className="bg-danger-subtle border border-danger/12 rounded-lg p-8 text-center">
              <p className="text-danger font-semibold mb-2">Failed to Generate</p>
              <p className="text-sm text-text-secondary leading-relaxed">{error}</p>
              <button onClick={() => fetchData()} className="mt-4 px-5 py-2 text-[13px] bg-white/[0.06] rounded-lg hover:bg-white/[0.1] transition-colors text-text-primary cursor-pointer">
                Try Again
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!data) return null;

  const allPositions = data.positions || [];
  const stocks = allPositions.filter(p => p.type !== 'etf');
  const etfs = allPositions.filter(p => p.type === 'etf');
  const sectors = data.sector_breakdown || [];
  const maxSectorPct = Math.max(...sectors.map(s => s.pct), 1);
  const avoidList = data.avoid_list || [];
  const warnings = data.warnings || [];

  return (
    <div>
      {/* Hero */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <FadeIn>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary tracking-[-0.03em] leading-[1.1]">
              Portfolio Builder
            </h1>
            <p className="text-base sm:text-lg text-text-secondary mt-4 max-w-lg mx-auto">
              AI-powered recommendations based on current market conditions.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="mt-8 inline-flex items-center gap-2.5 px-6 py-3 text-sm font-medium text-text-primary bg-accent/10 border border-accent/20 rounded-full hover:bg-accent/15 transition-all disabled:opacity-40 cursor-pointer"
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {refreshing ? 'Generating...' : 'Regenerate'}
            </button>
          </FadeIn>
        </div>
      </section>

      {/* Stats */}
      <section className="alt-section py-14 sm:py-16">
        <div className="max-w-5xl mx-auto px-6">
          <FadeInView>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Strategy"
                value={data.risk_level ? data.risk_level.charAt(0).toUpperCase() + data.risk_level.slice(1) : 'Balanced'}
                sub="Risk profile"
                icon={Shield}
              />
              <StatCard label="Positions" value={allPositions.length} sub={`${stocks.length} stocks, ${etfs.length} ETFs`} icon={Briefcase} />
              <StatCard
                label="Top Sector"
                value={sectors[0]?.sector || '—'}
                sub={sectors[0] ? `${sectors[0].pct}% allocation` : ''}
                icon={TrendingUp}
              />
              <StatCard
                label="Updated"
                value={data.generated_at ? new Date(data.generated_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                sub={data.generated_at ? new Date(data.generated_at * 1000).toLocaleDateString() : ''}
                icon={Clock}
              />
            </div>
          </FadeInView>
        </div>
      </section>

      {/* Strategy */}
      {data.strategy && (
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-6">
            <FadeInView>
              <div className="text-center mb-8">
                <p className="section-label mb-2">AI Strategy</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-[-0.02em]">Overview</h2>
              </div>
            </FadeInView>
            <FadeInView delay={0.1}>
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-semibold text-text-primary">Strategy</h3>
                </div>
                <p className="text-sm text-text-secondary leading-[1.7]">{data.strategy}</p>
                {data.market_outlook && (
                  <p className="text-[13px] text-text-muted leading-[1.7] mt-3 pt-3 border-t border-border">
                    {data.market_outlook}
                  </p>
                )}
              </div>
            </FadeInView>
          </div>
        </section>
      )}

      {/* Stocks */}
      {stocks.length > 0 && (
        <section className="alt-section py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-6">
            <FadeInView>
              <div className="text-center mb-10">
                <p className="section-label mb-2">Individual picks</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-[-0.02em]">Stocks</h2>
              </div>
            </FadeInView>
            <FadeInView delay={0.1}>
              <Stagger className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {stocks.map((pos) => (
                  <PositionCard key={pos.ticker} position={pos} onNavigate={navigate} />
                ))}
              </Stagger>
            </FadeInView>
          </div>
        </section>
      )}

      {/* ETFs */}
      {etfs.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-6">
            <FadeInView>
              <div className="text-center mb-10">
                <p className="section-label mb-2">Diversified exposure</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-[-0.02em]">ETFs</h2>
              </div>
            </FadeInView>
            <FadeInView delay={0.1}>
              <Stagger className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {etfs.map((pos) => (
                  <PositionCard key={pos.ticker} position={pos} onNavigate={navigate} />
                ))}
              </Stagger>
            </FadeInView>
          </div>
        </section>
      )}

      {/* Sidebar info */}
      <section className="alt-section py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <FadeInView>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {sectors.length > 0 && (
                <div className="card p-4">
                  <h3 className="text-[13px] font-semibold text-text-primary mb-3">Sector Allocation</h3>
                  <div className="space-y-2.5">
                    {sectors.map((s) => (
                      <SectorBar key={s.sector} sector={s.sector} pct={s.pct} maxPct={maxSectorPct} />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {data.timing_notes && (
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-3.5 h-3.5 text-warning" />
                      <h3 className="text-[13px] font-semibold text-text-primary">Timing</h3>
                    </div>
                    <p className="text-[13px] text-text-secondary leading-[1.6]">{data.timing_notes}</p>
                  </div>
                )}

                {avoidList.length > 0 && (
                  <div>
                    <h3 className="text-[13px] font-semibold text-text-primary mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-danger" />
                      Stocks to Avoid
                    </h3>
                    <div className="space-y-2">
                      {avoidList.map((s) => (
                        <AvoidCard key={s.ticker} stock={s} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {warnings.length > 0 && (
                <div className="card p-4 border-warning/12">
                  <h3 className="text-[13px] font-semibold text-warning mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Risk Warnings
                  </h3>
                  <ul className="space-y-1.5">
                    {warnings.map((w, i) => (
                      <li key={i} className="text-[13px] text-text-secondary leading-relaxed flex items-start gap-1.5">
                        <span className="text-warning mt-0.5">-</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </FadeInView>
        </div>
      </section>
    </div>
  );
}
