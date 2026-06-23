import { ExternalLink } from 'lucide-react';
import { timeAgo, sentimentColor } from '../../utils/formatters';

const sourceBadge = {
  yahoo: { label: 'Yahoo', color: 'bg-purple-900/50 text-purple-300' },
  marketwatch: { label: 'MW', color: 'bg-blue-900/50 text-blue-300' },
  reuters: { label: 'Reuters', color: 'bg-orange-900/50 text-orange-300' },
};

export default function NewsFeed({ items, loading }) {
  if (loading) {
    return (
      <div className="bg-navy-800 border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="h-5 bg-navy-700 rounded w-24 animate-pulse" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-3 border-b border-border/50">
            <div className="h-4 bg-navy-700 rounded w-full mb-2 animate-pulse" />
            <div className="h-3 bg-navy-700 rounded w-1/3 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-navy-800 border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">News Feed</h3>
        <span className="text-xs text-text-muted">{items?.length || 0} items</span>
      </div>

      <div className="max-h-[600px] overflow-y-auto divide-y divide-border/30">
        {(!items || items.length === 0) ? (
          <div className="p-6 text-center text-text-muted text-sm">
            No news items yet. Data is being scraped...
          </div>
        ) : (
          items.map((item) => {
            const badge = sourceBadge[item.source] || { label: item.source, color: 'bg-navy-700 text-text-secondary' };
            return (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 hover:bg-navy-700/50 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${badge.color}`}>
                    {badge.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary group-hover:text-electric transition-colors line-clamp-2">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
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
