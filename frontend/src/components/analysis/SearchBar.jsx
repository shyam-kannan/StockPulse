import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { api } from '../../utils/api';

export default function SearchBar({ currentTicker }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focused, setFocused] = useState(false);
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
    <div className="relative max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${focused ? 'text-electric' : 'text-text-muted'}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            onFocus={() => { setFocused(true); suggestions.length > 0 && setShowSuggestions(true); }}
            onBlur={() => { setFocused(false); setTimeout(() => setShowSuggestions(false), 200); }}
            placeholder={currentTicker ? `Analyzing ${currentTicker} — search another ticker` : 'Search any stock ticker (e.g. AAPL, TSLA, NVDA)'}
            maxLength={5}
            className="w-full pl-14 pr-12 py-4 bg-white/[0.04] border border-border rounded-2xl text-text-primary text-lg placeholder:text-text-muted/60 focus:outline-none focus:border-electric/30 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(16,185,129,0.06)] font-[family-name:var(--font-mono)] transition-all duration-200"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); }}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-navy-800 border border-border rounded-2xl shadow-2xl overflow-hidden fade-in">
          {suggestions.map((s) => (
            <button
              key={s.ticker}
              onClick={() => selectSuggestion(s.ticker)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[0.04] transition-colors text-left"
            >
              <span className="text-sm font-semibold text-electric font-[family-name:var(--font-mono)]">{s.ticker}</span>
              <span className="text-xs text-text-secondary truncate ml-4">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
