import React, { useEffect } from 'react';
import { ShieldCheck, Cpu, HardDrive, Lock, ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toolsRegistry } from '../data/toolsRegistry';

export const About: React.FC = () => {
  useEffect(() => {
    document.title = 'Privacy & Security | NutterTools';
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
          <div className="p-2.5 rounded-xl bg-success/10 border border-success/25">
            <ShieldCheck size={22} className="text-success" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink tracking-tight">
            Privacy & Security
          </h1>
        </div>
        <p className="text-sm text-ink-muted leading-relaxed max-w-lg">
          NutterTools is built on one core principle: your files never touch a server.
          Here's exactly how that works.
        </p>
      </div>

      {/* Main guarantee */}
      <section className="bg-surface border border-border rounded-2xl p-6 md:p-8 flex flex-col gap-5 shadow-card">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-[10px] text-accent uppercase tracking-widest">The Guarantee</span>
        </div>

        <h2 className="font-display text-xl md:text-2xl font-bold text-ink">
          Your files never leave your device. Ever.
        </h2>

        <p className="text-sm text-ink-muted leading-relaxed">
          Traditional online file tools upload your documents to remote servers, process them somewhere in a data centre you don't control, and return the result. That means your private contracts, photos, tax documents, and passwords are all travelling across the internet to systems operated by strangers.
        </p>
        <p className="text-sm text-ink-muted leading-relaxed">
          <strong className="text-ink font-semibold">NutterTools works differently.</strong> Every single operation — merging, compressing, converting, encrypting — runs entirely inside your browser's JavaScript engine. Files are read directly from your disk into browser memory, modified locally, and saved directly back to your disk. Zero network traffic during any file operation.
        </p>

        {/* 3 feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {[
            {
              icon: <Cpu size={18} className="text-accent" />,
              title: 'Local Processing',
              body: 'Client-side JavaScript libraries and compiled WebAssembly binaries execute all conversions inside your browser window.',
            },
            {
              icon: <HardDrive size={18} className="text-accent" />,
              title: 'Zero Server Uploads',
              body: 'Disable your internet connection and every tool still works perfectly — that\'s how you know nothing is being sent.',
            },
            {
              icon: <Lock size={18} className="text-accent" />,
              title: 'No Data Logging',
              body: 'No accounts, no session tracking, no analytics on your files or usage. NutterTools doesn\'t even have a database.',
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="p-4 bg-bg border border-border rounded-xl flex flex-col gap-2">
              {icon}
              <h3 className="font-mono text-[10px] font-medium text-ink uppercase tracking-wider">{title}</h3>
              <p className="text-[11px] text-ink-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Verification steps */}
      <section className="bg-surface border border-border rounded-2xl p-6 md:p-8 flex flex-col gap-4 shadow-card">
        <h2 className="font-display text-lg font-bold text-ink">Verify it yourself</h2>
        <p className="text-sm text-ink-muted">Don't just take our word for it. Here's how to confirm no data is leaving your machine:</p>

        <ol className="flex flex-col gap-3">
          {[
            <>Open any tool, like <Link to="/merge-pdf" className="text-accent hover:underline font-medium">Merge PDF</Link>.</>,
            <>Press <kbd className="px-2 py-0.5 bg-bg border border-border rounded text-[11px] font-mono">F12</kbd> to open DevTools and switch to the <strong>Network</strong> tab.</>,
            <>Upload and process a file. Watch the Network tab — <strong className="text-ink">you'll see zero requests to any server</strong>.</>,
            <>Alternatively, turn off your Wi-Fi/ethernet, reload the page, and try any tool. They all work fully offline.</>,
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink-muted">
              <span className="font-mono text-xs font-bold text-accent bg-accent/10 border border-accent/20 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Back CTA */}
      <div className="flex justify-center pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white border border-accent 
            font-mono text-xs uppercase tracking-wider font-semibold hover:bg-accent-hover transition-colors shadow-sm
            hover:shadow-[0_4px_16px_rgba(255,92,0,0.35)] btn-press"
        >
          Explore All {toolsRegistry.length} Tools
          <ExternalLink size={13} />
        </Link>
      </div>
    </div>
  );
};

export default About;
