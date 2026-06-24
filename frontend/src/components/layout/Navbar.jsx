import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, Menu, X, Search, BarChart3, BookOpen, LayoutDashboard, Briefcase } from 'lucide-react';

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
    open: 'Market Open',
    pre_market: 'Pre-Market',
    after_hours: 'After Hours',
    closed: 'Closed',
  };

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/analysis', label: 'Analysis', icon: BarChart3 },
    { to: '/portfolio', label: 'Portfolio', icon: Briefcase },
    { to: '/market', label: 'Learn', icon: BookOpen },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-navy-950/80 backdrop-blur-2xl border-b border-white/[0.04]">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between h-[72px]">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-3.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-electric/10 flex items-center justify-center group-hover:bg-electric/15 transition-colors duration-200">
              <Activity className="w-[18px] h-[18px] text-electric" />
            </div>
            <span className="text-lg font-semibold gradient-text font-[family-name:var(--font-mono)] tracking-tight">
              StockPulse
            </span>
          </NavLink>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-2 ml-12">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-text-primary bg-white/[0.06]'
                      : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.03]'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-5 ml-auto">
            <form onSubmit={handleSearch} className="relative">
              <Search
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                  searchFocused ? 'text-electric' : 'text-text-muted'
                }`}
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Ticker..."
                maxLength={5}
                className="w-40 focus:w-52 pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-text-primary placeholder:text-text-muted/70 focus:outline-none focus:border-electric/30 focus:bg-white/[0.05] font-[family-name:var(--font-mono)] transition-all duration-300"
              />
            </form>

            {marketStatus && (
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.025] border border-white/[0.04]">
                <div
                  className={`w-2 h-2 rounded-full ${statusColor[marketStatus.status] || 'bg-text-muted'} ${
                    marketStatus.is_open ? 'animate-pulse' : ''
                  }`}
                />
                <span className="text-xs font-medium text-text-secondary tracking-wide">
                  {statusLabel[marketStatus.status] || 'Unknown'}
                </span>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-3 text-text-muted hover:text-text-primary rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-5 border-t border-white/[0.04] space-y-2 fade-in">
            <form onSubmit={handleSearch} className="relative mb-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                placeholder="Search ticker..."
                maxLength={5}
                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-electric/30 font-[family-name:var(--font-mono)]"
              />
            </form>

            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3.5 text-sm rounded-xl transition-colors ${
                    isActive
                      ? 'text-text-primary bg-white/[0.05]'
                      : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.03]'
                  }`
                }
                onClick={() => setMenuOpen(false)}
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}

            {marketStatus && (
              <div className="flex items-center gap-2 px-5 py-3.5 mt-3">
                <div className={`w-2 h-2 rounded-full ${statusColor[marketStatus.status] || 'bg-text-muted'}`} />
                <span className="text-xs text-text-muted">{statusLabel[marketStatus.status]}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
