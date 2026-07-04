import React, { useState } from 'react';
import { Copy, Trash2, Check, ArrowRightLeft } from 'lucide-react';

export const TextCaseConverter: React.FC = () => {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Transformation helpers
  const toUppercase = () => {
    setText(prev => prev.toUpperCase());
  };

  const toLowercase = () => {
    setText(prev => prev.toLowerCase());
  };

  const toTitleCase = () => {
    setText(prev => {
      return prev.replace(/\b[a-z]/gi, char => char.toUpperCase());
    });
  };

  const toSentenceCase = () => {
    setText(prev => {
      // Split by sentence delimiters, capitalize first non-space char of each sentence
      return prev.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, char => char.toUpperCase());
    });
  };

  const toCamelCase = () => {
    setText(prev => {
      const words = prev.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
      if (words.length === 0 || words[0] === '') return '';
      return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    });
  };

  const toSnakeCase = () => {
    setText(prev => {
      return prev
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');
    });
  };

  const toKebabCase = () => {
    setText(prev => {
      return prev
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    });
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-2 relative">
        <label htmlFor="case-textarea" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
          Source Text /
        </label>
        <textarea
          id="case-textarea"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Enter text to format..."
          className="w-full min-h-[220px] p-4 bg-bg border border-border rounded text-sm text-ink placeholder-ink-muted outline-none focus:border-accent resize-y font-sans leading-relaxed"
        />

        {/* Action icons */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {text.trim() && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 bg-surface border border-border rounded hover:border-accent text-ink hover:text-accent flex items-center gap-1 text-xs transition-colors shadow-sm font-mono text-[9px] uppercase tracking-wider"
                title="Copy Result"
              >
                {copied ? <Check size={12} className="text-accent-secondary" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={() => setText('')}
                className="p-1.5 bg-surface border border-border rounded hover:border-danger text-ink hover:text-danger flex items-center gap-1 text-xs transition-colors shadow-sm font-mono text-[9px] uppercase tracking-wider"
                title="Clear"
              >
                <Trash2 size={12} />
                <span>Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Conversion Actions (Grid) */}
      <div className="border-t border-border pt-4 flex flex-col gap-3">
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider flex items-center gap-1">
          <ArrowRightLeft size={10} />
          Convert Case Actions /
        </span>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
          <button
            type="button"
            onClick={toUppercase}
            disabled={!text.trim()}
            className="px-3 py-2 border border-border rounded hover:border-accent hover:text-accent bg-surface transition-colors uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            UPPERCASE
          </button>
          <button
            type="button"
            onClick={toLowercase}
            disabled={!text.trim()}
            className="px-3 py-2 border border-border rounded hover:border-accent hover:text-accent bg-surface transition-colors uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            lowercase
          </button>
          <button
            type="button"
            onClick={toTitleCase}
            disabled={!text.trim()}
            className="px-3 py-2 border border-border rounded hover:border-accent hover:text-accent bg-surface transition-colors uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Title Case
          </button>
          <button
            type="button"
            onClick={toSentenceCase}
            disabled={!text.trim()}
            className="px-3 py-2 border border-border rounded hover:border-accent hover:text-accent bg-surface transition-colors uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sentence case
          </button>
          <button
            type="button"
            onClick={toCamelCase}
            disabled={!text.trim()}
            className="px-3 py-2 border border-border rounded hover:border-accent hover:text-accent bg-surface transition-colors uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            camelCase
          </button>
          <button
            type="button"
            onClick={toSnakeCase}
            disabled={!text.trim()}
            className="px-3 py-2 border border-border rounded hover:border-accent hover:text-accent bg-surface transition-colors uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            snake_case
          </button>
          <button
            type="button"
            onClick={toKebabCase}
            disabled={!text.trim()}
            className="px-3 py-2 border border-border rounded hover:border-accent hover:text-accent bg-surface transition-colors uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            kebab-case
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextCaseConverter;
