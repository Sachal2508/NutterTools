import React, { useEffect } from 'react';
import { Shield, BookOpen, ArrowLeft, Cpu, HardDrive, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Tool } from '../../data/toolsRegistry';
import FAQBlock from './FAQBlock';

interface ToolPageLayoutProps {
  tool: Tool;
  children: React.ReactNode;
}

export const ToolPageLayout: React.FC<ToolPageLayoutProps> = ({ tool, children }) => {
  useEffect(() => {
    document.title = `${tool.name} | NutterTools`;
    window.scrollTo({ top: 0, behavior: 'instant' });

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', tool.description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = tool.description;
      document.head.appendChild(meta);
    }
  }, [tool]);

  const categoryColors: Record<string, { badge: string; icon: string }> = {
    pdf:     { badge: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/30 dark:border-orange-800/50 dark:text-orange-400', icon: 'text-orange-500' },
    image:   { badge: 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-950/30 dark:border-violet-800/50 dark:text-violet-400', icon: 'text-violet-500' },
    utility: { badge: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-400', icon: 'text-emerald-500' },
  };
  const colors = categoryColors[tool.category] || categoryColors['utility'];

  return (
    <div className="page-enter max-w-4xl mx-auto py-6 md:py-10 px-4 sm:px-6 flex flex-col gap-6 md:gap-8">

      {/* ── Breadcrumb + metadata row ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent transition-colors font-medium btn-press"
        >
          <ArrowLeft size={14} />
          <span>All Tools</span>
        </Link>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono uppercase tracking-wider ${colors.badge}`}>
          {React.createElement(tool.icon, { size: 10 })}
          {tool.category}
        </span>
      </div>

      {/* ── Title block ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-border">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-bg border border-border shadow-card ${colors.icon}`}>
              {React.createElement(tool.icon, { size: 22 })}
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-ink">
              {tool.name}
            </h1>
          </div>
          <p className="text-sm text-ink-muted leading-relaxed max-w-2xl mt-1">
            {tool.description}
          </p>
        </div>

        {/* Privacy badge */}
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-success/8 border border-success/25 rounded-xl shrink-0 self-start">
          <Shield size={15} className="text-success shrink-0" />
          <div className="flex flex-col">
            <span className="font-mono text-[9px] font-bold text-success uppercase tracking-wider leading-none">
              100% Local
            </span>
            <span className="text-[10px] text-ink-muted leading-tight mt-0.5">
              Files never leave your device
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Widget Container ── */}
      <main className="w-full bg-surface border border-border rounded-2xl p-5 md:p-7 shadow-card min-h-[300px] flex flex-col">
        {children}
      </main>

      {/* ── How It Works ── */}
      <div className="border border-border rounded-2xl bg-surface-raised p-5 md:p-6">
        <h2 className="flex items-center gap-2 font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-5">
          <BookOpen size={13} className="text-accent" />
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tool.instructions.map((step, i) => (
            <div key={i} className="flex gap-3 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
              <span className="font-mono text-xs font-bold text-accent bg-accent/10 border border-accent/20 w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <p className="text-xs text-ink-muted leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Privacy Details ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: <Cpu size={15} />, title: 'Local Processing', body: 'All operations run inside your browser using JavaScript libraries — nothing is sent over the network.' },
          { icon: <HardDrive size={15} />, title: 'Zero Uploads', body: 'Disconnect from the internet and this tool will still work perfectly — proof of client-side processing.' },
          { icon: <Lock size={15} />, title: 'No Data Logged', body: 'No accounts, no telemetry, no analytics. Your files and actions are entirely private.' },
        ].map(({ icon, title, body }) => (
          <div key={title} className="flex gap-3 p-4 bg-surface border border-border rounded-xl">
            <div className="text-success shrink-0 mt-0.5">{icon}</div>
            <div>
              <h3 className="font-mono text-[10px] font-medium text-ink uppercase tracking-wider">{title}</h3>
              <p className="text-[11px] text-ink-muted leading-relaxed mt-1">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── FAQs ── */}
      <FAQBlock faqs={tool.faqs} />
    </div>
  );
};

export default ToolPageLayout;
