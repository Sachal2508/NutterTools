import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toolsRegistry } from '../data/toolsRegistry';
import type { Tool } from '../data/toolsRegistry';
import {
  Shield, ArrowRight, FileText, Image, Wrench, SearchX,
  Clock, TrendingUp, ChevronRight,
} from 'lucide-react';

/* ─── Category config ─── */
const CATEGORIES: {
  key: Tool['category'];
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  glow: string;
  tabBg: string;
  tabBorder: string;
  tabGlow: string;
  gradient: string;
}[] = [
  {
    key: 'pdf',
    label: 'PDF',
    desc: 'Merge, split, compress, convert & more',
    icon: FileText,
    color: 'text-orange-500',
    glow: 'hover:shadow-[0_12px_32px_rgba(255,92,0,0.18),0_2px_8px_rgba(255,92,0,0.10)] hover:border-orange-400/50',
    tabBg: 'group-hover:bg-orange-500/8 dark:group-hover:bg-orange-500/10',
    tabBorder: 'group-hover:border-orange-400/60',
    tabGlow: 'group-hover:shadow-[0_8px_24px_rgba(255,92,0,0.20)]',
    gradient: 'from-orange-500/15 via-orange-500/5 to-transparent',
  },
  {
    key: 'image',
    label: 'Images',
    desc: 'Resize, crop, convert & optimise',
    icon: Image,
    color: 'text-violet-500',
    glow: 'hover:shadow-[0_12px_32px_rgba(124,58,237,0.18),0_2px_8px_rgba(124,58,237,0.10)] hover:border-violet-400/50',
    tabBg: 'group-hover:bg-violet-500/8 dark:group-hover:bg-violet-500/10',
    tabBorder: 'group-hover:border-violet-400/60',
    tabGlow: 'group-hover:shadow-[0_8px_24px_rgba(124,58,237,0.20)]',
    gradient: 'from-violet-500/15 via-violet-500/5 to-transparent',
  },
  {
    key: 'utility',
    label: 'Utilities',
    desc: 'QR codes, passwords, counters & more',
    icon: Wrench,
    color: 'text-emerald-500',
    glow: 'hover:shadow-[0_12px_32px_rgba(16,163,74,0.18),0_2px_8px_rgba(16,163,74,0.10)] hover:border-emerald-400/50',
    tabBg: 'group-hover:bg-emerald-500/8 dark:group-hover:bg-emerald-500/10',
    tabBorder: 'group-hover:border-emerald-400/60',
    tabGlow: 'group-hover:shadow-[0_8px_24px_rgba(16,163,74,0.20)]',
    gradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
  },
];

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

/* ── Format numbers nicely ── */
const formatCount = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
};

/* ── Shared ToolCard component to avoid repetition ── */
interface ToolCardProps {
  tool: Tool;
  index: number;
  idPrefix?: string;
}
const ToolCard: React.FC<ToolCardProps> = ({ tool, index, idPrefix = 'tool' }) => (
  <Link
    to={tool.route}
    id={`${idPrefix}-card-${tool.id}`}
    style={{ animationDelay: `${index * 45}ms` }}
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
        <span className={`p-1.5 rounded-lg bg-bg border border-border transition-all duration-200 group-hover:scale-110 text-ink-muted ${CATEGORY_ICON_HOVER[tool.category]}`}>
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
    <div className="mt-3 flex items-center gap-1 text-[10px] font-mono text-accent uppercase tracking-wider font-semibold opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-250">
      <span>Open</span>
      <ArrowRight size={10} />
    </div>
  </Link>
);

