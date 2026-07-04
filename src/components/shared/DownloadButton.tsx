import React, { useState } from 'react';
import { Download, CheckCircle2 } from 'lucide-react';

interface DownloadButtonProps {
  onClick?: () => void;
  href?: string;
  download?: string;
  label: string;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  onClick,
  href,
  download,
  label,
  disabled = false,
  className = '',
  variant = 'primary',
}) => {
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    if (disabled || !onClick) return;
    setPressed(true);
    onClick();
    setTimeout(() => setPressed(false), 1800);
  };

  const base = `inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold 
    select-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent/50 outline-none
    btn-press`;

  const variants = {
    primary: disabled
      ? 'bg-border text-ink-muted border border-border cursor-not-allowed'
      : pressed
        ? 'bg-success text-white border border-success shadow-sm'
        : 'bg-accent text-white border border-accent hover:bg-accent-hover shadow-sm hover:shadow-[0_4px_16px_rgba(255,92,0,0.35)]',
    secondary: 'bg-surface border border-border text-ink hover:border-accent/60 hover:text-accent hover:bg-surface-raised',
  };

  const content = pressed ? (
    <>
      <CheckCircle2 size={14} className="animate-bounce-in" />
      <span>Done!</span>
    </>
  ) : (
    <>
      {variant === 'primary' && <Download size={14} />}
      <span>{label}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <a
        href={href}
        download={download}
        onClick={onClick}
        className={`${base} ${variants[variant]} ${className}`}
        id="file-download-button"
      >
        <Download size={14} />
        <span>{label}</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
      id="file-action-button"
    >
      {content}
    </button>
  );
};

export default DownloadButton;
