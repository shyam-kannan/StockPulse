import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, Menu, X, Search, BarChart3, BookOpen, LayoutDashboard } from 'lucide-react';

export default function Navbar({ marketStatus }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const ticker = searchInput.trim().toUpperCase();
    if (ticker) {
      navigate(`/analysis/${ticker}`);
      setSearchInput('');
      setMenuOpen(false);
      setSearchFocused(false);
    }
  };

  const statusColor = {
    open: 'bg-electric',
    pre_market: 'bg-amber',
    after_hours: 'bg-amber',
    closed: 'bg-danger',
  };

  const statusLabel = {
    open: 'Open',
    pre_market: 'Pre-Market',
    after_hours: 'After Hours',
    closed: 'Closed',
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'text-text-primary bg-white/5'
        : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-navy-950/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-electric/10 flex items-center justify-center group-hover:bg-electric/20 transition-colors">
              <Activity className="w-4 h-4 text-electric" />
            </div>
            <span className="text-lg font-semibold gradient-text font-[family-name:var(--font-mono)] tracking-tight">
              StockPulse
            </span>
          </NavLink>

          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={navLinkClass} end>
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </NavLink>
            <NavLink to="/analysis" className={navLinkClass}>
              <BarChart3 className="w-4 h-4" />
              Analysis
            </NavLink>
            <NavLink to="/market" className={navLinkClass}>
              <BookOpen className="w-4 h-4" />
              Learn
            </NavLink>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchFocused ? 'text-electric' : 'text-text-muted'}`} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search ticker..."
                maxLength={5}
                className="w-40 focus:w-52 pl-9 pr-3 py-2 bg-white/[0.04] border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-electric/40 focus:bg-white/[0.06] font-[family-name:var(--font-mono)] transition-all duration-300"
              />
            </form>

            {marketStatus && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03]">
                <div className={`w-1.5 h-1.5 rounded-full ${statusColor[marketStatus.status] || 'bg-text-muted'} ${marketStatus.is_open ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-medium text-text-secondary">
                  {statusLabel[marketStatus.status] || 'Unknown'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden py-4 border-t border-border space-y-1 fade-in">
            <form onSubmit={handleSearch} className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                placeholder="Search ticker..."
                maxLength={5}
                className="w-full pl-9 pr-3 py-2.5 bg-white/[0.04] border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-electric/40 font-[family-name:var(--font-mono)]"
              />
            </form>
            <NavLink to="/" className="flex items-center gap-3 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/[0.04] transition-colors" onClick={() => setMenuOpen(false)}>
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </NavLink>
            <NavLink to="/analysis" className="flex items-center gap-3 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/[0.04] transition-colors" onClick={() => setMenuOpen(false)}>
              <BarChart3 className="w-4 h-4" /> Analysis
            </NavLink>
            <NavLink to="/market" className="flex items-center gap-3 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/[0.04] transition-colors" onClick={() => setMenuOpen(false)}>
              <BookOpen className="w-4 h-4" /> Learn
            </NavLink>
            {marketStatus && (
              <div className="flex items-center gap-2 px-3 py-2.5 mt-2">
                <div className={`w-1.5 h-1.5 rounded-full ${statusColor[marketStatus.status] || 'bg-text-muted'}`} />
                <span className="text-xs text-text-secondary">{statusLabel[marketStatus.status]}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
