import React, { useState } from 'react';
import { GitCompare } from 'lucide-react';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  num?: number;
}

export const DiffChecker: React.FC = () => {
  const [textLeft, setTextLeft] = useState('NutterTools is client-side.\nIt is fast.\nIt runs in your browser.');
  const [textRight, setTextRight] = useState('NutterTools is 100% client-side.\nIt is extremely fast.\nIt runs locally in your browser.');
  
  const [leftLines, setLeftLines] = useState<DiffLine[]>([]);
  const [rightLines, setRightLines] = useState<DiffLine[]>([]);
  const [showDiff, setShowDiff] = useState(false);

  const calculateDiff = () => {
    const linesL = textLeft.split('\n');
    const linesR = textRight.split('\n');

    const leftResult: DiffLine[] = [];
    const rightResult: DiffLine[] = [];

    let i = 0, j = 0;
    while (i < linesL.length || j < linesR.length) {
      const lLine = linesL[i];
      const rLine = linesR[j];

      if (i < linesL.length && j < linesR.length) {
        if (lLine === rLine) {
          leftResult.push({ type: 'unchanged', value: lLine, num: i + 1 });
          rightResult.push({ type: 'unchanged', value: rLine, num: j + 1 });
          i++;
          j++;
        } else {
          // Check if it is an insertion or deletion
          // Lookahead to see if Right line appears later in Left (deletion) or vice versa
          const nextIndexInR = linesR.indexOf(lLine, j);
          const nextIndexInL = linesL.indexOf(rLine, i);

          if (nextIndexInR !== -1 && (nextIndexInL === -1 || nextIndexInR - j < nextIndexInL - i)) {
            // Insertion on Right: insert unchanged placeholders on Left
            while (j < nextIndexInR) {
              leftResult.push({ type: 'unchanged', value: ' ' });
              rightResult.push({ type: 'added', value: linesR[j], num: j + 1 });
              j++;
            }
          } else if (nextIndexInL !== -1) {
            // Deletion on Left: insert placeholder on Right
            while (i < nextIndexInL) {
              leftResult.push({ type: 'removed', value: linesL[i], num: i + 1 });
              rightResult.push({ type: 'unchanged', value: ' ' });
              i++;
            }
          } else {
            // Replace line: remove Left, add Right
            leftResult.push({ type: 'removed', value: lLine, num: i + 1 });
            rightResult.push({ type: 'added', value: rLine, num: j + 1 });
            i++;
            j++;
          }
        }
      } else if (i < linesL.length) {
        // Remaining lines on Left are deletions
        leftResult.push({ type: 'removed', value: linesL[i], num: i + 1 });
        rightResult.push({ type: 'unchanged', value: ' ' });
        i++;
      } else {
        // Remaining lines on Right are insertions
        leftResult.push({ type: 'unchanged', value: ' ' });
        rightResult.push({ type: 'added', value: linesR[j], num: j + 1 });
        j++;
      }
    }

    setLeftLines(leftResult);
    setRightLines(rightResult);
    setShowDiff(true);
  };

  const handleReset = () => {
    setShowDiff(false);
    setLeftLines([]);
    setRightLines([]);
  };

  return (
    <div className="flex flex-col gap-4 font-sans">
      {!showDiff ? (
        <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2">
            <GitCompare size={12} className="text-accent" /> Diff Checker Workbench /
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[9px] text-ink-muted uppercase">Original Text (Left) /</span>
              <textarea
                rows={10}
                value={textLeft}
                onChange={e => setTextLeft(e.target.value)}
                className="w-full p-3 border border-border bg-bg text-ink rounded font-mono text-xs focus:border-accent outline-none resize-y leading-relaxed"
                placeholder="Paste original text here..."
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[9px] text-ink-muted uppercase">Modified Text (Right) /</span>
              <textarea
                rows={10}
                value={textRight}
                onChange={e => setTextRight(e.target.value)}
                className="w-full p-3 border border-border bg-bg text-ink rounded font-mono text-xs focus:border-accent outline-none resize-y leading-relaxed"
                placeholder="Paste modified text here..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => { setTextLeft(''); setTextRight(''); }}
              className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase hover:text-ink hover:bg-bg transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={calculateDiff}
              className="px-5 py-2 bg-accent text-white font-mono text-xs uppercase tracking-wider rounded shadow hover:bg-accent-secondary transition-colors"
            >
              Compare Text
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
              Comparison Results /
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1 border border-border text-[10px] uppercase font-mono tracking-wider text-ink-muted hover:text-ink hover:bg-bg rounded transition-colors"
            >
              Edit Texts
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-border/80 rounded bg-bg overflow-x-auto select-none">
            
            {/* Left Result (Removed/Unchanged) */}
            <div className="flex flex-col border-r border-border/50 font-mono text-xs leading-relaxed max-h-96 overflow-y-auto pr-1">
              <div className="bg-surface p-1.5 border-b border-border text-[9px] text-ink-muted uppercase font-bold tracking-wider">Original side</div>
              {leftLines.map((line, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start px-2 py-0.5 border-b border-border/10 ${
                    line.type === 'removed' ? 'bg-error/10 text-error-dark' : 'text-ink-muted'
                  }`}
                >
                  <span className="w-8 shrink-0 text-[10px] text-ink-muted/50 border-r border-border/20 pr-1.5 text-right select-none">{line.num || ''}</span>
                  <span className="pl-2 whitespace-pre-wrap break-all">{line.value}</span>
                </div>
              ))}
            </div>

            {/* Right Result (Added/Unchanged) */}
            <div className="flex flex-col font-mono text-xs leading-relaxed max-h-96 overflow-y-auto pr-1">
              <div className="bg-surface p-1.5 border-b border-border text-[9px] text-ink-muted uppercase font-bold tracking-wider">Modified side</div>
              {rightLines.map((line, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start px-2 py-0.5 border-b border-border/10 ${
                    line.type === 'added' ? 'bg-success/10 text-success-dark font-bold' : 'text-ink'
                  }`}
                >
                  <span className="w-8 shrink-0 text-[10px] text-ink-muted/50 border-r border-border/20 pr-1.5 text-right select-none">{line.num || ''}</span>
                  <span className="pl-2 whitespace-pre-wrap break-all">{line.value}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default DiffChecker;
