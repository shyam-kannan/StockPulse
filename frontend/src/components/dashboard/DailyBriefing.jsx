import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Sparkles, Target, MessageSquare } from 'lucide-react';

const actionColors = {
  BUY: 'bg-electric/20 text-electric border-electric/30',
  WATCH: 'bg-amber/20 text-amber border-amber/30',
  AVOID: 'bg-danger/20 text-danger border-danger/30',
};

const sentimentBadge = {
  bullish: 'bg-electric/15 text-electric',
  bearish: 'bg-danger/15 text-danger',
  mixed: 'bg-amber/15 text-amber',
};

function BriefingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-navy-800 border border-border rounded-xl p-6">
        <div className="h-6 bg-navy-700 rounded w-48 mb-4" />
        <div className="h-4 bg-navy-700 rounded w-full mb-2" />
        <div className="h-4 bg-navy-700 rounded w-3/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-navy-900/50 rounded-lg p-4">
              <div className="h-5 bg-navy-700 rounded w-32 mb-2" />
              <div className="h-3 bg-navy-700 rounded w-full mb-1" />
              <div className="h-3 bg-navy-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-navy-800 border border-border rounded-xl p-6">
        <div className="h-5 bg-navy-700 rounded w-36 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-navy-900/50 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DailyBriefing({ briefing, loading }) {
  const navigate = useNavigate();
  const [expandedTheme, setExpandedTheme] = useState(null);

  if (loading) return <BriefingSkeleton />;
  if (!briefing || briefing.error) {
    return (
      <div className="bg-navy-800 border border-border rounded-xl p-6 text-center">
        <Brain className="w-8 h-8 text-text-muted mx-auto mb-2" />
        <p className="text-text-muted text-sm">
          {briefing?.market_overview || 'AI briefing is loading. Make sure your ANTHROPIC_API_KEY is set in Railway.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* TLDR Banner */}
      {briefing.tldr && (
        <div className="bg-gradient-to-r from-electric/10 via-electric/5 to-transparent border border-electric/20 rounded-xl px-5 py-3 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-electric shrink-0" />
          <p className="text-sm font-medium text-electric font-[family-name:var(--font-mono)]">
            {briefing.tldr}
          </p>
        </div>
      )}

      {/* Market Overview + Themes */}
      <div className="bg-navy-800 border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-electric" />
            <h2 className="text-base font-semibold text-text-primary">AI Market Briefing</h2>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{briefing.market_overview}</p>
        </div>

        {/* Reddit Narrative */}
        {briefing.reddit_narrative && (
          <div className="px-5 py-4 border-b border-border/50 bg-navy-900/30">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-amber" />
              <span className="text-xs font-semibold text-amber uppercase tracking-wider">Reddit Buzz</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{briefing.reddit_narrative}</p>
          </div>
        )}

        {/* Themes */}
        {briefing.themes && briefing.themes.length > 0 && (
          <div className="p-5">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Key Themes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {briefing.themes.map((theme, i) => (
                <button
                  key={i}
                  onClick={() => setExpandedTheme(expandedTheme === i ? null : i)}
                  className="bg-navy-900/60 border border-border/50 rounded-lg p-4 text-left hover:border-electric/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-text-primary leading-tight flex-1">{theme.title}</h4>
                    {theme.sentiment && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ml-2 shrink-0 ${sentimentBadge[theme.sentiment] || sentimentBadge.mixed}`}>
                        {theme.sentiment}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs text-text-secondary leading-relaxed ${expandedTheme === i ? '' : 'line-clamp-2'}`}>
                    {theme.description}
                  </p>
                  {theme.tickers && theme.tickers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {theme.tickers.map(t => (
                        <span
                          key={t}
                          onClick={(e) => { e.stopPropagation(); navigate(`/analysis/${t}`); }}
                          className="text-[11px] font-mono font-medium text-electric bg-electric/10 px-2 py-0.5 rounded cursor-pointer hover:bg-electric/20 transition-colors"
                        >
                          ${t}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Picks */}
      {briefing.top_picks && briefing.top_picks.length > 0 && (
        <div className="bg-navy-800 border border-border rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <Target className="w-5 h-5 text-amber" />
            <h2 className="text-base font-semibold text-text-primary">Today's Top Picks</h2>
          </div>
          <div className="divide-y divide-border/30">
            {briefing.top_picks.map((pick, i) => (
              <button
                key={i}
                onClick={() => navigate(`/analysis/${pick.ticker}`)}
                className="w-full p-4 text-left hover:bg-navy-700/30 transition-colors flex items-start gap-4"
              >
                <div className="shrink-0 mt-0.5">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded border ${actionColors[pick.action] || actionColors.WATCH}`}>
                    {pick.action}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-electric font-[family-name:var(--font-mono)]">{pick.ticker}</span>
                    <span className="text-xs text-text-muted">{pick.company}</span>
                    {pick.conviction && (
                      <span className="text-[10px] text-text-muted bg-navy-700 px-1.5 py-0.5 rounded">
                        {pick.conviction} conviction
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{pick.reason}</p>
                  {pick.risk && (
                    <p className="text-xs text-danger/80 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      {pick.risk}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Risk Warnings */}
      {briefing.risk_warnings && briefing.risk_warnings.length > 0 && (
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-danger" />
            <span className="text-xs font-semibold text-danger uppercase tracking-wider">Risk Warnings</span>
          </div>
          <ul className="space-y-1">
            {briefing.risk_warnings.map((warning, i) => (
              <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                <span className="text-danger mt-0.5">-</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
