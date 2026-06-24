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
    <div className="max-w-3xl mx-auto text-center">
      <div className="h-8 shimmer rounded-xl w-64 mx-auto mb-6" />
      <div className="h-5 shimmer rounded-xl w-full mb-3" />
      <div className="h-5 shimmer rounded-xl w-3/4 mx-auto mb-12" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card p-8">
            <div className="h-5 shimmer rounded-lg w-36 mb-4" />
            <div className="h-4 shimmer rounded-lg w-full mb-3" />
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
      <div className="text-center max-w-lg mx-auto py-8">
        <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-border flex items-center justify-center mx-auto mb-6">
          <Brain className="w-10 h-10 text-text-muted/40" />
        </div>
        <p className="text-text-muted text-base leading-relaxed">
          {briefing?.market_overview || 'AI briefing unavailable. Ensure your API key is configured.'}
        </p>
      </div>
    );
  }

  const overviewText = briefing.market_overview || '';
  const truncatedOverview = overviewText.length > 280 ? overviewText.slice(0, 280) + '...' : overviewText;

  return (
    <div className="fade-in-up">
      {/* Centered header */}
      <div className="text-center mb-12">
        <p className="section-label mb-4">Powered by Claude AI</p>
        <h2 className="text-3xl sm:text-5xl font-bold text-text-primary tracking-tight">
          AI Market Briefing
        </h2>
      </div>

      {/* TLDR banner */}
      {briefing.tldr && (
        <div className="max-w-3xl mx-auto mb-12">
          <div className="relative overflow-hidden rounded-2xl border border-electric/15 bg-gradient-to-r from-electric/[0.08] via-electric/[0.03] to-transparent px-8 py-6">
            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-electric shrink-0 mt-0.5" />
              <p className="text-base font-medium text-electric/90 leading-relaxed">
                {briefing.tldr}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Market overview — truncated by default */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <p className="text-lg text-text-secondary leading-[1.9]">
          {showFullOverview ? overviewText : truncatedOverview}
        </p>
        {overviewText.length > 280 && (
          <button
            onClick={() => setShowFullOverview(!showFullOverview)}
            className="mt-4 text-sm text-electric hover:text-electric-dim transition-colors cursor-pointer flex items-center gap-1 mx-auto"
          >
            {showFullOverview ? 'Show less' : 'Read more'}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFullOverview ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Social sentiment */}
      {briefing.reddit_narrative && (
        <div className="max-w-3xl mx-auto mb-16">
          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-amber" />
              <span className="section-label !text-amber !mb-0">Social Sentiment</span>
            </div>
            <p className="text-[15px] text-text-secondary leading-[1.8]">{briefing.reddit_narrative}</p>
          </div>
        </div>
      )}

      {/* Key themes — grid */}
      {briefing.themes && briefing.themes.length > 0 && (
        <div className="mb-16">
          <p className="section-label text-center mb-8">Key Themes</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {briefing.themes.map((theme, i) => (
              <button
                key={i}
                onClick={() => setExpandedTheme(expandedTheme === i ? null : i)}
                className="glass-card p-8 text-left"
              >
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-base font-semibold text-text-primary leading-snug flex-1">{theme.title}</h4>
                  {theme.sentiment && (
                    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ml-3 shrink-0 ${sentimentBadge[theme.sentiment] || sentimentBadge.mixed}`}>
                      {theme.sentiment}
                    </span>
                  )}
                </div>
                <p className={`text-sm text-text-secondary leading-relaxed ${expandedTheme === i ? '' : 'line-clamp-3'}`}>
                  {theme.description}
                </p>
                {theme.tickers && theme.tickers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-5">
                    {theme.tickers.map(t => (
                      <span
                        key={t}
                        onClick={(e) => { e.stopPropagation(); navigate(`/analysis/${t}`); }}
                        className="text-xs font-[family-name:var(--font-mono)] font-medium text-electric bg-electric/10 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-electric/20 transition-colors"
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
        <div className="mb-16">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-amber/10 flex items-center justify-center mx-auto mb-4">
              <Target className="w-7 h-7 text-amber" />
            </div>
            <h3 className="text-2xl font-bold text-text-primary">Today's Top Picks</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {briefing.top_picks.map((pick, i) => (
              <button
                key={i}
                onClick={() => navigate(`/analysis/${pick.ticker}`)}
                className="glass-card p-8 text-left"
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className={`text-xs font-bold px-4 py-2 rounded-xl border ${actionColors[pick.action] || actionColors.WATCH}`}>
                    {pick.action}
                  </span>
                  <span className="text-xl font-bold text-electric font-[family-name:var(--font-mono)]">{pick.ticker}</span>
                </div>
                {pick.company && <p className="text-sm text-text-muted mb-4">{pick.company}</p>}
                <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">{pick.reason}</p>
                {pick.conviction && (
                  <p className="text-xs text-text-muted mt-4 uppercase tracking-wider">{pick.conviction} conviction</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Risk Warnings — compact */}
      {briefing.risk_warnings && briefing.risk_warnings.length > 0 && (
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-danger/15 bg-danger/[0.04] p-8">
            <div className="flex items-center gap-3 mb-5">
              <AlertTriangle className="w-5 h-5 text-danger" />
              <span className="section-label !text-danger !mb-0">Risk Warnings</span>
            </div>
            <ul className="space-y-3">
              {briefing.risk_warnings.map((warning, i) => (
                <li key={i} className="text-sm text-text-secondary flex items-start gap-3 leading-relaxed">
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
