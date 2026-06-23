import { MessageCircle, ArrowUp, ExternalLink } from 'lucide-react';
import { timeAgo } from '../../utils/formatters';

function SourceBadge({ subreddit }) {
  if (subreddit === 'X/Twitter') {
    return (
      <span className="inline-flex items-center text-[10px] font-medium text-text-secondary bg-white/[0.06] px-2 py-0.5 rounded-md">
        <span className="mr-0.5 font-bold">&#120143;</span>
      </span>
    );
  }

  if (subreddit === 'StockTwits') {
    return (
      <span className="inline-flex items-center text-[10px] font-semibold text-amber bg-amber/[0.08] px-2 py-0.5 rounded-md">
        ST
      </span>
    );
  }

  if (subreddit === 'Reddit') {
    return (
      <span className="inline-flex items-center text-[10px] font-medium text-text-secondary bg-white/[0.06] px-2 py-0.5 rounded-md">
        Reddit
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-[10px] text-text-muted bg-white/[0.04] px-2 py-0.5 rounded-md">
      r/{subreddit}
    </span>
  );
}

function MentionsSkeleton() {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-5 h-5 shimmer rounded-md" />
        <div className="h-4 shimmer rounded-lg w-32" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3 py-2">
            <div className="w-8 h-8 shimmer rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 shimmer rounded-lg w-full" />
              <div className="h-3 shimmer rounded-lg w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MentionsEmpty() {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2.5 mb-6">
        <MessageCircle className="w-4 h-4 text-text-muted" />
        <h3 className="text-sm font-medium text-text-secondary">Social Mentions</h3>
      </div>
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-border flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-text-muted" />
        </div>
        <p className="text-sm text-text-muted">No social mentions yet for this ticker</p>
      </div>
    </div>
  );
}

export default function RedditMentions({ posts, loading }) {
  if (loading) return <MentionsSkeleton />;

  if (!posts || posts.length === 0) return <MentionsEmpty />;

  return (
    <div className="card p-6 fade-in">
      <div className="flex items-center gap-2.5 mb-6">
        <MessageCircle className="w-4 h-4 text-amber" />
        <h3 className="text-sm font-medium text-text-primary">Social Mentions</h3>
        <span className="text-xs text-text-muted font-[family-name:var(--font-mono)] ml-auto">
          {posts.length}
        </span>
      </div>

      <div className="space-y-0.5 max-h-[360px] overflow-y-auto -mx-2 px-2">
        {posts.map((post, i) => (
          <a
            key={post.id || i}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
          >
            <div className="flex flex-col items-center gap-0.5 shrink-0 min-w-[36px] pt-0.5">
              <ArrowUp className="w-3 h-3 text-text-muted group-hover:text-electric transition-colors" />
              <span className="text-xs font-[family-name:var(--font-mono)] text-text-secondary">
                {post.score}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary leading-snug line-clamp-2 group-hover:text-electric transition-colors">
                {post.title}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <SourceBadge subreddit={post.subreddit} />
                <span className="text-[10px] text-text-muted">
                  {timeAgo(post.created_utc)}
                </span>
                {post.num_comments != null && (
                  <span className="text-[10px] text-text-muted">
                    {post.num_comments} comments
                  </span>
                )}
                <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
