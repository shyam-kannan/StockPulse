import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, Menu, X, Search, BarChart3, BookOpen, LayoutDashboard, Briefcase } from 'lucide-react';

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
    open: 'bg-accent',
    pre_market: 'bg-warning',
    after_hours: 'bg-warning',
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
    <nav className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-border">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
            <Activity className="w-5 h-5 text-accent" />
            <span className="text-[15px] font-semibold text-text-primary tracking-tight">
              StockPulse
            </span>
          </NavLink>

          <div className="hidden md:flex items-center gap-1 ml-10">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'text-text-primary bg-white/[0.06]'
                      : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.03]'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </NavLink>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4 ml-auto">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                placeholder="Ticker..."
                maxLength={5}
                className="w-32 focus:w-44 pl-9 pr-3 py-1.5 bg-white/[0.03] border border-border rounded-lg text-[13px] text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent/30 font-[family-name:var(--font-mono)] transition-all duration-200"
              />
            </form>

            {marketStatus && (
              <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${statusColor[marketStatus.status] || 'bg-text-muted'} ${
                    marketStatus.is_open ? 'animate-pulse' : ''
                  }`}
                />
                {statusLabel[marketStatus.status] || 'Unknown'}
              </div>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden py-3 border-t border-border space-y-1">
            <form onSubmit={handleSearch} className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                placeholder="Search ticker..."
                maxLength={5}
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/30 font-[family-name:var(--font-mono)]"
              />
            </form>

            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors ${
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
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-text-muted">
                <div className={`w-1.5 h-1.5 rounded-full ${statusColor[marketStatus.status] || 'bg-text-muted'}`} />
                {statusLabel[marketStatus.status]}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
