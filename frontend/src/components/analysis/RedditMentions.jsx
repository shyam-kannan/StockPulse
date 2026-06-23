import { MessageCircle, ArrowUp, ExternalLink } from 'lucide-react';
import { timeAgo } from '../../utils/formatters';

export default function RedditMentions({ posts, loading }) {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="h-5 shimmer rounded-lg w-36 mb-5" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3 mb-3">
            <div className="h-4 shimmer rounded w-8" />
            <div className="h-4 shimmer rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2.5 mb-5">
        <MessageCircle className="w-4 h-4 text-amber" />
        <h3 className="text-sm font-semibold text-text-primary">Reddit Mentions</h3>
        {posts && <span className="text-xs text-text-muted font-[family-name:var(--font-mono)]">({posts.length})</span>}
      </div>

      {(!posts || posts.length === 0) ? (
        <p className="text-text-muted text-sm text-center py-6">No recent mentions found</p>
      ) : (
        <div className="space-y-1 max-h-[320px] overflow-y-auto">
          {posts.map((post, i) => (
            <a
              key={post.id || i}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
            >
              <div className="flex flex-col items-center gap-0.5 shrink-0 min-w-[36px]">
                <ArrowUp className="w-3 h-3 text-text-muted" />
                <span className="text-xs font-[family-name:var(--font-mono)] text-text-secondary">{post.score}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary group-hover:text-electric transition-colors line-clamp-2 leading-snug">
                  {post.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-text-muted bg-white/[0.04] px-2 py-0.5 rounded-md">
                    r/{post.subreddit}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {timeAgo(post.created_utc)}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {post.num_comments} comments
                  </span>
                  <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
