import { ExternalLink, Newspaper } from 'lucide-react';
import { timeAgo, sentimentColor } from '../../utils/formatters';

const sourceBadge = {
  yahoo: { label: 'Yahoo', color: 'bg-purple-500/10 text-purple-400' },
  marketwatch: { label: 'MarketWatch', color: 'bg-blue-500/10 text-blue-400' },
  cnbc: { label: 'CNBC', color: 'bg-yellow-500/10 text-yellow-400' },
  google_business: { label: 'Google', color: 'bg-emerald-500/10 text-emerald-400' },
  investing_com: { label: 'Investing', color: 'bg-orange-500/10 text-orange-400' },
  reuters: { label: 'Reuters', color: 'bg-sky-500/10 text-sky-400' },
};

export default function NewsFeed({ items, loading }) {
  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="h-5 shimmer rounded-lg w-28" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="px-5 py-3.5 border-b border-border">
            <div className="h-4 shimmer rounded-lg w-full mb-2" />
            <div className="h-3 shimmer rounded-lg w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Newspaper className="w-4 h-4 text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary">Market News</h3>
        </div>
        <span className="text-xs text-text-muted font-[family-name:var(--font-mono)]">{items?.length || 0}</span>
      </div>

      <div className="max-h-[600px] overflow-y-auto divide-y divide-border">
        {(!items || items.length === 0) ? (
          <div className="p-8 text-center text-text-muted text-sm">
            No news yet. Data is being collected...
          </div>
        ) : (
          items.map((item) => {
            const badge = sourceBadge[item.source] || { label: item.source, color: 'bg-white/[0.04] text-text-secondary' };
            const isFinviz = item.source?.startsWith('finviz_');
            const displayBadge = isFinviz
              ? { label: item.source.replace('finviz_', ''), color: 'bg-teal-500/10 text-teal-400' }
              : badge;

            return (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-5 py-3.5 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md shrink-0 mt-0.5 ${displayBadge.color}`}>
                    {displayBadge.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary group-hover:text-electric transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-text-muted">
                        {timeAgo(item.published_at || item.scraped_at)}
                      </span>
                      {item.sentiment !== 0 && (
                        <span className={`text-xs font-[family-name:var(--font-mono)] ${sentimentColor(item.sentiment)}`}>
                          {item.sentiment > 0 ? '+' : ''}{item.sentiment.toFixed(2)}
                        </span>
                      )}
                      <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
