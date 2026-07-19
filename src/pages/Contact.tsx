import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Code2, Camera, Briefcase, Mail,
  ExternalLink, MessageCircle, User, Sparkles,
} from 'lucide-react';

interface ContactLink {
  icon: React.ElementType;
  label: string;
  value: string;
  href: string;
  color: string;
  glow: string;
  gradient: string;
}

const LINKS: ContactLink[] = [
  {
    icon: Code2,
    label: 'GitHub',
    value: 'Sachal2508',
    href: 'https://github.com/Sachal2508',
    color: 'text-ink',
    glow: 'hover:shadow-[0_12px_32px_rgba(30,30,30,0.25)] dark:hover:shadow-[0_12px_32px_rgba(200,200,200,0.12)]',
    gradient: 'from-ink/5 via-ink/3 to-transparent dark:from-white/5 dark:via-white/2',
  },
  {
    icon: Camera,
    label: 'Instagram',
    value: '@muhammad.sachal.773',
    href: 'https://www.instagram.com/muhammad.sachal.773',
    color: 'text-pink-500',
    glow: 'hover:shadow-[0_12px_32px_rgba(236,72,153,0.22)]',
    gradient: 'from-pink-500/12 via-purple-500/5 to-transparent',
  },
  {
    icon: Briefcase,
    label: 'LinkedIn',
    value: 'muhammad-sachal',
    href: 'https://www.linkedin.com/in/muhammad-sachal-9a929136a/',
    color: 'text-sky-500',
    glow: 'hover:shadow-[0_12px_32px_rgba(14,165,233,0.22)]',
    gradient: 'from-sky-500/12 via-sky-500/5 to-transparent',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'sachalkool@gmail.com',
    href: 'mailto:sachalkool@gmail.com',
    color: 'text-accent',
    glow: 'hover:shadow-[0_12px_32px_rgba(255,92,0,0.22)]',
    gradient: 'from-accent/12 via-accent/5 to-transparent',
  },
];

export const Contact: React.FC = () => {
  useEffect(() => {
    document.title = 'Contact | NutterTools';
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="page-enter max-w-3xl mx-auto py-8 md:py-12 px-4 sm:px-6 flex flex-col gap-8">

      {/* Breadcrumb */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent transition-colors font-medium w-fit btn-press"
      >
        <ArrowLeft size={14} />
        All Tools
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3 pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/25">
            <MessageCircle size={22} className="text-accent" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink tracking-tight">
            Contact
          </h1>
        </div>
        <p className="text-sm text-ink-muted leading-relaxed max-w-lg">
          Built by a developer, for everyone. Reach out for feedback, collaboration ideas, or just to say hi.
        </p>
      </div>

      {/* Author card */}
      <section className="bg-surface border border-border rounded-2xl p-6 md:p-8 flex flex-col gap-5 shadow-card">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-[10px] text-accent uppercase tracking-widest">Creator</span>
        </div>

        {/* Name + avatar area */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <User size={24} className="text-accent" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Muhammad Sachal</h2>
            <p className="text-sm text-ink-muted mt-0.5">
              Frontend Developer &amp; Creator of NutterTools
            </p>
          </div>
        </div>

        <p className="text-sm text-ink-muted leading-relaxed border-t border-border pt-4">
          NutterTools was built with the belief that powerful file processing tools should be
          <strong className="text-ink font-semibold"> free, fast, private, and accessible</strong> to everyone —
          without sending your files anywhere. Every tool runs 100% inside your browser.
        </p>

        {/* Feature callout */}
        <div className="flex items-start gap-3 p-3 bg-bg border border-border rounded-xl">
          <Sparkles size={16} className="text-accent mt-0.5 shrink-0" />
          <p className="text-xs text-ink-muted leading-relaxed">
            Open to suggestions, bug reports, and feature requests. Feel free to open an issue on GitHub or reach out directly.
          </p>
        </div>
      </section>

      {/* Contact Links grid */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold text-ink">Get in Touch</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LINKS.map(link => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith('mailto') ? undefined : '_blank'}
                rel="noopener noreferrer"
                className={`group relative flex items-center gap-4 p-4 bg-surface border border-border rounded-xl
                  overflow-hidden card-hover active:scale-[0.97] transition-all duration-250
                  hover:border-border-strong ${link.glow}`}
              >
                {/* Gradient wash */}
                <div className={`absolute inset-0 bg-gradient-to-r ${link.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                {/* Icon */}
                <div className={`relative z-10 p-2.5 rounded-xl bg-bg border border-border group-hover:scale-110 group-hover:border-transparent transition-all duration-200 ${link.color}`}>
                  <Icon size={18} />
                </div>

                {/* Text */}
                <div className="relative z-10 flex flex-col min-w-0">
                  <span className="font-mono text-[9px] text-ink-muted uppercase tracking-widest">{link.label}</span>
                  <span className="text-sm font-semibold text-ink truncate mt-0.5">{link.value}</span>
                </div>

                {/* Arrow */}
                <ExternalLink
                  size={13}
                  className="relative z-10 ml-auto shrink-0 text-ink-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
                />
              </a>
            );
          })}
        </div>
      </section>

      {/* Back CTA */}
      <div className="flex justify-center pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white border border-accent
            font-mono text-xs uppercase tracking-wider font-semibold hover:bg-accent-hover transition-colors shadow-sm
            hover:shadow-[0_4px_16px_rgba(255,92,0,0.35)] btn-press"
        >
          Explore All Tools
          <ExternalLink size={13} />
        </Link>
      </div>
    </div>
  );
};

export default Contact;
