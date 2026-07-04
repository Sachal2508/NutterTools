import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toolsRegistry } from '../../data/toolsRegistry';
import { Clock, Trash2 } from 'lucide-react';

export const BenchRail: React.FC = () => {
  const location = useLocation();
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('nt-recent-tools');
    let list: string[] = stored ? JSON.parse(stored) : [];

    const currentTool = toolsRegistry.find(t => t.route === location.pathname);
    if (currentTool) {
      list = [currentTool.id, ...list.filter(id => id !== currentTool.id)].slice(0, 6);
      localStorage.setItem('nt-recent-tools', JSON.stringify(list));
    }
    setRecents(list);
  }, [location.pathname]);

  const recentTools = recents
    .map(id => toolsRegistry.find(t => t.id === id))
    .filter((t): t is typeof toolsRegistry[number] => !!t);

  if (recentTools.length === 0) return null;

  return (
    <div className="bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
          {/* Label */}
          <div className="flex items-center gap-1.5 shrink-0 text-ink-muted">
            <Clock size={11} />
            <span className="font-mono text-[9px] uppercase tracking-widest">Recent</span>
          </div>

          {/* Tool chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {recentTools.map((t, i) => {
              const isActive = location.pathname === t.route;
              return (
                <Link
                  key={t.id}
                  to={t.route}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium
                    transition-all duration-200 animate-fade-in btn-press
                    ${isActive
                      ? 'bg-accent text-white border-accent shadow-sm'
                      : 'bg-bg border-border text-ink-muted hover:border-accent/60 hover:text-accent hover:bg-surface-raised'
                    }`}
                >
                  {React.createElement(t.icon, { size: 10 })}
                  <span className="whitespace-nowrap">{t.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Clear */}
          <button
            onClick={() => {
              localStorage.removeItem('nt-recent-tools');
              setRecents([]);
            }}
            className="shrink-0 ml-auto p-1.5 rounded-lg text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors"
            title="Clear history"
            aria-label="Clear recent tools"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BenchRail;
