import { AlertCircle } from 'lucide-react';

function SkeletonContent() {
  return (
    <div className="space-y-3.5">
      <div className="h-4 shimmer rounded-xl w-full" />
      <div className="h-4 shimmer rounded-xl w-5/6" />
      <div className="h-4 shimmer rounded-xl w-4/6" />
      <div className="h-3 shimmer rounded-xl w-full mt-5" />
      <div className="h-3 shimmer rounded-xl w-3/4" />
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
      <div className="px-7 pt-6 pb-5 flex items-center gap-3.5">
        {Icon && (
          <div className={`w-9 h-9 rounded-xl ${accent.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4.5 h-4.5 ${accent.text}`} />
          </div>
        )}
        <h3 className="text-[15px] font-semibold text-text-primary tracking-tight">{title}</h3>
      </div>

      <div className="px-7 pb-7">
        {loading ? (
          <SkeletonContent />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2.5">
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
