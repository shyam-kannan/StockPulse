import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

function BriefingSkeleton() {
  return (
    <div className="text-center">
      <div className="h-7 shimmer rounded-lg w-56 mx-auto mb-4" />
      <div className="h-4 shimmer rounded-lg w-full max-w-xl mx-auto mb-2" />
      <div className="h-4 shimmer rounded-lg w-3/4 max-w-md mx-auto mb-10" />
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
        <p className="text-text-muted text-sm max-w-md mx-auto">
          {briefing?.market_overview || 'AI briefing unavailable. Ensure your API key is configured.'}
        </p>
      </div>
    );
  }

  const overviewText = briefing.market_overview || '';
  const truncatedOverview = overviewText.length > 280 ? overviewText.slice(0, 280) + '...' : overviewText;

  return (
    <div>
      {/* Centered header */}
      <div className="text-center mb-10">
        <p className="section-label mb-3">Powered by Claude AI</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">AI Market Briefing</h2>
      </div>

      {/* TLDR banner */}
      {briefing.tldr && (
        <div className="max-w-3xl mx-auto mb-8">
          <div className="relative overflow-hidden rounded-xl border border-electric/15 bg-gradient-to-r from-electric/[0.08] via-electric/[0.03] to-transparent px-6 py-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-electric shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-electric/90 leading-relaxed">{briefing.tldr}</p>
            </div>
          </div>
        </div>
      )}

      {/* Market overview */}
      <div className="max-w-3xl mx-auto text-center mb-12">
        <p className="text-[15px] text-text-secondary leading-[1.8]">
          {showFullOverview ? overviewText : truncatedOverview}
        </p>
        {overviewText.length > 280 && (
          <button
            onClick={() => setShowFullOverview(!showFullOverview)}
            className="mt-3 text-sm text-electric hover:text-electric-dim transition-colors cursor-pointer inline-flex items-center gap-1 mx-auto"
          >
            {showFullOverview ? 'Show less' : 'Read more'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFullOverview ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Social sentiment */}
      {briefing.reddit_narrative && (
        <div className="max-w-3xl mx-auto mb-12">
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
        <div className="mb-12">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider text-center mb-6">Key Themes</p>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {briefing.themes.map((theme, i) => (
              <motion.button
                key={i}
                variants={fadeUp}
                whileHover={{ y: -2 }}
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
              </motion.button>
            ))}
          </motion.div>
        </div>
      )}

      {/* Top Picks */}
      {briefing.top_picks && briefing.top_picks.length > 0 && (
        <div className="mb-12">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2.5">
              <Target className="w-4 h-4 text-amber" />
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Today's Top Picks</p>
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
                whileHover={{ y: -2 }}
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
              </motion.button>
            ))}
          </motion.div>
        </div>
      )}

      {/* Risk Warnings */}
      {briefing.risk_warnings && briefing.risk_warnings.length > 0 && (
        <div className="max-w-3xl mx-auto">
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
