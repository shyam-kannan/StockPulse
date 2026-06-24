import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, Shield, AlertTriangle, Target, Clock, RefreshCw, Loader2, ChevronRight, XCircle } from 'lucide-react';
import { api } from '../utils/api';
import { formatPrice, formatPercent, changeColor } from '../utils/formatters';

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-3.5 h-3.5 text-text-muted" />}
        <span className="text-[11px] text-text-muted uppercase tracking-widest font-medium">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-text-primary tracking-tight">{value || '—'}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
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
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border ${styles[level] || styles.low}`}>
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
    <span className={`text-xs font-bold px-3 py-1 rounded-lg ${styles[action] || styles.WATCH}`}>
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
      className="card p-6 cursor-pointer group"
      onClick={() => onNavigate(`/analysis/${position.ticker}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-electric/8 flex items-center justify-center font-bold text-electric text-sm font-[family-name:var(--font-mono)] group-hover:bg-electric/15 transition-colors">
            {position.ticker?.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-text-primary font-[family-name:var(--font-mono)]">
                {position.ticker}
              </h3>
              <ActionBadge action={position.action} />
            </div>
            <p className="text-xs text-text-muted mt-0.5 max-w-[200px] truncate">{position.company}</p>
          </div>
        </div>

        <div className="text-right flex items-center gap-3">
          <div>
            <ConvictionBadge level={position.conviction} />
            <p className="text-lg font-semibold text-text-primary font-[family-name:var(--font-mono)] mt-2">
              {position.allocation_pct}%
            </p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">allocation</p>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Price levels */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/[0.03] rounded-lg px-3 py-2">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Entry</p>
          <p className="text-sm font-medium text-electric font-[family-name:var(--font-mono)]">
            {formatPrice(position.entry_price)}
          </p>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-3 py-2">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Target</p>
          <p className="text-sm font-medium text-text-primary font-[family-name:var(--font-mono)]">
            {formatPrice(position.target_price)}
          </p>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-3 py-2">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Stop Loss</p>
          <p className="text-sm font-medium text-danger font-[family-name:var(--font-mono)]">
            {formatPrice(position.stop_loss)}
          </p>
        </div>
      </div>

      {/* Reasoning */}
      <p className="text-sm text-text-secondary leading-relaxed mb-2">{position.reasoning}</p>
      {position.risk && (
        <p className="text-xs text-danger/80 leading-relaxed flex items-start gap-1.5">
          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
          {position.risk}
        </p>
      )}

      {/* Footer: sector + upside */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
        <span className="text-[10px] text-text-muted uppercase tracking-wider">{position.sector}</span>
        {upside != null && (
          <span className={`text-xs font-semibold font-[family-name:var(--font-mono)] ${upside >= 0 ? 'text-electric' : 'text-danger'}`}>
            {upside >= 0 ? '+' : ''}{upside.toFixed(1)}% upside
          </span>
        )}
      </div>
    </div>
  );
}

function SectorBar({ sector, pct, maxPct }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-secondary w-28 shrink-0 truncate">{sector}</span>
      <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className="h-full bg-electric rounded-full transition-all duration-500"
          style={{ width: `${(pct / maxPct) * 100}%` }}
        />
      </div>
      <span className="text-xs font-medium text-text-primary font-[family-name:var(--font-mono)] w-10 text-right">
        {pct}%
      </span>
    </div>
  );
}

function AvoidCard({ stock }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-danger/[0.04] border border-danger/10 rounded-xl">
      <XCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-text-primary font-[family-name:var(--font-mono)]">{stock.ticker}</span>
          <span className="text-xs text-text-muted">{stock.company}</span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">{stock.reason}</p>
      </div>
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-10 fade-in">
      <div>
        <div className="h-7 shimmer rounded-lg w-48 mb-2" />
        <div className="h-4 shimmer rounded-lg w-80" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card">
            <div className="h-3 shimmer rounded w-16 mb-3" />
            <div className="h-7 shimmer rounded w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6">
            <div className="h-5 shimmer rounded w-32 mb-4" />
            <div className="h-4 shimmer rounded w-full mb-2" />
            <div className="h-4 shimmer rounded w-3/4" />
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
      <div className="space-y-8 fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Portfolio Builder</h1>
        </div>
        <div className="bg-danger/[0.06] border border-danger/15 rounded-2xl p-10 text-center max-w-lg mx-auto">
          <p className="text-danger font-semibold text-lg mb-2">Failed to Generate</p>
          <p className="text-text-secondary text-sm leading-relaxed">{error}</p>
          <button onClick={() => fetchData()} className="mt-4 px-4 py-2 text-sm bg-white/[0.06] rounded-lg hover:bg-white/[0.1] transition-colors text-text-primary cursor-pointer">
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
    <div className="space-y-10 fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Portfolio Builder</h1>
          <p className="text-sm text-text-muted mt-1">
            AI-powered stock recommendations based on current market conditions
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-text-muted bg-white/[0.03] border border-white/[0.06] rounded-lg hover:border-white/[0.12] hover:text-text-secondary transition-all duration-200 disabled:opacity-40 cursor-pointer"
        >
          {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {refreshing ? 'Generating...' : 'Regenerate'}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="card p-7">
          <div className="flex items-center gap-2.5 mb-3">
            <Target className="w-4 h-4 text-electric" />
            <h2 className="text-sm font-semibold text-text-primary">Strategy Overview</h2>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{data.strategy}</p>
          {data.market_outlook && (
            <p className="text-sm text-text-muted leading-relaxed mt-3 pt-3 border-t border-white/[0.04]">
              {data.market_outlook}
            </p>
          )}
        </div>
      )}

      {/* Main grid: Positions + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Positions */}
        <div className="lg:col-span-2 space-y-5">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Recommended Positions ({positions.length})
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {positions.map((pos) => (
              <PositionCard key={pos.ticker} position={pos} onNavigate={navigate} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Sector breakdown */}
          {sectors.length > 0 && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-5">Sector Allocation</h3>
              <div className="space-y-3">
                {sectors.map((s) => (
                  <SectorBar key={s.sector} sector={s.sector} pct={s.pct} maxPct={maxSectorPct} />
                ))}
              </div>
            </div>
          )}

          {/* Timing */}
          {data.timing_notes && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber" />
                <h3 className="text-sm font-semibold text-text-primary">Timing</h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{data.timing_notes}</p>
            </div>
          )}

          {/* Avoid list */}
          {avoidList.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-danger" />
                Stocks to Avoid
              </h3>
              <div className="space-y-3">
                {avoidList.map((s) => (
                  <AvoidCard key={s.ticker} stock={s} />
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="card p-6 border-amber/15">
              <h3 className="text-sm font-semibold text-amber mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Risk Warnings
              </h3>
              <ul className="space-y-2">
                {warnings.map((w, i) => (
                  <li key={i} className="text-xs text-text-secondary leading-relaxed flex items-start gap-2">
                    <span className="text-amber mt-0.5">-</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
