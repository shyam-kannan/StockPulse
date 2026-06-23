import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowUp, MessageCircle, ExternalLink } from 'lucide-react';
import { timeAgo, sentimentColor } from '../../utils/formatters';

const subredditColors = {
  wallstreetbets: 'bg-yellow-900/40 text-yellow-300',
  stocks: 'bg-blue-900/40 text-blue-300',
  investing: 'bg-green-900/40 text-green-300',
  StockMarket: 'bg-purple-900/40 text-purple-300',
  SecurityAnalysis: 'bg-cyan-900/40 text-cyan-300',
  options: 'bg-orange-900/40 text-orange-300',
  Daytrading: 'bg-red-900/40 text-red-300',
};

export default function RedditBuzz({ posts, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-navy-800 border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="h-5 bg-navy-700 rounded w-32 animate-pulse" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-3 border-b border-border/50 animate-pulse">
            <div className="h-4 bg-navy-700 rounded w-full mb-2" />
            <div className="h-3 bg-navy-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="bg-navy-800 border border-border rounded-xl p-6 text-center">
        <MessageSquare className="w-6 h-6 text-text-muted mx-auto mb-2" />
        <p className="text-text-muted text-sm">No Reddit posts yet. Scraper is collecting data...</p>
      </div>
    );
  }

  return (
    <div className="bg-navy-800 border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber" />
          <h3 className="text-sm font-semibold text-text-primary">Live Reddit Feed</h3>
        </div>
        <span className="text-xs text-text-muted">{posts.length} posts</span>
      </div>

      <div className="max-h-[500px] overflow-y-auto divide-y divide-border/30">
        {posts.map((post) => {
          const colorClass = subredditColors[post.subreddit] || 'bg-navy-700 text-text-secondary';
          return (
            <a
              key={post.id}
              href={post.url?.startsWith('http') ? post.url : `https://reddit.com${post.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 hover:bg-navy-700/50 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 flex flex-col items-center gap-0.5 pt-0.5">
                  <ArrowUp className="w-3 h-3 text-amber" />
                  <span className="text-xs font-mono font-medium text-amber">{post.score}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary group-hover:text-electric transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colorClass}`}>
                      r/{post.subreddit}
                    </span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {post.num_comments}
                    </span>
                    <span className="text-xs text-text-muted">
                      {timeAgo(post.created_utc)}
                    </span>
                    {post.sentiment !== 0 && (
                      <span className={`text-xs font-mono ${sentimentColor(post.sentiment)}`}>
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
