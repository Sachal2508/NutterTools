import React, { useState } from 'react';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob } from '../../../lib/fileHelper';
import { Braces, Minimize2, Copy, ClipboardCheck, AlertCircle } from 'lucide-react';

export const JsonFormatter: React.FC = () => {
  const [jsonText, setJsonText] = useState('{"name":"NutterTools","features":["100% Client-side","Fast","Secure"],"meta":{"active":true,"version":2}}');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setValidationError(null);
    } catch (err: any) {
      setValidationError(err.message || 'Invalid JSON syntax structure.');
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed));
      setValidationError(null);
    } catch (err: any) {
      setValidationError(err.message || 'Invalid JSON syntax structure.');
    }
  };

  const handleValidate = () => {
    try {
      JSON.parse(jsonText);
      setValidationError(null);
      alert('Valid JSON format!');
    } catch (err: any) {
      setValidationError(err.message || 'Invalid JSON syntax structure.');
    }
  };

  const handleCopy = () => {
    if (jsonText) {
      navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (jsonText) {
      const blob = new Blob([jsonText], { type: 'application/json' });
      downloadBlob(blob, 'formatted-data.json');
    }
  };

  const handleClear = () => {
    setJsonText('');
    setValidationError(null);
  };

  return (
    <div className="flex flex-col gap-4 font-sans">
      <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
        <div className="flex flex-wrap gap-3 items-center border-b border-border pb-2">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-ink-muted uppercase tracking-wider">
            <Braces size={12} className="text-accent" /> JSON Workbench /
          </span>

          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={handleFormat}
              className="px-3 py-1 bg-accent text-white font-mono text-[10px] uppercase tracking-wider rounded hover:bg-accent-secondary transition-colors"
            >
              Format JSON
            </button>
            <button
              type="button"
              onClick={handleMinify}
              className="flex items-center gap-1 px-3 py-1 border border-border text-[10px] uppercase font-mono tracking-wider text-ink-muted hover:text-ink hover:bg-bg rounded transition-colors"
            >
              <Minimize2 size={10} /> Minify
            </button>
            <button
              type="button"
              onClick={handleValidate}
              className="px-3 py-1 border border-border text-[10px] uppercase font-mono tracking-wider text-ink-muted hover:text-ink hover:bg-bg rounded transition-colors"
            >
              Validate
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 border border-border text-[10px] uppercase font-mono tracking-wider text-ink-muted hover:text-ink hover:bg-bg rounded transition-colors"
            >
              {copied ? <ClipboardCheck size={11} className="text-success" /> : <Copy size={11} />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <textarea
            rows={14}
            value={jsonText}
            onChange={e => { setJsonText(e.target.value); setValidationError(null); }}
            className="w-full p-3 border border-border bg-bg text-ink rounded font-mono text-xs focus:border-accent outline-none resize-y leading-relaxed"
            placeholder="Paste your raw JSON content here..."
          />
        </div>

        {validationError && (
          <div className="flex items-start gap-2 p-3 bg-error/5 border border-error/20 rounded text-xs text-error font-mono leading-relaxed">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <div>
              <span className="font-bold">JSON Syntax Error:</span>
              <p className="mt-0.5">{validationError}</p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center border-t border-border pt-4 mt-1">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase hover:text-ink hover:bg-bg transition-colors"
          >
            Clear Editor
          </button>
          <DownloadButton onClick={handleDownload} label="Download JSON" disabled={!jsonText.trim() || !!validationError} />
        </div>
      </div>
    </div>
  );
};

export default JsonFormatter;
