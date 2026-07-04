import React, { useState, useEffect, useCallback } from 'react';
import { Copy, RefreshCw, Check, ShieldCheck, ShieldAlert } from 'lucide-react';

export const PasswordGenerator: React.FC = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = useCallback(() => {
    let charset = '';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?~`';

    if (!charset) {
      setPassword('');
      return;
    }

    let generated = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      generated += charset[array[i] % charset.length];
    }

    setPassword(generated);
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  // Generate on mount or setting change
  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Strength calculator based on entropy: E = L * log2(Pool)
  const getStrengthMetrics = () => {
    if (!password) return { label: 'EMPTY', color: 'text-danger bg-danger/10 border-danger/20', percent: 0 };
    
    let pool = 0;
    if (includeLowercase) pool += 26;
    if (includeUppercase) pool += 26;
    if (includeNumbers) pool += 10;
    if (includeSymbols) pool += 28;

    const entropy = length * Math.log2(pool);
    
    if (entropy < 40) {
      return { label: 'WEAK', color: 'text-danger bg-danger/10 border-danger/20', percent: 25 };
    } else if (entropy < 65) {
      return { label: 'MODERATE', color: 'text-accent bg-accent/10 border-accent/20', percent: 50 };
    } else if (entropy < 90) {
      return { label: 'STRONG', color: 'text-accent-secondary bg-accent-secondary/10 border-accent-secondary/20', percent: 75 };
    } else {
      return { label: 'WORKBENCH SECURE', color: 'text-accent-secondary bg-accent-secondary/20 border-accent-secondary/30 font-bold', percent: 100 };
    }
  };

  const strength = getStrengthMetrics();

  return (
    <div className="flex flex-col gap-6 font-sans max-w-xl mx-auto">
      {/* Output Panel */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Generated Password /</span>
        <div className="relative flex items-center bg-bg border border-border rounded p-4 select-all overflow-x-auto min-h-[56px] pr-20">
          <span className="font-mono text-base font-bold text-ink tracking-wide block truncate w-full">
            {password || <span className="text-ink-muted font-normal italic">[Select at least one set]</span>}
          </span>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-bg pl-2">
            <button
              onClick={generatePassword}
              disabled={!password}
              className="p-2 text-ink-muted hover:text-ink hover:bg-border/30 rounded transition-colors"
              title="Regenerate"
              aria-label="Regenerate password"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={handleCopy}
              disabled={!password}
              className="p-2 text-ink-muted hover:text-accent hover:bg-border/30 rounded transition-colors"
              title="Copy Password"
              aria-label="Copy password"
            >
              {copied ? <Check size={14} className="text-accent-secondary" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Strength indicator */}
      {password && (
        <div className="flex items-center justify-between border border-border rounded p-3 bg-surface">
          <div className="flex items-center gap-2">
            {strength.percent >= 75 ? (
              <ShieldCheck size={16} className="text-accent-secondary" />
            ) : (
              <ShieldAlert size={16} className="text-danger" />
            )}
            <span className="text-xs font-semibold text-ink">Entropy Strength:</span>
          </div>
          <div className={`px-2.5 py-0.5 border rounded text-[10px] font-mono tracking-wider ${strength.color}`}>
            {strength.label}
          </div>
        </div>
      )}

      {/* Settings Grid */}
      <div className="border-t border-border pt-4 flex flex-col gap-4">
        {/* Length Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="length-slider" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Password Length /</label>
            <span className="font-mono text-xs font-bold text-accent bg-bg border border-border px-2 py-0.5 rounded">
              {length} chars
            </span>
          </div>
          <input
            id="length-slider"
            type="range"
            min="8"
            max="64"
            value={length}
            onChange={e => setLength(parseInt(e.target.value))}
            className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
          />
        </div>

        {/* Checkbox settings */}
        <div className="grid grid-cols-2 gap-3 mt-1">
          <label className="flex items-center gap-2 cursor-pointer border border-border p-3 rounded hover:bg-bg/50 select-none">
            <input
              type="checkbox"
              checked={includeLowercase}
              onChange={e => setIncludeLowercase(e.target.checked)}
              className="rounded border-border text-accent focus:ring-accent w-4 h-4 cursor-pointer"
            />
            <span className="text-xs text-ink">a-z (Lowercase)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer border border-border p-3 rounded hover:bg-bg/50 select-none">
            <input
              type="checkbox"
              checked={includeUppercase}
              onChange={e => setIncludeUppercase(e.target.checked)}
              className="rounded border-border text-accent focus:ring-accent w-4 h-4 cursor-pointer"
            />
            <span className="text-xs text-ink">A-Z (Uppercase)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer border border-border p-3 rounded hover:bg-bg/50 select-none">
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={e => setIncludeNumbers(e.target.checked)}
              className="rounded border-border text-accent focus:ring-accent w-4 h-4 cursor-pointer"
            />
            <span className="text-xs text-ink">0-9 (Numbers)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer border border-border p-3 rounded hover:bg-bg/50 select-none">
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={e => setIncludeSymbols(e.target.checked)}
              className="rounded border-border text-accent focus:ring-accent w-4 h-4 cursor-pointer"
            />
            <span className="text-xs text-ink">!@#$ (Symbols)</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default PasswordGenerator;
