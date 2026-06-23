import { MessageCircle, ArrowUp, ExternalLink } from 'lucide-react';
import { timeAgo } from '../../utils/formatters';

export default function RedditMentions({ posts, loading }) {
  if (loading) {
    return (
      <div className="bg-navy-800 border border-border rounded-xl p-4">
        <div className="h-5 bg-navy-700 rounded w-36 mb-4 animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3 mb-3">
            <div className="h-4 bg-navy-700 rounded w-8 animate-pulse" />
            <div className="h-4 bg-navy-700 rounded w-full animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-navy-800 border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-4 h-4 text-amber" />
        <h3 className="text-sm font-semibold text-text-primary">Reddit Mentions</h3>
        {posts && <span className="text-xs text-text-muted">({posts.length})</span>}
      </div>

      {(!posts || posts.length === 0) ? (
        <p className="text-text-muted text-sm text-center py-4">No recent Reddit mentions found</p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {posts.map((post, i) => (
            <a
              key={post.id || i}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-navy-700/50 transition-colors group"
            >
              <div className="flex flex-col items-center gap-0.5 shrink-0 min-w-[36px]">
                <ArrowUp className="w-3 h-3 text-amber" />
                <span className="text-xs font-[family-name:var(--font-mono)] text-amber">{post.score}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary group-hover:text-electric transition-colors line-clamp-2">
                  {post.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-text-muted bg-navy-700 px-1.5 py-0.5 rounded">
                    r/{post.subreddit}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {timeAgo(post.created_utc)}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {post.num_comments} comments
                  </span>
                  <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
