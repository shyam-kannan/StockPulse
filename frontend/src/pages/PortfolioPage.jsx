import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, Shield, AlertTriangle, Target, Clock, RefreshCw, Loader2, ChevronRight, XCircle } from 'lucide-react';
import { api } from '../utils/api';
import { formatPrice, formatPercent, changeColor } from '../utils/formatters';

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="stat-card text-center">
      <div className="flex items-center justify-center gap-2.5 mb-4">
        {Icon && <Icon className="w-4 h-4 text-text-muted" />}
        <span className="text-xs text-text-muted uppercase tracking-widest font-medium">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-text-primary tracking-tight">{value || '—'}</p>
      {sub && <p className="text-sm text-text-muted mt-2">{sub}</p>}
    </div>
  );
}

function ConvictionBadge({ level }) {
  const styles = {
    high: 'bg-electric/12 text-electric border-electric/20',
    medium: 'bg-amber/12 text-amber border-amber/20',
    low: 'bg-white/[0.06] text-text-secondary border-white/[0.08]',
  };
  return (
    <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${styles[level] || styles.low}`}>
      {level}
    </span>
  );
}

function ActionBadge({ action }) {
  const styles = {
    BUY: 'bg-electric/12 text-electric',
    HOLD: 'bg-amber/12 text-amber',
    WATCH: 'bg-white/[0.06] text-text-secondary',
  };
  return (
    <span className={`text-sm font-bold px-4 py-1.5 rounded-xl ${styles[action] || styles.WATCH}`}>
      {action}
    </span>
  );
}

function PositionCard({ position, onNavigate }) {
  const upside = position.current_price || position.entry_price
    ? (((position.target_price - (position.current_price || position.entry_price)) / (position.current_price || position.entry_price)) * 100)
    : null;

  return (
    <div
      className="glass-card p-8 sm:p-10 cursor-pointer group"
      onClick={() => onNavigate(`/analysis/${position.ticker}`)}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-xl bg-electric/8 flex items-center justify-center font-bold text-electric text-base font-[family-name:var(--font-mono)] group-hover:bg-electric/15 transition-colors"
               style={{ width: '3.25rem', height: '3.25rem' }}>
            {position.ticker?.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-mono)]">
                {position.ticker}
              </h3>
              <ActionBadge action={position.action} />
            </div>
            <p className="text-sm text-text-muted mt-1 max-w-[250px] truncate">{position.company}</p>
          </div>
        </div>

        <div className="text-right flex items-center gap-4">
          <div>
            <ConvictionBadge level={position.conviction} />
            <p className="text-xl font-semibold text-text-primary font-[family-name:var(--font-mono)] mt-3">
              {position.allocation_pct}%
            </p>
            <p className="text-xs text-text-muted uppercase tracking-wider">allocation</p>
          </div>
          <ChevronRight className="w-5 h-5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/[0.03] rounded-xl px-4 py-3">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Entry</p>
          <p className="text-base font-medium text-electric font-[family-name:var(--font-mono)]">
            {formatPrice(position.entry_price)}
          </p>
        </div>
        <div className="bg-white/[0.03] rounded-xl px-4 py-3">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Target</p>
          <p className="text-base font-medium text-text-primary font-[family-name:var(--font-mono)]">
            {formatPrice(position.target_price)}
          </p>
        </div>
        <div className="bg-white/[0.03] rounded-xl px-4 py-3">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Stop Loss</p>
          <p className="text-base font-medium text-danger font-[family-name:var(--font-mono)]">
            {formatPrice(position.stop_loss)}
          </p>
        </div>
      </div>

      <p className="text-[15px] text-text-secondary leading-[1.8] mb-3">{position.reasoning}</p>
      {position.risk && (
        <p className="text-sm text-danger/80 leading-relaxed flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {position.risk}
        </p>
      )}

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.04]">
        <span className="text-xs text-text-muted uppercase tracking-wider">{position.sector}</span>
        {upside != null && (
          <span className={`text-sm font-semibold font-[family-name:var(--font-mono)] ${upside >= 0 ? 'text-electric' : 'text-danger'}`}>
            {upside >= 0 ? '+' : ''}{upside.toFixed(1)}% upside
          </span>
        )}
      </div>
    </div>
  );
}

function SectorBar({ sector, pct, maxPct }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-text-secondary w-32 shrink-0 truncate">{sector}</span>
      <div className="flex-1 h-2.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className="h-full bg-electric rounded-full transition-all duration-500"
          style={{ width: `${(pct / maxPct) * 100}%` }}
        />
      </div>
      <span className="text-sm font-medium text-text-primary font-[family-name:var(--font-mono)] w-12 text-right">
        {pct}%
      </span>
    </div>
  );
}

function AvoidCard({ stock }) {
  return (
    <div className="flex items-start gap-4 p-6 bg-danger/[0.04] border border-danger/10 rounded-2xl">
      <XCircle className="w-5 h-5 text-danger mt-0.5 shrink-0" />
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-base font-semibold text-text-primary font-[family-name:var(--font-mono)]">{stock.ticker}</span>
          <span className="text-sm text-text-muted">{stock.company}</span>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{stock.reason}</p>
      </div>
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="fade-in">
      <div className="text-center pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="h-12 shimmer rounded-lg w-72 mx-auto mb-6" />
        <div className="h-6 shimmer rounded-lg w-96 mx-auto" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16 max-w-4xl mx-auto">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card">
            <div className="h-4 shimmer rounded w-20 mb-4 mx-auto" />
            <div className="h-8 shimmer rounded w-28 mx-auto" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-10">
            <div className="h-6 shimmer rounded w-36 mb-6" />
            <div className="h-5 shimmer rounded w-full mb-3" />
            <div className="h-5 shimmer rounded w-3/4" />
          </div>
        ))}
      </div>
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
      <div className="fade-in">
        <div className="text-center pt-16 pb-20 sm:pt-24 sm:pb-28">
          <h1 className="text-5xl sm:text-7xl font-bold text-text-primary tracking-tight">Portfolio Builder</h1>
        </div>
        <div className="bg-danger/[0.06] border border-danger/15 rounded-2xl p-14 text-center max-w-lg mx-auto">
          <p className="text-danger font-semibold text-xl mb-3">Failed to Generate</p>
          <p className="text-text-secondary leading-relaxed">{error}</p>
          <button onClick={() => fetchData()} className="mt-6 px-7 py-3 text-sm bg-white/[0.06] rounded-full hover:bg-white/[0.1] transition-colors text-text-primary cursor-pointer">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const positions = data.positions || [];
  const sectors = data.sector_breakdown || [];
  const maxSectorPct = Math.max(...sectors.map(s => s.pct), 1);
  const avoidList = data.avoid_list || [];
  const warnings = data.warnings || [];

  return (
    <div className="fade-in">

      {/* ===== HERO ===== */}
      <section className="text-center pt-16 pb-20 sm:pt-24 sm:pb-28">
        <h1 className="text-5xl sm:text-7xl font-bold text-text-primary tracking-tight leading-[1.1]">
          Portfolio Builder
        </h1>
        <p className="text-xl sm:text-2xl text-text-muted mt-6 max-w-xl mx-auto leading-relaxed font-light">
          AI-powered stock recommendations based on current market conditions.
        </p>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="mt-8 inline-flex items-center gap-2.5 px-7 py-3 text-sm font-medium text-text-muted bg-white/[0.04] border border-white/[0.08] rounded-full hover:border-white/[0.15] hover:text-text-secondary hover:bg-white/[0.06] transition-all duration-300 disabled:opacity-40 cursor-pointer"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {refreshing ? 'Generating...' : 'Regenerate'}
        </button>
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20 max-w-4xl mx-auto">
        <StatCard
          label="Strategy"
          value={data.risk_level ? data.risk_level.charAt(0).toUpperCase() + data.risk_level.slice(1) : 'Balanced'}
          sub="Risk profile"
          icon={Shield}
        />
        <StatCard
          label="Positions"
          value={positions.length}
          sub="Recommended stocks"
          icon={Briefcase}
        />
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

      {/* Strategy overview */}
      {data.strategy && (
        <section className="full-bleed-section alt-section py-20 sm:py-28">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-electric/10 flex items-center justify-center mx-auto mb-6">
                <Target className="w-7 h-7 text-electric" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-6">Strategy Overview</h2>
              <p className="text-lg text-text-secondary leading-[1.8]">{data.strategy}</p>
              {data.market_outlook && (
                <p className="text-base text-text-muted leading-[1.8] mt-6 pt-6 border-t border-white/[0.04]">
                  {data.market_outlook}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Positions + Sidebar */}
      <section className="py-20 sm:py-28">
        <div className="text-center mb-16">
          <p className="section-label mb-4">AI Recommendations</p>
          <h2 className="text-3xl sm:text-5xl font-bold text-text-primary tracking-tight">
            Recommended Positions
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 gap-6">
              {positions.map((pos) => (
                <PositionCard key={pos.ticker} position={pos} onNavigate={navigate} />
              ))}
            </div>
          </div>

          <div className="space-y-10">
            {sectors.length > 0 && (
              <div className="glass-card p-8">
                <h3 className="text-base font-semibold text-text-primary mb-6">Sector Allocation</h3>
                <div className="space-y-4">
                  {sectors.map((s) => (
                    <SectorBar key={s.sector} sector={s.sector} pct={s.pct} maxPct={maxSectorPct} />
                  ))}
                </div>
              </div>
            )}

            {data.timing_notes && (
              <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-amber" />
                  <h3 className="text-base font-semibold text-text-primary">Timing</h3>
                </div>
                <p className="text-sm text-text-secondary leading-[1.8]">{data.timing_notes}</p>
              </div>
            )}

            {avoidList.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-text-primary mb-5 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                  Stocks to Avoid
                </h3>
                <div className="space-y-4">
                  {avoidList.map((s) => (
                    <AvoidCard key={s.ticker} stock={s} />
                  ))}
                </div>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="glass-card p-8 border-amber/15">
                <h3 className="text-base font-semibold text-amber mb-5 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5" />
                  Risk Warnings
                </h3>
                <ul className="space-y-3">
                  {warnings.map((w, i) => (
                    <li key={i} className="text-sm text-text-secondary leading-relaxed flex items-start gap-3">
                      <span className="text-amber mt-0.5">-</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
