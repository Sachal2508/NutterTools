import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toolsRegistry } from '../data/toolsRegistry';
import type { Tool } from '../data/toolsRegistry';
import { Shield, ArrowRight, FileText, Image, Wrench, SearchX, Clock } from 'lucide-react';

/* ─── Category config ─── */
const CATEGORIES: {
  key: Tool['category'];
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    key: 'pdf',
    label: 'PDF',
    desc: 'Merge, split, compress, convert & more',
    icon: <FileText size={14} />,
    color: 'text-orange-500',
  },
  {
    key: 'image',
    label: 'Images',
    desc: 'Resize, crop, convert & optimise',
    icon: <Image size={14} />,
    color: 'text-violet-500',
  },
  {
    key: 'utility',
    label: 'Utilities',
    desc: 'QR codes, passwords, counters & more',
    icon: <Wrench size={14} />,
    color: 'text-emerald-500',
  },
];

/* ─── Category accent colours for card glows ─── */
const CATEGORY_GLOW: Record<Tool['category'], string> = {
  pdf: 'hover:shadow-[0_12px_32px_rgba(255,92,0,0.18),0_2px_8px_rgba(255,92,0,0.10)] hover:border-orange-400/50',
  image: 'hover:shadow-[0_12px_32px_rgba(124,58,237,0.18),0_2px_8px_rgba(124,58,237,0.10)] hover:border-violet-400/50',
  utility: 'hover:shadow-[0_12px_32px_rgba(16,163,74,0.18),0_2px_8px_rgba(16,163,74,0.10)] hover:border-emerald-400/50',
};

const CATEGORY_ICON_HOVER: Record<Tool['category'], string> = {
  pdf: 'group-hover:text-orange-500',
  image: 'group-hover:text-violet-500',
  utility: 'group-hover:text-emerald-500',
};

