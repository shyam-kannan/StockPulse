import { MessageCircle, ArrowUp, ExternalLink } from 'lucide-react';
import { timeAgo } from '../../utils/formatters';

function SourceBadge({ subreddit }) {
  if (subreddit === 'X/Twitter') {
    return (
      <span className="inline-flex items-center text-xs font-medium text-text-secondary bg-white/[0.06] px-2.5 py-1 rounded-lg">
        <span className="mr-0.5 font-bold">&#120143;</span>
      </span>
    );
  }

  if (subreddit === 'StockTwits') {
    return (
      <span className="inline-flex items-center text-xs font-semibold text-amber bg-amber/[0.08] px-2.5 py-1 rounded-lg">
        ST
      </span>
    );
  }

  if (subreddit === 'Reddit') {
    return (
      <span className="inline-flex items-center text-xs font-medium text-text-secondary bg-white/[0.06] px-2.5 py-1 rounded-lg">
        Reddit
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-xs text-text-muted bg-white/[0.04] px-2.5 py-1 rounded-lg">
      r/{subreddit}
    </span>
  );
}

function MentionsSkeleton() {
  return (
    <div className="card p-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-5 h-5 shimmer rounded-md" />
        <div className="h-5 shimmer rounded-lg w-36" />
      </div>
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4 py-3">
            <div className="w-10 h-10 shimmer rounded-lg shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-4 shimmer rounded-lg w-full" />
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
    <div className="card p-10">
      <div className="flex items-center gap-3 mb-8">
        <MessageCircle className="w-5 h-5 text-text-muted" />
        <h3 className="text-base font-medium text-text-secondary">Social Mentions</h3>
      </div>
      <div className="flex flex-col items-center justify-center py-14 gap-4">
        <div className="w-14 h-14 rounded-lg bg-white/[0.03] border border-border flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-text-muted" />
        </div>
        <p className="text-base text-text-muted">No social mentions yet for this ticker</p>
      </div>
    </div>
  );
}

export default function RedditMentions({ posts, loading }) {
  if (loading) return <MentionsSkeleton />;

  if (!posts || posts.length === 0) return <MentionsEmpty />;

  return (
    <div className="card p-10 ">
      <div className="flex items-center gap-3 mb-8">
        <MessageCircle className="w-5 h-5 text-amber" />
        <h3 className="text-base font-medium text-text-primary">Social Mentions</h3>
        <span className="text-sm text-text-muted font-[family-name:var(--font-mono)] ml-auto">
          {posts.length}
        </span>
      </div>

      <div className="space-y-1 max-h-[440px] overflow-y-auto -mx-3 px-3">
        {posts.map((post, i) => (
          <a
            key={post.id || i}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 px-4 py-4 rounded-xl hover:bg-white/[0.03] transition-colors group"
          >
            <div className="flex flex-col items-center gap-1 shrink-0 min-w-[40px] pt-0.5">
              <ArrowUp className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors" />
              <span className="text-sm font-[family-name:var(--font-mono)] text-text-secondary">
                {post.score}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[15px] text-text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                {post.title}
              </p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <SourceBadge subreddit={post.subreddit} />
                <span className="text-xs text-text-muted">
                  {timeAgo(post.created_utc)}
                </span>
                {post.num_comments != null && (
                  <span className="text-xs text-text-muted">
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
