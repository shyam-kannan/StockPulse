import { AlertCircle } from 'lucide-react';

function SkeletonContent() {
  return (
    <div className="space-y-5">
      <div className="h-5 shimmer rounded-lg w-full" />
      <div className="h-5 shimmer rounded-lg w-5/6" />
      <div className="h-5 shimmer rounded-lg w-4/6" />
      <div className="h-4 shimmer rounded-lg w-full mt-6" />
      <div className="h-4 shimmer rounded-lg w-3/4" />
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
      <div className="px-10 pt-8 pb-6 flex items-center gap-4">
        {Icon && (
          <div className={`w-11 h-11 rounded-lg ${accent.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${accent.text}`} />
          </div>
        )}
        <h3 className="text-lg font-semibold text-text-primary tracking-tight">{title}</h3>
      </div>

      <div className="px-10 pb-10">
        {loading ? (
          <SkeletonContent />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <AlertCircle className="w-6 h-6 text-amber" />
            <p className="text-base text-text-secondary">Analysis unavailable</p>
            <p className="text-sm text-text-muted mt-1">{error}</p>
          </div>
        ) : (
          <div className="">{children}</div>
        )}
      </div>
    </div>
  );
}
