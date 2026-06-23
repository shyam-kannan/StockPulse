import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowUp, MessageCircle, ExternalLink } from 'lucide-react';
import { timeAgo, sentimentColor } from '../../utils/formatters';

const subredditColors = {
  wallstreetbets: 'bg-yellow-500/10 text-yellow-400',
  stocks: 'bg-blue-500/10 text-blue-400',
  investing: 'bg-emerald-500/10 text-emerald-400',
  StockMarket: 'bg-purple-500/10 text-purple-400',
  SecurityAnalysis: 'bg-cyan-500/10 text-cyan-400',
  options: 'bg-orange-500/10 text-orange-400',
  Daytrading: 'bg-rose-500/10 text-rose-400',
  StockTwits: 'bg-sky-500/10 text-sky-400',
  'X/Twitter': 'bg-white/10 text-white',
  'Reddit': 'bg-orange-500/10 text-orange-400',
};

export default function RedditBuzz({ posts, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="h-5 shimmer rounded-lg w-32" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-b border-border">
            <div className="h-4 shimmer rounded-lg w-full mb-2" />
            <div className="h-3 shimmer rounded-lg w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
          <MessageSquare className="w-5 h-5 text-text-muted" />
        </div>
        <p className="text-text-muted text-sm">No posts yet. Collecting data...</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-4 h-4 text-amber" />
          <h3 className="text-sm font-semibold text-text-primary">Social Feed</h3>
        </div>
        <span className="text-xs text-text-muted font-[family-name:var(--font-mono)]">{posts.length}</span>
      </div>

      <div className="max-h-[500px] overflow-y-auto divide-y divide-border">
        {posts.map((post) => {
          const colorClass = subredditColors[post.subreddit] || 'bg-white/[0.04] text-text-secondary';
          return (
            <a
              key={post.id}
              href={post.url?.startsWith('http') ? post.url : `https://reddit.com${post.url || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-5 py-3.5 hover:bg-white/[0.02] transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 flex flex-col items-center gap-0.5 pt-0.5 min-w-[32px]">
                  <ArrowUp className="w-3 h-3 text-text-muted" />
                  <span className="text-xs font-[family-name:var(--font-mono)] font-medium text-text-secondary">{post.score}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary group-hover:text-electric transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${colorClass}`}>
                      {post.subreddit === 'X/Twitter' ? '𝕏' : post.subreddit === 'StockTwits' ? 'ST' : post.subreddit === 'Reddit' ? 'Reddit' : `r/${post.subreddit}`}
                    </span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {post.num_comments}
                    </span>
                    <span className="text-xs text-text-muted">
                      {timeAgo(post.created_utc)}
                    </span>
                    {post.sentiment !== 0 && (
                      <span className={`text-xs font-[family-name:var(--font-mono)] ${sentimentColor(post.sentiment)}`}>
                        {post.sentiment > 0 ? '+' : ''}{post.sentiment.toFixed(2)}
                      </span>
                    )}
                    <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
