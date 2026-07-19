import React, { useState } from 'react';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob } from '../../../lib/fileHelper';
import { Code, Image, Copy, ClipboardCheck, ArrowRightLeft } from 'lucide-react';

export const ImageBase64: React.FC = () => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  
  // Encoding state
  const [file, setFile] = useState<File | null>(null);
  const [base64String, setBase64String] = useState('');
  const [copied, setCopied] = useState(false);

  // Decoding state
  const [decodedSrc, setDecodedSrc] = useState<string | null>(null);
  const [pasteString, setPasteString] = useState('');

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      const f = files[0];
      setFile(f);
      setBase64String('');
      const reader = new FileReader();
      reader.onload = () => {
        setBase64String(reader.result as string);
      };
      reader.readAsDataURL(f);
    }
  };

  const handleCopyBase64 = () => {
    if (base64String) {
      navigator.clipboard.writeText(base64String);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDecode = () => {
    const rawVal = pasteString.trim();
    if (!rawVal) return;

    // Basic validation / prepending header if missing
    if (rawVal.startsWith('data:image/')) {
      setDecodedSrc(rawVal);
    } else {
      // Guess standard png if missing data uri scheme headers
      setDecodedSrc(`data:image/png;base64,${rawVal}`);
    }
  };

  const handleDownloadDecoded = () => {
    if (!decodedSrc) return;
    
    try {
      const parts = decodedSrc.split(';base64,');
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);

      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }

      const blob = new Blob([uInt8Array as any], { type: contentType });
      const ext = contentType.split('/')[1] || 'png';
      downloadBlob(blob, `decoded-image.${ext}`);
    } catch (e) {
      alert('Invalid Base64 format string. Could not parse data.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setBase64String('');
    setDecodedSrc(null);
    setPasteString('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-4 border border-border rounded bg-surface p-4">
        <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2">
          Select Operation Mode /
        </h4>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => { setMode('encode'); handleReset(); }}
            className={`flex items-center gap-2 px-4 py-2 border rounded font-mono text-xs uppercase tracking-wider transition-colors ${
              mode === 'encode' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted bg-surface hover:text-ink'
            }`}
          >
            <Code size={13} /> Encode Image to Base64
          </button>
          <button
            type="button"
            onClick={() => { setMode('decode'); handleReset(); }}
            className={`flex items-center gap-2 px-4 py-2 border rounded font-mono text-xs uppercase tracking-wider transition-colors ${
              mode === 'decode' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted bg-surface hover:text-ink'
            }`}
          >
            <Image size={13} /> Decode Base64 to Image
          </button>
        </div>
      </div>

      {mode === 'encode' ? (
        <div className="flex flex-col gap-4">
          {!file ? (
            <DropZone accept="image/*" acceptLabel="Image to encode" onFilesAdded={handleFilesAdded} />
          ) : (
            <div className="flex flex-col gap-4 animate-fade-in">
              <FileCard file={file} index={0} totalFiles={1} onRemove={handleReset} />

              {base64String && (
                <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                      Base64 Data URI string /
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyBase64}
                      className="flex items-center gap-1 px-3 py-1 border border-border text-[10px] uppercase font-mono tracking-wider text-ink-muted hover:text-ink hover:bg-bg rounded transition-colors"
                    >
                      {copied ? (
                        <>
                          <ClipboardCheck size={11} className="text-success" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={11} /> Copy Code
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    readOnly
                    value={base64String}
                    onClick={(e) => (e.target as any).select()}
                    className="w-full p-3 border border-border bg-bg text-ink rounded font-mono text-[10px] focus:border-accent outline-none select-all resize-y leading-relaxed break-all"
                  />

                  {copied && (
                    <div className="text-center text-xs text-success bg-success/5 border border-success/20 p-2 rounded leading-none">
                      Copied Base64 data URI to clipboard successfully.
                    </div>
                  )}

                  <div className="flex gap-3 justify-end border-t border-border pt-4 mt-1">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase hover:text-ink hover:bg-bg transition-colors"
                    >
                      Start Over
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9px] text-ink-muted uppercase">Paste Base64 Code Block /</span>
            <textarea
              rows={6}
              placeholder="Paste data:image/png;base64,... code here"
              value={pasteString}
              onChange={e => { setPasteString(e.target.value); setDecodedSrc(null); }}
              className="w-full p-3 border border-border bg-bg text-ink rounded font-mono text-xs focus:border-accent outline-none resize-y leading-relaxed break-all"
            />
          </div>

          {!decodedSrc ? (
            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={handleDecode}
                disabled={!pasteString.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white font-mono text-xs uppercase tracking-wider rounded shadow hover:bg-accent-secondary transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <ArrowRightLeft size={13} /> Decode String
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 border-t border-border pt-4 items-center">
              <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider w-full text-left">
                Decoded Image Render /
              </span>

              <div className="relative border border-border/50 bg-black/5 rounded overflow-hidden aspect-[1.3/1] max-w-sm w-full flex items-center justify-center mt-2">
                <img src={decodedSrc} alt="Decoded preview" className="max-w-full max-h-full object-contain" />
              </div>

              <div className="flex gap-3 justify-center mt-2 border-t border-border pt-4 w-full">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownloadDecoded} label="Download Image" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageBase64;