export const Home: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('nt-recent-tools');
      if (stored) {
        setRecentIds(JSON.parse(stored).slice(0, 4));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const recentTools = recentIds
    .map(id => toolsRegistry.find(t => t.id === id))
    .filter((t): t is Tool => !!t);

  /* ── Filter tools ── */
  const filteredTools = toolsRegistry.filter(tool => {
    if (!query) return true;
    return (
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query)
    );
  });

  const isSearching = query.length > 0;

  return (
    <div className="page-enter">
      {/* ═══════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════ */}
      <section className="border-b border-border bg-surface-raised">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="font-mono text-[10px] text-accent uppercase tracking-widest font-medium">
                  100% Browser-Based
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-ink tracking-tight leading-[1.1]">
                The cheat code for<br />
                <span className="text-gradient-orange">your files.</span>
              </h1>
              <p className="text-sm md:text-base text-ink-muted leading-relaxed max-w-md">
                24 powerful tools for PDFs, images & utilities — all running locally in your browser. 
                No uploads. No servers. No nonsense.
              </p>
            </div>

            {/* Stats strip */}
            <div className="flex flex-row md:flex-col gap-4 md:gap-3 md:items-end shrink-0">
              {[
                { val: '24', label: 'tools' },
                { val: '0', label: 'server uploads' },
                { val: '∞', label: 'files processed' },
              ].map(({ val, label }) => (
                <div key={label} className="flex flex-col items-center md:items-end">
                  <span className="font-display text-2xl font-bold text-accent leading-none">{val}</span>
                  <span className="font-mono text-[9px] text-ink-muted uppercase tracking-widest">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category pills */}
          {!isSearching && (
            <div className="flex flex-wrap gap-2 mt-6">
              {CATEGORIES.map(cat => (
                <a
                  key={cat.key}
                  href={`#${cat.key}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface text-ink-muted hover:border-accent/50 hover:text-ink transition-all duration-200 text-xs font-medium btn-press"
                >
                  <span className={cat.color}>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className="text-ink-muted/60">· {cat.desc}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TOOL GRID
      ═══════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-14">

        {/* Search results header */}
        {isSearching && (
          <div className="flex items-center justify-between animate-fade-in">
            <p className="text-sm text-ink-muted">
              {filteredTools.length > 0
                ? <><strong className="text-ink">{filteredTools.length}</strong> tool{filteredTools.length !== 1 ? 's' : ''} matching "{query}"</>
                : `No results for "${query}"`
              }
            </p>
          </div>
        )}

        {/* Empty state */}
        {filteredTools.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20 text-center animate-bounce-in">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center">
              <SearchX size={28} className="text-ink-muted" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-ink">No tools found</p>
              <p className="text-sm text-ink-muted mt-1">Try a different keyword like "merge", "resize" or "QR"</p>
            </div>
          </div>
        )}

        {/* Recently Used Tools */}
        {!isSearching && recentTools.length > 0 && (
          <section className="flex flex-col gap-5 border-b border-border pb-8 animate-fade-in">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-accent" />
              <h2 className="font-display text-lg font-bold text-ink">Recently Used</h2>
              <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mt-0.5">
                Quick Access
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 relative">
              {recentTools.map((tool, i) => (
                <Link
                  key={`recent-${tool.id}`}
                  to={tool.route}
                  id={`recent-tool-card-${tool.id}`}
                  style={{ animationDelay: `${i * 45}ms` }}
                  className={`group relative bg-surface border border-border rounded-xl p-4 md:p-5 
                    flex flex-col justify-between min-h-[140px] md:min-h-[160px]
                    card-hover active:scale-[0.97] transition-all duration-250
                    ${CATEGORY_GLOW[tool.category]}
                    animate-fade-in-up shadow-card overflow-hidden`}
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-xl" />
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className={`p-1.5 rounded-lg bg-bg border border-border transition-all duration-200
                        group-hover:scale-110 text-ink-muted ${CATEGORY_ICON_HOVER[tool.category]}`}>
                        {React.createElement(tool.icon, { size: 14 })}
                      </span>
                      <span className="font-mono text-[8px] text-ink-muted uppercase tracking-widest opacity-60">
                        {tool.category}
                      </span>
                    </div>

                    <div className="mt-1">
                      <h3 className="font-display text-sm md:text-base font-bold text-ink leading-tight group-hover:text-accent transition-colors duration-200">
                        {tool.name}
                      </h3>
                      <p className="text-[11px] md:text-xs text-ink-muted leading-relaxed mt-1 line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-[10px] font-mono text-accent uppercase tracking-wider font-semibold
                    opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-250">
                    <span>Open</span>
                    <ArrowRight size={10} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Category Sections — normal mode */}
        {!isSearching && CATEGORIES.map(cat => {
          const sectionTools = filteredTools.filter(t => t.category === cat.key);
          if (sectionTools.length === 0) return null;

          return (
            <section key={cat.key} id={cat.key} className="flex flex-col gap-5">
              {/* Section header */}
              <div className="flex items-end justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className={cat.color}>{cat.icon}</span>
                  <h2 className="font-display text-lg font-bold text-ink">{cat.label}</h2>
                  <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mt-0.5">
                    {sectionTools.length} tools
                  </span>
                </div>
                <span className="text-xs text-ink-muted hidden sm:block">{cat.desc}</span>
              </div>

              {/* Tool cards grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 relative">
                {sectionTools.map((tool, i) => (
                  <Link
                    key={tool.id}
                    to={tool.route}
                    id={`tool-card-${tool.id}`}
                    style={{ animationDelay: `${i * 45}ms` }}
                    className={`group relative bg-surface border border-border rounded-xl p-4 md:p-5 
                      flex flex-col justify-between min-h-[140px] md:min-h-[160px]
                      card-hover active:scale-[0.97] transition-all duration-250
                      ${CATEGORY_GLOW[tool.category]}
                      animate-fade-in-up shadow-card overflow-hidden`}
                  >
                    {/* Subtle top accent line — appears on hover */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-xl" />
                    {/* Light-up gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className={`p-1.5 rounded-lg bg-bg border border-border transition-all duration-200
                          group-hover:scale-110 text-ink-muted ${CATEGORY_ICON_HOVER[tool.category]}`}>
                          {React.createElement(tool.icon, { size: 14 })}
                        </span>
                        <span className="font-mono text-[8px] text-ink-muted uppercase tracking-widest opacity-60">
                          {tool.category}
                        </span>
                      </div>

                      <div className="mt-1">
                        <h3 className="font-display text-sm md:text-base font-bold text-ink leading-tight group-hover:text-accent transition-colors duration-200">
                          {tool.name}
                        </h3>
                        <p className="text-[11px] md:text-xs text-ink-muted leading-relaxed mt-1 line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-[10px] font-mono text-accent uppercase tracking-wider font-semibold
                      opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-250">
                      <span>Open</span>
                      <ArrowRight size={10} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* Search results — flat grid */}
        {isSearching && filteredTools.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {filteredTools.map((tool, i) => (
              <Link
                key={tool.id}
                to={tool.route}
                id={`tool-card-${tool.id}`}
                style={{ animationDelay: `${i * 45}ms` }}
                className={`group relative bg-surface border border-border rounded-xl p-4 md:p-5 
                  flex flex-col justify-between min-h-[140px] md:min-h-[160px]
                  card-hover active:scale-[0.97] transition-all duration-250
                  ${CATEGORY_GLOW[tool.category]}
                  animate-fade-in-up shadow-card overflow-hidden`}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-xl" />
                {/* Light-up gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className={`p-1.5 rounded-lg bg-bg border border-border transition-all duration-200
                      group-hover:scale-110 text-ink-muted ${CATEGORY_ICON_HOVER[tool.category]}`}>
                      {React.createElement(tool.icon, { size: 14 })}
                    </span>
                    <span className="font-mono text-[8px] text-ink-muted uppercase tracking-widest opacity-60">
                      {tool.category}
                    </span>
                  </div>
                  <div className="mt-1">
                    <h3 className="font-display text-sm md:text-base font-bold text-ink leading-tight group-hover:text-accent transition-colors duration-200">
                      {tool.name}
                    </h3>
                    <p className="text-[11px] md:text-xs text-ink-muted leading-relaxed mt-1 line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1 text-[10px] font-mono text-accent uppercase tracking-wider font-semibold
                  opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-250">
                  <span>Open</span>
                  <ArrowRight size={10} />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Privacy badge strip */}
        {!isSearching && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-8 border-t border-border">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border shadow-card">
              <Shield size={16} className="text-success shrink-0" />
              <span className="text-xs text-ink-muted">
                <strong className="text-ink">Files never leave your device.</strong> All processing is done locally in your browser memory.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

