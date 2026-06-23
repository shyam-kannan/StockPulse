import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, AlertTriangle, Sparkles, Target, MessageSquare } from 'lucide-react';

const actionColors = {
  BUY: 'bg-electric/15 text-electric border-electric/20',
  WATCH: 'bg-amber/15 text-amber border-amber/20',
  AVOID: 'bg-danger/15 text-danger border-danger/20',
};

const sentimentBadge = {
  bullish: 'bg-electric/10 text-electric',
  bearish: 'bg-danger/10 text-danger',
  mixed: 'bg-amber/10 text-amber',
};

function BriefingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="h-6 shimmer rounded-lg w-48 mb-4" />
        <div className="h-4 shimmer rounded-lg w-full mb-2" />
        <div className="h-4 shimmer rounded-lg w-3/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/[0.02] rounded-xl p-5">
              <div className="h-5 shimmer rounded-lg w-32 mb-3" />
              <div className="h-3 shimmer rounded-lg w-full mb-2" />
              <div className="h-3 shimmer rounded-lg w-2/3" />
            </div>
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
      <div className="card p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
          <Brain className="w-6 h-6 text-text-muted" />
        </div>
        <p className="text-text-muted text-sm max-w-md mx-auto">
          {briefing?.market_overview || 'AI briefing is loading. Ensure your ANTHROPIC_API_KEY is configured.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 fade-in">
      {briefing.tldr && (
        <div className="relative overflow-hidden rounded-2xl border border-electric/15 bg-gradient-to-r from-electric/[0.08] via-electric/[0.03] to-transparent px-6 py-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-electric shrink-0" />
            <p className="text-sm font-medium text-electric/90 leading-relaxed">
              {briefing.tldr}
            </p>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-electric/10 flex items-center justify-center">
              <Brain className="w-4 h-4 text-electric" />
            </div>
            <h2 className="text-base font-semibold text-text-primary">AI Market Briefing</h2>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{briefing.market_overview}</p>
        </div>

        {briefing.reddit_narrative && (
          <div className="px-6 py-4 border-b border-border bg-white/[0.01]">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-amber" />
              <span className="text-xs font-semibold text-amber uppercase tracking-wider">Social Sentiment</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{briefing.reddit_narrative}</p>
          </div>
        )}

        {briefing.themes && briefing.themes.length > 0 && (
          <div className="p-6">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Key Themes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {briefing.themes.map((theme, i) => (
                <button
                  key={i}
                  onClick={() => setExpandedTheme(expandedTheme === i ? null : i)}
                  className="bg-white/[0.02] border border-border rounded-xl p-4 text-left hover:border-border-hover hover:bg-white/[0.04] transition-all"
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
                          className="text-[11px] font-[family-name:var(--font-mono)] font-medium text-electric bg-electric/10 px-2 py-0.5 rounded-md cursor-pointer hover:bg-electric/20 transition-colors"
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

      {briefing.top_picks && briefing.top_picks.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-amber" />
            </div>
            <h2 className="text-base font-semibold text-text-primary">Today's Top Picks</h2>
          </div>
          <div className="divide-y divide-border">
            {briefing.top_picks.map((pick, i) => (
              <button
                key={i}
                onClick={() => navigate(`/analysis/${pick.ticker}`)}
                className="w-full p-5 text-left hover:bg-white/[0.02] transition-colors flex items-start gap-4"
              >
                <div className="shrink-0 mt-0.5">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${actionColors[pick.action] || actionColors.WATCH}`}>
                    {pick.action}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-sm font-bold text-electric font-[family-name:var(--font-mono)]">{pick.ticker}</span>
                    <span className="text-xs text-text-muted">{pick.company}</span>
                    {pick.conviction && (
                      <span className="text-[10px] text-text-muted bg-white/[0.04] px-2 py-0.5 rounded-md">
                        {pick.conviction} conviction
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{pick.reason}</p>
                  {pick.risk && (
                    <p className="text-xs text-danger/80 mt-2 flex items-center gap-1.5">
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

      {briefing.risk_warnings && briefing.risk_warnings.length > 0 && (
        <div className="rounded-2xl border border-danger/15 bg-danger/[0.04] p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <AlertTriangle className="w-4 h-4 text-danger" />
            <span className="text-xs font-semibold text-danger uppercase tracking-wider">Risk Warnings</span>
          </div>
          <ul className="space-y-1.5">
            {briefing.risk_warnings.map((warning, i) => (
              <li key={i} className="text-sm text-text-secondary flex items-start gap-2.5">
                <span className="text-danger/60 mt-0.5 shrink-0">&bull;</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
