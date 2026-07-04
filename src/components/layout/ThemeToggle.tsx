import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nt-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-lg border border-border hover:border-accent/60 bg-surface hover:bg-surface-raised
        flex items-center justify-center transition-all duration-200 btn-press overflow-hidden group"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      id="theme-toggle-btn"
    >
      <span
        className={`absolute transition-all duration-300 ${
          theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
        }`}
      >
        <Moon size={16} className="text-ink-muted group-hover:text-ink transition-colors" />
      </span>
      <span
        className={`absolute transition-all duration-300 ${
          theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        }`}
      >
        <Sun size={16} className="text-ink-muted group-hover:text-accent transition-colors" />
      </span>
    </button>
  );
};

export default ThemeToggle;
