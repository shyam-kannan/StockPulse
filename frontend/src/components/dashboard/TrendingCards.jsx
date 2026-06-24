import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatPrice, formatPercent, changeColor } from '../../utils/formatters';

function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="h-5 shimmer rounded w-16 mb-2" />
      <div className="h-3 shimmer rounded w-28 mb-5" />
      <div className="h-7 shimmer rounded w-24 mb-2" />
      <div className="h-3 shimmer rounded w-16" />
    </div>
  );
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function TrendingCards({ tickers, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-5xl mx-auto">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!tickers || tickers.length === 0) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto">
        <p className="text-text-muted text-sm">No trending tickers yet. Data is being collected...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-5xl mx-auto"
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
    >
      {tickers.slice(0, 8).map((t, i) => {
        const isUp = t.price_change_pct >= 0;
        return (
          <motion.button
            key={t.ticker}
            variants={item}
            onClick={() => navigate(`/analysis/${t.ticker}`)}
            className="card p-4 text-left cursor-pointer hover:border-border-hover transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-[15px] font-semibold text-accent font-[family-name:var(--font-mono)] tracking-tight">
                  {t.ticker}
                </span>
                <p className="text-[12px] text-text-muted mt-0.5 truncate max-w-[160px]">{t.company_name}</p>
              </div>
              <span className="text-[12px] text-text-muted/30 font-[family-name:var(--font-mono)] font-bold">
                {i + 1}
              </span>
            </div>

            <div className="mt-4">
              <span className="text-xl font-semibold text-text-primary font-[family-name:var(--font-mono)] tracking-tight">
                {formatPrice(t.current_price)}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-3">
              {t.price_change_pct != null && (
                <span className={`flex items-center gap-0.5 text-[13px] font-medium font-[family-name:var(--font-mono)] ${changeColor(t.price_change_pct)}`}>
                  {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {formatPercent(t.price_change_pct)}
                </span>
              )}
              <span className="flex items-center gap-1 text-[12px] text-text-muted">
                <MessageCircle className="w-3 h-3" />
                {t.mention_count}
              </span>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