/* ══════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════ */
export const Home: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim().toLowerCase();

  /* Recently used */
  const [recentIds, setRecentIds] = useState<string[]>([]);

  /* Most-used counts map */
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});

  /* Files processed stat */
  const [filesProcessed, setFilesProcessed] = useState(0);

  const totalTools = toolsRegistry.length;

  /* Load state from localStorage */
  useEffect(() => {
    const loadStats = () => {
      try {
        const storedRecent = localStorage.getItem('nt-recent-tools');
        if (storedRecent) setRecentIds(JSON.parse(storedRecent).slice(0, 4));
      } catch (_) {}

      try {
        const storedUsage = localStorage.getItem('nt-tool-usage-counts');
        if (storedUsage) setUsageCounts(JSON.parse(storedUsage));
      } catch (_) {}

      try {
        const storedFiles = parseInt(localStorage.getItem('nt-files-processed') || '0', 10);
        setFilesProcessed(storedFiles);
      } catch (_) {}
    };

    loadStats();
    window.addEventListener('nt-stats-update', loadStats);
    return () => window.removeEventListener('nt-stats-update', loadStats);
  }, []);

  const recentTools = recentIds
    .map(id => toolsRegistry.find(t => t.id === id))
    .filter((t): t is Tool => !!t);

  /* Top 4 most-used tools (that have been used at least once) */
  const mostUsedTools = Object.entries(usageCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([id]) => toolsRegistry.find(t => t.id === id))
    .filter((t): t is Tool => !!t);

  /* Filter tools for search */
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
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">

            {/* Left — heading + tagline */}
            <div className="flex flex-col gap-4 max-w-xl">
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
                <span className="font-semibold text-ink">{totalTools} powerful tools</span> for PDFs, images &amp; utilities — all running locally in your browser.
                No uploads. No servers. No nonsense.
              </p>
            </div>

            {/* Right — stats strip */}
            <div className="flex flex-row md:flex-col gap-5 md:gap-4 md:items-end shrink-0">
              {[
                { val: totalTools.toString(), label: 'tools' },
                { val: '0', label: 'server uploads' },
                { val: filesProcessed > 0 ? formatCount(filesProcessed) : '∞', label: 'files processed' },
              ].map(({ val, label }) => (
                <div key={label} className="flex flex-col items-center md:items-end">
                  <span className="font-display text-2xl font-bold text-accent leading-none">{val}</span>
                  <span className="font-mono text-[9px] text-ink-muted uppercase tracking-widest">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Premium Category Tabs ── */}
          {!isSearching && (
            <div className="flex flex-wrap gap-3 mt-8">
              {CATEGORIES.map(cat => {
                const count = toolsRegistry.filter(t => t.category === cat.key).length;
                const Icon = cat.icon;
                return (
                  <a
                    key={cat.key}
                    href={`#${cat.key}`}
                    className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl border border-border
                      bg-surface overflow-hidden cursor-pointer select-none
                      card-hover active:scale-[0.97]
                      ${cat.tabBorder} ${cat.tabGlow}
                      transition-all duration-250`}
                  >
                    {/* Gradient wash on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${cat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                    {/* Top accent line */}
                    <div className={`absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-xl ${
                      cat.key === 'pdf' ? 'bg-orange-500' : cat.key === 'image' ? 'bg-violet-500' : 'bg-emerald-500'
                    }`} />

                    {/* Icon box */}
                    <div className={`relative z-10 p-2 rounded-lg bg-bg border border-border transition-all duration-200 group-hover:scale-110 group-hover:border-transparent ${cat.color}`}>
                      <Icon size={16} />
                    </div>

                    {/* Text */}
                    <div className="relative z-10 flex flex-col leading-none">
                      <span className="font-display text-sm font-bold text-ink group-hover:text-ink transition-colors">
                        {cat.label}
                      </span>
                      <span className="text-[11px] text-ink-muted mt-0.5 hidden sm:block">
                        {cat.desc}
                      </span>
                    </div>

                    {/* Count badge */}
                    <div className={`relative z-10 ml-auto pl-3 flex items-center gap-1 text-[10px] font-mono font-bold ${cat.color} opacity-70 group-hover:opacity-100 transition-opacity`}>
                      <span>{count}</span>
                      <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TOOL GRID
      ═══════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-14">

        {/* Search header */}
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
            <div className="flex items-center gap-2.5">
              <Clock size={16} className="text-accent" />
              <h2 className="font-display text-lg font-bold text-ink">Recently Used</h2>
              <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mt-0.5">
                Quick Access
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {recentTools.map((tool, i) => (
                <ToolCard key={`recent-${tool.id}`} tool={tool} index={i} idPrefix="recent" />
              ))}
            </div>
          </section>
        )}

        {/* Most Used Tools */}
        {!isSearching && mostUsedTools.length > 0 && (
          <section className="flex flex-col gap-5 border-b border-border pb-8 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <TrendingUp size={16} className="text-accent" />
              <h2 className="font-display text-lg font-bold text-ink">Most Used</h2>
              <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mt-0.5">
                Your Top Tools
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {mostUsedTools.map((tool, i) => (
                <ToolCard key={`top-${tool.id}`} tool={tool} index={i} idPrefix="top" />
              ))}
            </div>
          </section>
        )}

        {/* Category Sections */}
        {!isSearching && CATEGORIES.map(cat => {
          const sectionTools = filteredTools.filter(t => t.category === cat.key);
          if (sectionTools.length === 0) return null;
          const Icon = cat.icon;

          return (
            <section key={cat.key} id={cat.key} className="flex flex-col gap-5">
              <div className="flex items-end justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className={cat.color}><Icon size={14} /></span>
                  <h2 className="font-display text-lg font-bold text-ink">{cat.label}</h2>
                  <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mt-0.5">
                    {sectionTools.length} tools
                  </span>
                </div>
                <span className="text-xs text-ink-muted hidden sm:block">{cat.desc}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {sectionTools.map((tool, i) => (
                  <ToolCard key={tool.id} tool={tool} index={i} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Search results flat grid */}
        {isSearching && filteredTools.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {filteredTools.map((tool, i) => (
              <ToolCard key={tool.id} tool={tool} index={i} />
            ))}
          </div>
        )}

        {/* Privacy badge */}
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
