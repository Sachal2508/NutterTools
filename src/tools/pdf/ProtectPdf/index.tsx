import React, { useState } from 'react';
// @ts-ignore
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';
import { AlertCircle } from 'lucide-react';

export const ProtectPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [protectedBlob, setProtectedBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setProtectedBlob(null);
      setErrorMsg(null);
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleProtect = async () => {
    if (!file || !password) return;

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-type.');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('Password should be at least 4 characters long.');
      return;
    }

    setIsProcessing(true);
    setProgress(30);
    setStatus('Loading workspace PDF...');
    setErrorMsg(null);

    setTimeout(async () => {
      try {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const uint8Array = new Uint8Array(arrayBuffer);

        setProgress(60);
        setStatus('Applying secure encryption layers...');

        // Encrypt the PDF locally
        const encryptedBytes = await encryptPDF(uint8Array, password);

        setProgress(85);
        setStatus('Compiling encrypted PDF file...');

        const blob = new Blob([encryptedBytes] as any, { type: 'application/pdf' });
        setProtectedBlob(blob);
        setProgress(100);
        setStatus('Encryption complete.');
      } catch (err: any) {
        console.error(err);
        setErrorMsg('Failed to password protect the PDF document. Ensure the file is not corrupted.');
        setProgress(0);
      } finally {
        setIsProcessing(false);
      }
    }, 200);
  };

  const handleDownload = () => {
    if (protectedBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(protectedBlob, `${baseName}-protected.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setProtectedBlob(null);
    setErrorMsg(null);
    setPassword('');
    setConfirmPassword('');
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans max-w-md mx-auto">
      {!file ? (
        <DropZone accept="application/pdf" acceptLabel="PDF file" onFilesAdded={handleFilesAdded} />
      ) : (
        <div className="flex flex-col gap-4">
          <FileCard file={file} index={0} totalFiles={1} onRemove={handleReset} />

          {!protectedBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="protect-pass" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                    Enter Password /
                  </label>
                  <input
                    id="protect-pass"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="protect-confirm" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                    Confirm Password /
                  </label>
                  <input
                    id="protect-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent font-mono"
                  />
                </div>
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
                  onClick={handleProtect}
                  label="Protect PDF"
                  disabled={!password || !confirmPassword}
                />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {protectedBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Protect Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                PDF successfully protected. Anyone attempting to open this file will now be prompted for the password.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Protected PDF" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProtectPdf;
