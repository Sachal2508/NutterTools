import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, Menu, Zap, Mail } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

/* ── NutterTools Inline SVG Logomark ── */
const NutterLogo: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="var(--accent)" />
    <path d="M8 23V9h3.2l7.2 9.2V9H22v14h-3.2L11.4 13.8V23H8Z" fill="white" />
    <circle cx="25" cy="9" r="2.5" fill="white" fillOpacity="0.7" />
  </svg>
);

export const Header: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  /* Detect scroll to apply glassmorphism blur */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /* Auto-focus search when expanded on mobile */
  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (window.location.pathname !== '/') {
      navigate(`/?q=${encodeURIComponent(val)}`);
    } else {
      val ? setSearchParams({ q: val }) : setSearchParams({});
    }
  };

  const clearSearch = () => {
    setSearchParams({});
    setSearchOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-border bg-surface/80 backdrop-blur-lg shadow-sm'
          : 'border-border bg-surface'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-3">

          {/* ── Logo ── */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 group"
            aria-label="NutterTools home"
            onClick={() => setMenuOpen(false)}
          >
            <NutterLogo size={30} />
            <div className="flex flex-col leading-none">
              <span className="font-display text-[17px] font-bold tracking-tight text-ink group-hover:text-accent transition-colors duration-200">
                NutterTools
              </span>
              <span className="font-mono text-[9px] text-ink-muted uppercase tracking-widest hidden sm:block">
                Cheat Code for Your Files
              </span>
            </div>
          </Link>

          {/* ── Desktop Search ── */}
          <div className="flex-1 max-w-lg hidden sm:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-ink-muted group-focus-within:text-accent transition-colors">
                <Search size={15} />
              </div>
              <input
                type="search"
                value={query}
                onChange={handleSearchChange}
                placeholder="Search tools… PDF, image, merge…"
                className="w-full pl-9 pr-4 py-2 bg-bg border border-border rounded-lg text-sm text-ink placeholder-ink-muted 
                  focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-sans
                  transition-all duration-200"
                id="global-search-input"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-3 flex items-center text-ink-muted hover:text-ink transition-colors"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ── Right Actions ── */}
          <div className="flex items-center gap-1.5">
            {/* Mobile search toggle */}
            <button
              onClick={() => setSearchOpen(s => !s)}
              className="sm:hidden p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-border/40 transition-colors btn-press"
              aria-label="Toggle search"
            >
              <Search size={18} />
            </button>

            <Link
              to="/about"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-border/40 font-sans text-sm font-medium transition-colors"
            >
              <Zap size={13} className="text-accent" />
              Privacy
            </Link>

            <Link
              to="/contact"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-border/40 font-sans text-sm font-medium transition-colors"
            >
              <Mail size={13} className="text-accent" />
              Contact
            </Link>

            <ThemeToggle />

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(m => !m)}
              className="sm:hidden p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-border/40 transition-colors btn-press"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Search Expander ── */}
        {searchOpen && (
          <div className="sm:hidden pb-3 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-ink-muted">
                <Search size={15} />
              </div>
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={handleSearchChange}
                placeholder="Search tools…"
                className="w-full pl-9 pr-9 py-2.5 bg-bg border border-border rounded-lg text-sm text-ink placeholder-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-sans"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-3 flex items-center text-ink-muted"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <nav className="sm:hidden pb-4 border-t border-border mt-0 pt-3 flex flex-col gap-1 animate-fade-in">
          <Link
              to="/about"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-ink font-medium hover:bg-border/40 transition-colors text-sm"
            >
              <Zap size={14} className="text-accent" />
              About &amp; Privacy
            </Link>
            <Link
              to="/contact"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-ink font-medium hover:bg-border/40 transition-colors text-sm"
            >
              <Mail size={14} className="text-accent" />
              Contact
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
