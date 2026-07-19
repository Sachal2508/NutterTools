import React, { useState } from 'react';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob } from '../../../lib/fileHelper';
import { Fingerprint, Copy, ClipboardCheck } from 'lucide-react';

export const UuidGenerator: React.FC = () => {
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  
  const [uuids, setUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Generate cryptographically secure UUIDv4 in compliance with RFC 4122 standards
  const generateUuidV4 = (): string => {
    // Check for window.crypto API
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }

    // Fallback secure random byte generator
    const bytes = new Uint8Array(16);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 16; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }

    // Set standard version 4 and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC4122

    const byteToHex: string[] = [];
    for (let i = 0; i < 256; i++) {
      byteToHex.push((i + 0x100).toString(16).substr(1));
    }

    return (
      byteToHex[bytes[0]] + byteToHex[bytes[1]] + byteToHex[bytes[2]] + byteToHex[bytes[3]] + '-' +
      byteToHex[bytes[4]] + byteToHex[bytes[5]] + '-' +
      byteToHex[bytes[6]] + byteToHex[bytes[7]] + '-' +
      byteToHex[bytes[8]] + byteToHex[bytes[9]] + '-' +
      byteToHex[bytes[10]] + byteToHex[bytes[11]] + byteToHex[bytes[12]] + byteToHex[bytes[13]] + byteToHex[bytes[14]] + byteToHex[bytes[15]]
    );
  };

  const handleGenerate = () => {
    const list = [];
    for (let i = 0; i < count; i++) {
      let uuid = generateUuidV4();
      if (!hyphens) {
        uuid = uuid.replace(/-/g, '');
      }
      if (uppercase) {
        uuid = uuid.toUpperCase();
      }
      list.push(uuid);
    }
    setUuids(list);
  };

  const handleCopyAll = () => {
    if (uuids.length > 0) {
      navigator.clipboard.writeText(uuids.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (uuids.length > 0) {
      const blob = new Blob([uuids.join('\n')], { type: 'text/plain' });
      downloadBlob(blob, 'uuids.txt');
    }
  };

  const handleClear = () => {
    setUuids([]);
  };

  return (
    <div className="flex flex-col gap-4 font-sans">
      <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
        
        <div className="flex flex-wrap gap-3 items-center border-b border-border pb-2">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-ink-muted uppercase tracking-wider">
            <Fingerprint size={12} className="text-accent" /> UUID Generator Workbench /
          </span>

          {uuids.length > 0 && (
            <button
              type="button"
              onClick={handleCopyAll}
              className="flex items-center gap-1 px-3 py-1 border border-border text-[10px] uppercase font-mono tracking-wider text-ink-muted hover:text-ink hover:bg-bg rounded transition-colors ml-auto"
            >
              {copied ? (
                <>
                  <ClipboardCheck size={11} className="text-success" /> Copied All!
                </>
              ) : (
                <>
                  <Copy size={11} /> Copy All
                </>
              )}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9px] text-ink-muted uppercase">Quantity to Generate /</span>
            <input
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={e => setCount(Math.min(500, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-full px-3 py-1.5 border border-border bg-bg text-ink rounded text-xs focus:border-accent outline-none font-mono"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-ink-muted leading-relaxed sm:pt-6">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={e => setUppercase(e.target.checked)}
              className="w-4 h-4 border border-border rounded accent-accent bg-surface"
            />
            Uppercase formatting
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-ink-muted leading-relaxed sm:pt-6">
            <input
              type="checkbox"
              checked={hyphens}
              onChange={e => setHyphens(e.target.checked)}
              className="w-4 h-4 border border-border rounded accent-accent bg-surface"
            />
            Include Hyphens separation
          </label>
        </div>

        {uuids.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2 animate-fade-in">
            <span className="font-mono text-[9px] text-ink-muted uppercase">UUID list /</span>
            <textarea
              rows={8}
              readOnly
              value={uuids.join('\n')}
              onClick={(e) => (e.target as any).select()}
              className="w-full p-3 border border-border bg-bg text-ink rounded font-mono text-xs focus:border-accent outline-none resize-y leading-relaxed select-all"
            />
          </div>
        )}

        {copied && (
          <div className="text-center text-xs text-success bg-success/5 border border-success/20 p-2 rounded leading-none">
            All generated UUIDs copied to clipboard!
          </div>
        )}

        <div className="flex justify-between items-center border-t border-border pt-4 mt-1">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase hover:text-ink hover:bg-bg transition-colors"
          >
            Clear List
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase hover:text-ink hover:bg-bg transition-colors"
            >
              Generate UUIDs
            </button>
            <DownloadButton onClick={handleDownload} label="Export as Text (.txt)" disabled={uuids.length === 0} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default UuidGenerator;
