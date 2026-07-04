import React from 'react';

interface ProgressBarProps {
  progress: number; // 0–100
  status: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, status }) => {
  const isComplete = progress >= 100;

  return (
    <div className="w-full flex flex-col gap-3 px-5 py-4 bg-surface border border-border rounded-2xl animate-bounce-in shadow-card">
      {/* Status row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {!isComplete ? (
            <span className="flex w-2 h-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-success shrink-0" />
          )}
          <span className="font-mono text-xs text-ink font-medium uppercase tracking-wider truncate">
            {status}
          </span>
        </div>
        <span className={`font-mono text-xs font-bold tabular-nums shrink-0 ${isComplete ? 'text-success' : 'text-accent'}`}>
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress track */}
      <div className="w-full h-2.5 bg-bg border border-border rounded-full overflow-hidden">
        {isComplete ? (
          <div
            className="h-full bg-success rounded-full transition-all duration-500 ease-out"
            style={{ width: '100%' }}
          />
        ) : (
          <div
            className="h-full rounded-full relative overflow-hidden transition-all duration-400 ease-out"
            style={{ width: `${progress}%`, background: 'var(--accent)' }}
          >
            {/* Shimmer overlay */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.6s linear infinite',
              }}
            />
          </div>
        )}
      </div>

      {/* Status hint */}
      <p className="font-mono text-[9px] text-ink-muted uppercase tracking-wider text-right">
        {isComplete ? '✓ Processing complete · Ready to download' : 'Processing in browser memory · No uploads'}
      </p>
    </div>
  );
};

export default ProgressBar;
