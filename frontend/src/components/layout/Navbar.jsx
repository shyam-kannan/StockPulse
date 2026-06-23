import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, Menu, X, Search } from 'lucide-react';

export default function Navbar({ marketStatus }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const ticker = searchInput.trim().toUpperCase();
    if (ticker) {
      navigate(`/analysis/${ticker}`);
      setSearchInput('');
      setMenuOpen(false);
    }
  };

  const statusColor = {
    open: 'bg-electric',
    pre_market: 'bg-amber',
    after_hours: 'bg-amber',
    closed: 'bg-danger',
  };

  const statusLabel = {
    open: 'MARKET OPEN',
    pre_market: 'PRE-MARKET',
    after_hours: 'AFTER HOURS',
    closed: 'CLOSED',
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'text-electric border-b-2 border-electric'
        : 'text-text-secondary hover:text-text-primary'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-navy-900/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <Activity className="w-5 h-5 text-electric" />
            <span className="text-lg font-bold text-electric font-[family-name:var(--font-mono)]">
              StockPulse
            </span>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={navLinkClass} end>Dashboard</NavLink>
            <NavLink to="/analysis" className={navLinkClass}>Analysis</NavLink>
            <NavLink to="/market" className={navLinkClass}>Learn</NavLink>
          </div>

          {/* Search + Status */}
          <div className="hidden md:flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                placeholder="Search ticker..."
                maxLength={5}
                className="w-36 pl-8 pr-3 py-1.5 bg-navy-800 border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-electric font-[family-name:var(--font-mono)]"
              />
            </form>

            {marketStatus && (
              <div className="flex items-center gap-2 px-3 py-1 bg-navy-800 rounded-md border border-border">
                <div className={`w-2 h-2 rounded-full ${statusColor[marketStatus.status] || 'bg-text-muted'} ${marketStatus.is_open ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-medium font-[family-name:var(--font-mono)] text-text-secondary">
                  {statusLabel[marketStatus.status] || 'UNKNOWN'}
                </span>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-text-primary"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-border space-y-2">
            <form onSubmit={handleSearch} className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                placeholder="Search ticker..."
                maxLength={5}
                className="w-full pl-8 pr-3 py-2 bg-navy-800 border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-electric font-[family-name:var(--font-mono)]"
              />
            </form>
            <NavLink to="/" className="block px-3 py-2 text-sm text-text-secondary hover:text-electric" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
            <NavLink to="/analysis" className="block px-3 py-2 text-sm text-text-secondary hover:text-electric" onClick={() => setMenuOpen(false)}>Analysis</NavLink>
            <NavLink to="/market" className="block px-3 py-2 text-sm text-text-secondary hover:text-electric" onClick={() => setMenuOpen(false)}>Learn</NavLink>
          </div>
        )}
      </div>
    </nav>
  );
}
