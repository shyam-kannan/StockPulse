import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, AlertTriangle, Sparkles, Target, MessageSquare, ChevronDown } from 'lucide-react';

const actionColors = {
  BUY: 'bg-accent/12 text-accent border-accent/20',
  WATCH: 'bg-warning/12 text-warning border-warning/20',
  AVOID: 'bg-danger/12 text-danger border-danger/20',
};

const sentimentBadge = {
  bullish: 'bg-accent/10 text-accent',
  bearish: 'bg-danger/10 text-danger',
  mixed: 'bg-warning/10 text-warning',
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

function BriefingSkeleton() {
  return (
    <div className="text-center">
      <div className="h-6 shimmer rounded w-48 mx-auto mb-3" />
      <div className="h-4 shimmer rounded w-full max-w-lg mx-auto mb-2" />
      <div className="h-4 shimmer rounded w-3/4 max-w-md mx-auto mb-10" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-5">
            <div className="h-4 shimmer rounded w-28 mb-3" />
            <div className="h-4 shimmer rounded w-full mb-2" />
            <div className="h-4 shimmer rounded w-2/3" />
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
      <div className="text-center py-10">
        <Brain className="w-10 h-10 text-text-muted/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">AI Market Briefing</h3>
        <p className="text-sm text-text-muted max-w-md mx-auto">
          {briefing?.market_overview || 'AI briefing unavailable. Ensure your API key is configured.'}
        </p>
      </div>
    );
  }

  const overviewText = briefing.market_overview || '';
  const truncatedOverview = overviewText.length > 300 ? overviewText.slice(0, 300) + '...' : overviewText;

  return (
    <div>
      {/* Centered header */}
      <div className="text-center mb-10">
        <p className="section-label mb-2">Powered by Claude AI</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-[-0.02em]">AI Market Briefing</h2>
      </div>

      {/* TLDR */}
      {briefing.tldr && (
        <div className="max-w-3xl mx-auto mb-8">
          <div className="rounded-lg border border-accent/15 bg-accent-subtle px-5 py-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-accent/90 leading-relaxed">{briefing.tldr}</p>
            </div>
          </div>
        </div>
      )}

      {/* Overview */}
      <div className="max-w-3xl mx-auto text-center mb-10">
        <p className="text-[15px] text-text-secondary leading-[1.8]">
          {showFullOverview ? overviewText : truncatedOverview}
        </p>
        {overviewText.length > 300 && (
          <button
            onClick={() => setShowFullOverview(!showFullOverview)}
            className="mt-3 text-sm text-accent hover:text-accent-dim transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            {showFullOverview ? 'Show less' : 'Read more'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFullOverview ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Social sentiment */}
      {briefing.reddit_narrative && (
        <div className="max-w-3xl mx-auto mb-10">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-warning" />
              <span className="text-[11px] font-semibold text-warning uppercase tracking-wider">Social Sentiment</span>
            </div>
            <p className="text-sm text-text-secondary leading-[1.7]">{briefing.reddit_narrative}</p>
          </div>
        </div>
      )}

      {/* Key themes */}
      {briefing.themes && briefing.themes.length > 0 && (
        <div className="mb-10">
          <p className="section-label text-center mb-5">Key Themes</p>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {briefing.themes.map((theme, i) => (
              <motion.button
                key={i}
                variants={fadeUp}
                onClick={() => setExpandedTheme(expandedTheme === i ? null : i)}
                className="card p-5 text-left cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-text-primary leading-snug flex-1">{theme.title}</h4>
                  {theme.sentiment && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ml-2 shrink-0 ${sentimentBadge[theme.sentiment] || sentimentBadge.mixed}`}>
                      {theme.sentiment}
                    </span>
                  )}
                </div>
                <p className={`text-[13px] text-text-secondary leading-relaxed ${expandedTheme === i ? '' : 'line-clamp-3'}`}>
                  {theme.description}
                </p>
                {theme.tickers && theme.tickers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {theme.tickers.map(t => (
                      <span
                        key={t}
                        onClick={(e) => { e.stopPropagation(); navigate(`/analysis/${t}`); }}
                        className="text-[11px] font-[family-name:var(--font-mono)] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded cursor-pointer hover:bg-accent/20 transition-colors"
                      >
                        ${t}
                      </span>
                    ))}
                  </div>
                )}
              </motion.button>
            ))}
          </motion.div>
        </div>
      )}

      {/* Top Picks */}
      {briefing.top_picks && briefing.top_picks.length > 0 && (
        <div className="mb-10">
          <div className="text-center mb-5">
            <div className="flex items-center justify-center gap-2">
              <Target className="w-4 h-4 text-warning" />
              <p className="section-label">Today's Top Picks</p>
            </div>
          </div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {briefing.top_picks.map((pick, i) => (
              <motion.button
                key={i}
                variants={fadeUp}
                onClick={() => navigate(`/analysis/${pick.ticker}`)}
                className="card p-5 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded border ${actionColors[pick.action] || actionColors.WATCH}`}>
                    {pick.action}
                  </span>
                  <span className="text-sm font-semibold text-accent font-[family-name:var(--font-mono)]">{pick.ticker}</span>
                </div>
                {pick.company && <p className="text-[12px] text-text-muted mb-1.5">{pick.company}</p>}
                <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-3">{pick.reason}</p>
                {pick.conviction && (
                  <p className="text-[11px] text-text-muted mt-2.5 uppercase tracking-wider">{pick.conviction} conviction</p>
                )}
              </motion.button>
            ))}
          </motion.div>
        </div>
      )}

      {/* Risk Warnings */}
      {briefing.risk_warnings && briefing.risk_warnings.length > 0 && (
        <div className="max-w-3xl mx-auto">
          <div className="rounded-lg border border-danger/15 bg-danger-subtle p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-danger" />
              <span className="text-[11px] font-semibold text-danger uppercase tracking-wider">Risk Warnings</span>
            </div>
            <ul className="space-y-2">
              {briefing.risk_warnings.map((warning, i) => (
                <li key={i} className="text-[13px] text-text-secondary flex items-start gap-2 leading-relaxed">
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
