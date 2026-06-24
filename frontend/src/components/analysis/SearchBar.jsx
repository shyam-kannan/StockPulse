import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { api } from '../../utils/api';

export default function SearchBar({ currentTicker }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      try {
        const results = await api.searchTickers(query);
        setSuggestions(results);
        setShowSuggestions(true);
        setActiveIndex(-1);
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
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      selectSuggestion(suggestions[activeIndex].ticker);
      return;
    }
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
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search
            className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
              focused ? 'text-accent' : 'text-text-muted'
            }`}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            onFocus={() => {
              setFocused(true);
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => {
              setFocused(false);
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              currentTicker
                ? `Analyzing ${currentTicker} — search another ticker`
                : 'Search any stock ticker (e.g. AAPL, TSLA, NVDA)'
            }
            maxLength={5}
            className={`w-full pl-14 pr-12 py-4.5 bg-white/[0.04] border rounded-lg text-text-primary text-lg placeholder:text-text-muted/50 focus:outline-none font-[family-name:var(--font-mono)] tracking-wide transition-all duration-200 ${
              focused
                ? 'border-accent/30 bg-white/[0.06]'
                : 'border-border hover:border-border-hover'
            }`}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-bg-hover border border-border rounded-lg shadow-[0_16px_48px_rgba(0,0,0,0.4)] overflow-hidden ">
          {suggestions.map((s, i) => (
            <button
              key={s.ticker}
              onClick={() => selectSuggestion(s.ticker)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 transition-colors text-left ${
                i === activeIndex
                  ? 'bg-white/[0.06]'
                  : 'hover:bg-white/[0.03]'
              }`}
            >
              <span className="text-sm font-semibold text-accent font-[family-name:var(--font-mono)] w-16 shrink-0">
                {s.ticker}
              </span>
              <span className="text-sm text-text-secondary truncate">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
