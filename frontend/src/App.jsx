import './index.css'

function App() {
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <div className="w-3 h-3 bg-electric rounded-full animate-pulse" />
          <h1 className="text-5xl font-bold text-electric font-[family-name:var(--font-mono)]">
            StockPulse
          </h1>
        </div>
        <p className="text-text-secondary text-lg">
          AI-Powered Stock Research Dashboard
        </p>
        <div className="flex gap-4 justify-center text-sm font-[family-name:var(--font-mono)]">
          <span className="px-3 py-1 bg-navy-800 border border-border rounded text-electric-dim">
            Reddit Sentiment
          </span>
          <span className="px-3 py-1 bg-navy-800 border border-border rounded text-amber">
            Claude AI Analysis
          </span>
          <span className="px-3 py-1 bg-navy-800 border border-border rounded text-text-secondary">
            Real-Time Data
          </span>
        </div>
      </div>
    </div>
  )
}

export default App
