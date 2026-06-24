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
    <div className="space-y-8">
      <div className="card p-10">
        <div className="h-7 shimmer rounded-lg w-56 mb-6" />
        <div className="h-5 shimmer rounded-lg w-full mb-3" />
        <div className="h-5 shimmer rounded-lg w-3/4 mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/[0.02] rounded-2xl p-7">
              <div className="h-5 shimmer rounded-lg w-36 mb-4" />
              <div className="h-4 shimmer rounded-lg w-full mb-3" />
              <div className="h-4 shimmer rounded-lg w-2/3" />
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
      <div className="card p-14 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-5">
          <Brain className="w-8 h-8 text-text-muted" />
        </div>
        <p className="text-text-muted text-base max-w-md mx-auto leading-relaxed">
          {briefing?.market_overview || 'AI briefing is loading. Ensure your ANTHROPIC_API_KEY is configured.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {briefing.tldr && (
        <div className="relative overflow-hidden rounded-2xl border border-electric/15 bg-gradient-to-r from-electric/[0.08] via-electric/[0.03] to-transparent px-8 py-6">
          <div className="flex items-center gap-4">
            <Sparkles className="w-6 h-6 text-electric shrink-0" />
            <p className="text-base font-medium text-electric/90 leading-relaxed">
              {briefing.tldr}
            </p>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-8 border-b border-border">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-10 h-10 rounded-xl bg-electric/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-electric" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary">AI Market Briefing</h2>
          </div>
          <p className="text-[15px] text-text-secondary leading-[1.8]">{briefing.market_overview}</p>
        </div>

        {briefing.reddit_narrative && (
          <div className="px-8 py-6 border-b border-border bg-white/[0.01]">
            <div className="flex items-center gap-3 mb-3">
              <MessageSquare className="w-5 h-5 text-amber" />
              <span className="text-xs font-semibold text-amber uppercase tracking-wider">Social Sentiment</span>
            </div>
            <p className="text-[15px] text-text-secondary leading-[1.8]">{briefing.reddit_narrative}</p>
          </div>
        )}

        {briefing.themes && briefing.themes.length > 0 && (
          <div className="p-8">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-6">Key Themes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {briefing.themes.map((theme, i) => (
                <button
                  key={i}
                  onClick={() => setExpandedTheme(expandedTheme === i ? null : i)}
                  className="bg-white/[0.02] border border-border rounded-2xl p-6 text-left hover:border-border-hover hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-sm font-semibold text-text-primary leading-snug flex-1">{theme.title}</h4>
                    {theme.sentiment && (
                      <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ml-3 shrink-0 ${sentimentBadge[theme.sentiment] || sentimentBadge.mixed}`}>
                        {theme.sentiment}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm text-text-secondary leading-relaxed ${expandedTheme === i ? '' : 'line-clamp-2'}`}>
                    {theme.description}
                  </p>
                  {theme.tickers && theme.tickers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {theme.tickers.map(t => (
                        <span
                          key={t}
                          onClick={(e) => { e.stopPropagation(); navigate(`/analysis/${t}`); }}
                          className="text-xs font-[family-name:var(--font-mono)] font-medium text-electric bg-electric/10 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-electric/20 transition-colors"
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
          <div className="p-7 border-b border-border flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary">Today's Top Picks</h2>
          </div>
          <div className="divide-y divide-border">
            {briefing.top_picks.map((pick, i) => (
              <button
                key={i}
                onClick={() => navigate(`/analysis/${pick.ticker}`)}
                className="w-full p-7 text-left hover:bg-white/[0.02] transition-colors flex items-start gap-5"
              >
                <div className="shrink-0 mt-0.5">
                  <span className={`text-xs font-bold px-4 py-2 rounded-xl border ${actionColors[pick.action] || actionColors.WATCH}`}>
                    {pick.action}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-base font-bold text-electric font-[family-name:var(--font-mono)]">{pick.ticker}</span>
                    <span className="text-sm text-text-muted">{pick.company}</span>
                    {pick.conviction && (
                      <span className="text-xs text-text-muted bg-white/[0.04] px-2.5 py-1 rounded-lg">
                        {pick.conviction} conviction
                      </span>
                    )}
                  </div>
                  <p className="text-[15px] text-text-secondary leading-relaxed">{pick.reason}</p>
                  {pick.risk && (
                    <p className="text-sm text-danger/80 mt-3 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
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
        <div className="rounded-2xl border border-danger/15 bg-danger/[0.04] p-8">
          <div className="flex items-center gap-3 mb-5">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <span className="text-sm font-semibold text-danger uppercase tracking-wider">Risk Warnings</span>
          </div>
          <ul className="space-y-3">
            {briefing.risk_warnings.map((warning, i) => (
              <li key={i} className="text-[15px] text-text-secondary flex items-start gap-3">
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
