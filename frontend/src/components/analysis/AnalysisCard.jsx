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

export default function AnalysisCard({ title, icon: Icon, accentColor = 'electric', loading, error, children }) {
  const accentStyles = {
    electric: 'from-electric/20 to-transparent',
    amber: 'from-amber/20 to-transparent',
    danger: 'from-danger/20 to-transparent',
  };

  return (
    <div className="card overflow-hidden">
      <div className="relative px-5 py-4 border-b border-border flex items-center gap-2.5">
        <div className={`absolute inset-0 bg-gradient-to-r ${accentStyles[accentColor] || accentStyles.electric} opacity-[0.04]`} />
        <div className={`relative w-7 h-7 rounded-lg bg-${accentColor}/10 flex items-center justify-center`}>
          {Icon && <Icon className={`w-3.5 h-3.5 text-${accentColor}`} />}
        </div>
        <h3 className="relative text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="p-5">
        {loading ? (
          <SkeletonContent />
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-amber text-sm">Analysis unavailable</p>
            <p className="text-text-muted text-xs mt-1">{error}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
