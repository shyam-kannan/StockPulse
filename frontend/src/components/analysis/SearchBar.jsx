import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { api } from '../../utils/api';

export default function SearchBar({ currentTicker }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      try {
        const results = await api.searchTickers(query);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 200);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const ticker = query.trim().toUpperCase();
    if (ticker) {
      navigate(`/analysis/${ticker}`);
      setQuery('');
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const selectSuggestion = (ticker) => {
    navigate(`/analysis/${ticker}`);
    setQuery('');
    setShowSuggestions(false);
  };

  return (
    <div className="relative max-w-xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={currentTicker ? `Analyzing ${currentTicker}... Search another ticker` : 'Enter a ticker symbol (e.g., AAPL, TSLA, NVDA)'}
            maxLength={5}
            className="w-full pl-12 pr-10 py-3 bg-navy-800 border border-border rounded-xl text-text-primary text-lg placeholder:text-text-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric/50 font-[family-name:var(--font-mono)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-navy-800 border border-border rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.ticker}
              onClick={() => selectSuggestion(s.ticker)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-navy-700 transition-colors text-left"
            >
              <span className="text-sm font-semibold text-electric font-[family-name:var(--font-mono)]">{s.ticker}</span>
              <span className="text-xs text-text-secondary truncate ml-3">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
