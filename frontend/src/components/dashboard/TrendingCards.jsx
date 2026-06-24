import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatPrice, formatPercent, changeColor } from '../../utils/formatters';

function SkeletonCard() {
  return (
    <div className="glass-card p-6">
      <div className="h-6 shimmer rounded-lg w-20 mb-3" />
      <div className="h-4 shimmer rounded-lg w-36 mb-6" />
      <div className="h-8 shimmer rounded-lg w-28 mb-3" />
      <div className="h-4 shimmer rounded-lg w-20" />
    </div>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function TrendingCards({ tickers, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!tickers || tickers.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-text-muted">No trending tickers yet. Data is being collected...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
    >
      {tickers.slice(0, 8).map((t, i) => {
        const isUp = t.price_change_pct >= 0;
        return (
          <motion.button
            key={t.ticker}
            variants={cardVariants}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/analysis/${t.ticker}`)}
            className="glass-card p-5 sm:p-6 text-left group relative overflow-hidden"
          >
            <div className="absolute top-4 right-5 text-text-muted/8 font-[family-name:var(--font-mono)] text-5xl font-bold leading-none select-none">
              {i + 1}
            </div>

            <div className="relative">
              <span className="text-lg font-bold text-electric font-[family-name:var(--font-mono)] tracking-tight">
                {t.ticker}
              </span>
              <p className="text-xs text-text-muted mt-1 truncate">{t.company_name}</p>

              <div className="mt-5">
                <span className="text-2xl font-semibold text-text-primary font-[family-name:var(--font-mono)] tracking-tight">
                  {formatPrice(t.current_price)}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-3">
                {t.price_change_pct != null && (
                  <span className={`flex items-center gap-1 text-sm font-semibold font-[family-name:var(--font-mono)] ${changeColor(t.price_change_pct)}`}>
                    {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {formatPercent(t.price_change_pct)}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <MessageCircle className="w-3 h-3" />
                  {t.mention_count}
                </span>
              </div>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
