import React, { useState } from 'react';
import { Copy, Trash2, Check } from 'lucide-react';

export const WordCharacterCounter: React.FC = () => {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const charCountWithSpaces = text.length;
  const charCountWithoutSpaces = text.replace(/\s/g, '').length;
  
  // Word count logic
  const wordCount = text
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0).length;

  // Sentence count logic (split by ., !, ?)
  const sentenceCount = text
    .split(/[.!?]+/)
    .filter(s => s.trim().length > 0).length;

  // Paragraph count logic (split by double line breaks)
  const paragraphCount = text
    .split(/\n+/)
    .filter(p => p.trim().length > 0).length;

  // Reading time (average 200 words per minute)
  const readingTime = Math.ceil(wordCount / 200);

  // Word density analysis
  const getWordDensity = () => {
    const cleanText = text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '');
    const words = cleanText.split(/\s+/).filter(w => w.length > 3); // filter words shorter than 4 chars
    const freqMap: { [key: string]: number } = {};
    
    words.forEach(w => {
      freqMap[w] = (freqMap[w] || 0) + 1;
    });

    return Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // top 5
  };

  const densities = getWordDensity();

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Telemetry panel (top) */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-bg border border-border rounded p-3 text-center">
          <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider block">Words</span>
          <span className="text-lg font-bold text-ink block mt-1">{wordCount}</span>
        </div>
        <div className="bg-bg border border-border rounded p-3 text-center">
          <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider block">Characters</span>
          <span className="text-lg font-bold text-ink block mt-1">{charCountWithSpaces}</span>
        </div>
        <div className="bg-bg border border-border rounded p-3 text-center">
          <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider block">Chars (No Spaces)</span>
          <span className="text-lg font-bold text-ink block mt-1">{charCountWithoutSpaces}</span>
        </div>
        <div className="bg-bg border border-border rounded p-3 text-center">
          <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider block">Sentences</span>
          <span className="text-lg font-bold text-ink block mt-1">{sentenceCount}</span>
        </div>
        <div className="bg-bg border border-border rounded p-3 text-center">
          <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider block">Paragraphs</span>
          <span className="text-lg font-bold text-ink block mt-1">{paragraphCount}</span>
        </div>
        <div className="bg-bg border border-border rounded p-3 text-center col-span-2 sm:col-span-1">
          <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider block">Read Time</span>
          <span className="text-lg font-bold text-ink block mt-1">
            {readingTime} {readingTime === 1 ? 'min' : 'mins'}
          </span>
        </div>
      </div>

      {/* Editor box */}
      <div className="flex flex-col gap-2 relative">
        <label htmlFor="counter-textarea" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
          Source Text Workspace /
        </label>
        <textarea
          id="counter-textarea"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste or type your content here to inspect metrics..."
          className="w-full min-h-[250px] p-4 bg-bg border border-border rounded text-sm text-ink placeholder-ink-muted outline-none focus:border-accent resize-y font-sans leading-relaxed"
        />

        {/* Floating Quick Actions */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {text.trim() && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 bg-surface border border-border rounded hover:border-accent text-ink hover:text-accent flex items-center gap-1 text-xs transition-colors shadow-sm font-mono text-[9px] uppercase tracking-wider"
                title="Copy Workspace"
              >
                {copied ? <Check size={12} className="text-accent-secondary" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={() => setText('')}
                className="p-1.5 bg-surface border border-border rounded hover:border-danger text-ink hover:text-danger flex items-center gap-1 text-xs transition-colors shadow-sm font-mono text-[9px] uppercase tracking-wider"
                title="Clear Workspace"
              >
                <Trash2 size={12} />
                <span>Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Auxiliary word analysis (Word density) */}
      {text.trim().length > 10 && densities.length > 0 && (
        <div className="border border-border/70 rounded p-4 bg-bg/25">
          <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-3">
            Word Frequency Analyzer (4+ letters) /
          </h4>
          <div className="flex flex-wrap gap-2">
            {densities.map(([word, freq]) => (
              <div
                key={word}
                className="bg-surface border border-border rounded px-2.5 py-1 flex items-center gap-2 text-xs"
              >
                <span className="font-semibold text-ink">{word}</span>
                <span className="font-mono text-[10px] text-ink-muted bg-bg border border-border px-1.5 py-0.2 rounded font-bold">
                  {freq}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordCharacterCounter;
