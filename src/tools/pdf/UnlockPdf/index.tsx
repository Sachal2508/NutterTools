import React, { useState } from 'react';
// @ts-ignore
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';
import { AlertCircle } from 'lucide-react';

export const UnlockPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [unlockedBlob, setUnlockedBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setUnlockedBlob(null);
      setErrorMsg(null);
      setPassword('');
    }
  };

  const handleUnlock = async () => {
    if (!file || !password) return;

    setIsProcessing(true);
    setProgress(30);
    setStatus('Loading secure file layers...');
    setErrorMsg(null);

    setTimeout(async () => {
      try {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        setProgress(60);
        setStatus('Decrypting PDF contents with password...');

        let decryptedBytes;
        try {
          decryptedBytes = await decryptPDF(uint8Array, password);
        } catch (loadErr: any) {
          const errMsg = loadErr.message || '';
          if (errMsg.includes('password') || errMsg.includes('decrypt') || errMsg.includes('Password')) {
            throw new Error('Incorrect password. Please verify the password and try again.');
          } else {
            throw new Error('This PDF uses an encryption standard not supported in this client environment, or the file is corrupted.');
          }
        }

        setProgress(85);
        setStatus('Generating password-free PDF archive...');

        const blob = new Blob([decryptedBytes] as any, { type: 'application/pdf' });

        setUnlockedBlob(blob);
        setProgress(100);
        setStatus('Unlock complete.');
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Failed to decrypt PDF. Check your password.');
        setProgress(0);
      } finally {
        setIsProcessing(false);
      }
    }, 200);
  };

  const handleDownload = () => {
    if (unlockedBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(unlockedBlob, `${baseName}-unlocked.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setUnlockedBlob(null);
    setErrorMsg(null);
    setPassword('');
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans max-w-md mx-auto">
      {!file ? (
        <DropZone accept="application/pdf" acceptLabel="Protected PDF file" onFilesAdded={handleFilesAdded} />
      ) : (
        <div className="flex flex-col gap-4">
          <FileCard file={file} index={0} totalFiles={1} onRemove={handleReset} />

          {!unlockedBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="unlock-pass" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  Enter Document Password /
                </label>
                <input
                  id="unlock-pass"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter PDF password"
                  className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent font-mono"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-danger/10 border border-danger/20 rounded text-xs text-danger flex items-start gap-2 font-sans">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton
                  onClick={handleUnlock}
                  label="Unlock PDF"
                  disabled={!password}
                />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {unlockedBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Unlock Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                Encryption restrictions removed. The file will no longer prompt for a password.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Unlocked PDF" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnlockPdf;
