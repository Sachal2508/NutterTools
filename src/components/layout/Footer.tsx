import React from 'react';
import { Link } from 'react-router-dom';
import { toolsRegistry } from '../../data/toolsRegistry';
import { Zap } from 'lucide-react';

const NutterLogo: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="var(--accent)" />
    <path d="M8 23V9h3.2l7.2 9.2V9H22v14h-3.2L11.4 13.8V23H8Z" fill="white" />
    <circle cx="25" cy="9" r="2.5" fill="white" fillOpacity="0.7" />
  </svg>
);

export const Footer: React.FC = () => {
  const pdfTools = toolsRegistry.filter(t => t.category === 'pdf');
  const imageTools = toolsRegistry.filter(t => t.category === 'image');
  const utilityTools = toolsRegistry.filter(t => t.category === 'utility');

  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">

          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2 group w-fit">
              <NutterLogo />
              <span className="font-display text-base font-bold text-ink group-hover:text-accent transition-colors">
                NutterTools
              </span>
            </Link>
            <p className="text-xs text-ink-muted leading-relaxed font-sans max-w-[220px]">
              {toolsRegistry.length} powerful file utility tools running 100% locally in your browser. Your files never touch a server.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-ink-muted uppercase tracking-wider">
              <Zap size={10} className="text-accent" />
              <span>Client-Side Only · No Uploads · No Logs</span>
            </div>
            <div className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mt-auto">
              © {new Date().getFullYear()} NutterTools
            </div>
          </div>

          {/* PDF Column */}
          <div>
            <h3 className="font-mono text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-4 pb-2 border-b border-border">
              PDF Tools
            </h3>
            <ul className="space-y-2">
              {pdfTools.slice(0, 7).map(t => (
                <li key={t.id}>
                  <Link
                    to={t.route}
                    className="text-xs text-ink-muted hover:text-accent transition-colors hover:translate-x-0.5 inline-block"
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
              {pdfTools.length > 7 && (
                <li>
                  <Link
                    to="/"
                    className="text-[10px] font-mono text-accent hover:underline uppercase tracking-wider"
                  >
                    +{pdfTools.length - 7} more →
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Image Column */}
          <div>
            <h3 className="font-mono text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-4 pb-2 border-b border-border">
              Image Tools
            </h3>
            <ul className="space-y-2">
              {imageTools.map(t => (
                <li key={t.id}>
                  <Link
                    to={t.route}
                    className="text-xs text-ink-muted hover:text-accent transition-colors hover:translate-x-0.5 inline-block"
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Utility + Legal Column */}
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="font-mono text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-4 pb-2 border-b border-border">
                Utilities
              </h3>
              <ul className="space-y-2">
                {utilityTools.map(t => (
                  <li key={t.id}>
                    <Link
                      to={t.route}
                      className="text-xs text-ink-muted hover:text-accent transition-colors hover:translate-x-0.5 inline-block"
                    >
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-4 pb-2 border-b border-border">
                Legal
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/about"
                    className="text-xs text-ink-muted hover:text-accent transition-colors"
                  >
                    Privacy &amp; Security
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-xs text-ink-muted hover:text-accent transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
