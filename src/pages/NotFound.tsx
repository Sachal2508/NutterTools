import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="page-enter flex flex-col items-center justify-center min-h-[60vh] px-4 text-center gap-6">
      {/* Glitchy 404 number */}
      <div className="relative select-none">
        <span
          className="font-display text-[120px] sm:text-[160px] font-bold leading-none text-border"
          aria-hidden="true"
        >
          404
        </span>
        <span
          className="font-display text-[120px] sm:text-[160px] font-bold leading-none text-accent absolute inset-0 flex items-center justify-center"
          style={{ clipPath: 'inset(40% 0 40% 0)' }}
          aria-hidden="true"
        >
          404
        </span>
      </div>

      {/* GTA-style cheat code message */}
      <div className="flex flex-col gap-2 max-w-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 w-fit mx-auto">
          <Zap size={12} className="text-accent" />
          <span className="font-mono text-[10px] text-accent uppercase tracking-widest">Cheat code failed</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">
          This tool doesn't exist
        </h1>
        <p className="text-sm text-ink-muted leading-relaxed">
          The page you're looking for isn't in our cheat code list. Head back to the main menu and pick a real tool.
        </p>
      </div>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white border border-accent 
          font-mono text-xs uppercase tracking-wider font-semibold hover:bg-accent-hover transition-all
          shadow-sm hover:shadow-[0_4px_16px_rgba(255,92,0,0.35)] btn-press"
      >
        <span>Back to NutterTools</span>
        <ArrowRight size={14} />
      </Link>
    </div>
  );
};

export default NotFound;
