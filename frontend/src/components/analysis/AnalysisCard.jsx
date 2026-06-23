function SkeletonContent() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-navy-700 rounded w-full" />
      <div className="h-4 bg-navy-700 rounded w-5/6" />
      <div className="h-4 bg-navy-700 rounded w-4/6" />
      <div className="h-3 bg-navy-700 rounded w-full mt-4" />
      <div className="h-3 bg-navy-700 rounded w-3/4" />
    </div>
  );
}

export default function AnalysisCard({ title, icon: Icon, accentColor = 'electric', loading, error, children }) {
  const borderColor = {
    electric: 'border-t-electric',
    amber: 'border-t-amber',
    danger: 'border-t-danger',
  }[accentColor] || 'border-t-electric';

  return (
    <div className={`bg-navy-800 border border-border rounded-xl overflow-hidden border-t-2 ${borderColor}`}>
      <div className="p-4 border-b border-border/50 flex items-center gap-2">
        {Icon && <Icon className={`w-4 h-4 text-${accentColor}`} />}
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="p-4">
        {loading ? (
          <SkeletonContent />
        ) : error ? (
          <div className="text-center py-4">
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
