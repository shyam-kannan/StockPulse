import { AlertCircle } from 'lucide-react';

function SkeletonContent() {
  return (
    <div className="space-y-3">
      <div className="h-4 shimmer rounded-lg w-full" />
      <div className="h-4 shimmer rounded-lg w-5/6" />
      <div className="h-4 shimmer rounded-lg w-4/6" />
      <div className="h-3 shimmer rounded-lg w-full mt-4" />
      <div className="h-3 shimmer rounded-lg w-3/4" />
    </div>
  );
}

const accentStyles = {
  electric: { border: 'border-l-electric', bg: 'bg-electric/[0.08]', text: 'text-electric' },
  amber: { border: 'border-l-amber', bg: 'bg-amber/[0.08]', text: 'text-amber' },
  danger: { border: 'border-l-danger', bg: 'bg-danger/[0.08]', text: 'text-danger' },
};

export default function AnalysisCard({ title, icon: Icon, accentColor = 'electric', loading, error, children }) {
  const accent = accentStyles[accentColor] || accentStyles.electric;

  return (
    <div className={`card overflow-hidden border-l-2 ${accent.border}`}>
      <div className="px-6 pt-5 pb-4 flex items-center gap-3">
        {Icon && (
          <div className={`w-8 h-8 rounded-xl ${accent.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${accent.text}`} />
          </div>
        )}
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>

      <div className="px-6 pb-6">
        {loading ? (
          <SkeletonContent />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <AlertCircle className="w-5 h-5 text-amber" />
            <p className="text-sm text-text-secondary">Analysis unavailable</p>
            <p className="text-xs text-text-muted mt-0.5">{error}</p>
          </div>
        ) : (
          <div className="fade-in">{children}</div>
        )}
      </div>
    </div>
  );
}
