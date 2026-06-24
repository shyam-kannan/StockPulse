import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, AlertTriangle, Sparkles, Target, MessageSquare, ChevronDown } from 'lucide-react';

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
    <div>
      <div className="h-7 shimmer rounded-lg w-56 mb-4" />
      <div className="h-4 shimmer rounded-lg w-full mb-2" />
      <div className="h-4 shimmer rounded-lg w-3/4 mb-10" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card p-6">
            <div className="h-5 shimmer rounded-lg w-32 mb-3" />
            <div className="h-4 shimmer rounded-lg w-full mb-2" />
            <div className="h-4 shimmer rounded-lg w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DailyBriefing({ briefing, loading }) {
  const navigate = useNavigate();
  const [expandedTheme, setExpandedTheme] = useState(null);
  const [showFullOverview, setShowFullOverview] = useState(false);

  if (loading) return <BriefingSkeleton />;
  if (!briefing || briefing.error) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-border flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-text-muted/40" />
        </div>
        <p className="text-text-muted text-sm">
          {briefing?.market_overview || 'AI briefing unavailable. Ensure your API key is configured.'}
        </p>
      </div>
    );
  }

  const overviewText = briefing.market_overview || '';
  const truncatedOverview = overviewText.length > 280 ? overviewText.slice(0, 280) + '...' : overviewText;

  return (
    <div className="fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <p className="section-label mb-2">Powered by Claude AI</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">AI Market Briefing</h2>
      </div>

      {/* TLDR banner */}
      {briefing.tldr && (
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-xl border border-electric/15 bg-gradient-to-r from-electric/[0.08] via-electric/[0.03] to-transparent px-6 py-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-electric shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-electric/90 leading-relaxed">{briefing.tldr}</p>
            </div>
          </div>
        </div>
      )}

      {/* Market overview */}
      <div className="mb-10 max-w-3xl">
        <p className="text-[15px] text-text-secondary leading-[1.8]">
          {showFullOverview ? overviewText : truncatedOverview}
        </p>
        {overviewText.length > 280 && (
          <button
            onClick={() => setShowFullOverview(!showFullOverview)}
            className="mt-3 text-sm text-electric hover:text-electric-dim transition-colors cursor-pointer flex items-center gap-1"
          >
            {showFullOverview ? 'Show less' : 'Read more'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFullOverview ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Social sentiment */}
      {briefing.reddit_narrative && (
        <div className="mb-10">
          <div className="glass-card p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <MessageSquare className="w-4 h-4 text-amber" />
              <span className="text-xs font-semibold text-amber uppercase tracking-wider">Social Sentiment</span>
            </div>
            <p className="text-sm text-text-secondary leading-[1.8]">{briefing.reddit_narrative}</p>
          </div>
        </div>
      )}

      {/* Key themes */}
      {briefing.themes && briefing.themes.length > 0 && (
        <div className="mb-10">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Key Themes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {briefing.themes.map((theme, i) => (
              <button
                key={i}
                onClick={() => setExpandedTheme(expandedTheme === i ? null : i)}
                className="glass-card p-5 text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-semibold text-text-primary leading-snug flex-1">{theme.title}</h4>
                  {theme.sentiment && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ml-2 shrink-0 ${sentimentBadge[theme.sentiment] || sentimentBadge.mixed}`}>
                      {theme.sentiment}
                    </span>
                  )}
                </div>
                <p className={`text-sm text-text-secondary leading-relaxed ${expandedTheme === i ? '' : 'line-clamp-3'}`}>
                  {theme.description}
                </p>
                {theme.tickers && theme.tickers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {theme.tickers.map(t => (
                      <span
                        key={t}
                        onClick={(e) => { e.stopPropagation(); navigate(`/analysis/${t}`); }}
                        className="text-xs font-[family-name:var(--font-mono)] font-medium text-electric bg-electric/10 px-2 py-1 rounded-md cursor-pointer hover:bg-electric/20 transition-colors"
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

      {/* Top Picks */}
      {briefing.top_picks && briefing.top_picks.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <Target className="w-4 h-4 text-amber" />
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Today's Top Picks</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {briefing.top_picks.map((pick, i) => (
              <button
                key={i}
                onClick={() => navigate(`/analysis/${pick.ticker}`)}
                className="glass-card p-5 text-left"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${actionColors[pick.action] || actionColors.WATCH}`}>
                    {pick.action}
                  </span>
                  <span className="text-base font-bold text-electric font-[family-name:var(--font-mono)]">{pick.ticker}</span>
                </div>
                {pick.company && <p className="text-xs text-text-muted mb-2">{pick.company}</p>}
                <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">{pick.reason}</p>
                {pick.conviction && (
                  <p className="text-xs text-text-muted mt-3 uppercase tracking-wider">{pick.conviction} conviction</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Risk Warnings */}
      {briefing.risk_warnings && briefing.risk_warnings.length > 0 && (
        <div>
          <div className="rounded-xl border border-danger/15 bg-danger/[0.04] p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <AlertTriangle className="w-4 h-4 text-danger" />
              <span className="text-xs font-semibold text-danger uppercase tracking-wider">Risk Warnings</span>
            </div>
            <ul className="space-y-2">
              {briefing.risk_warnings.map((warning, i) => (
                <li key={i} className="text-sm text-text-secondary flex items-start gap-2 leading-relaxed">
                  <span className="text-danger/60 mt-0.5 shrink-0">&bull;</span>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
