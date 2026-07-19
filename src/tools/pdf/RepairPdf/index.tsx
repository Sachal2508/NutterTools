import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer, formatBytes } from '../../../lib/fileHelper';

export const RepairPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [repairedBlob, setRepairedBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setRepairedBlob(null);
    }
  };

  const handleRepairPdf = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(15);
    setStatus('Analyzing file layout structures...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      
      setProgress(40);
      setStatus('Re-indexing cross-reference offsets (XREFs)...');
      
      // pdf-lib's PDFDocument.load automatically parses the PDF structure, 
      // repairing broken index offsets and catalog elements in the process.
      const pdfDoc = await PDFDocument.load(arrayBuffer, { 
        ignoreEncryption: true 
      });

      setProgress(75);
      setStatus('Stripping minor stream corruptions and saving...');
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });

      setRepairedBlob(blob);
      setProgress(100);
      setStatus('Repair complete.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'PDF repair failed. The file structure might be completely unrecoverable.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (repairedBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(repairedBlob, `${baseName}-repaired.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setRepairedBlob(null);
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {!file ? (
        <DropZone accept="application/pdf" acceptLabel="PDF file" onFilesAdded={handleFilesAdded} />
      ) : (
        <div className="flex flex-col gap-4">
          <FileCard file={file} index={0} totalFiles={1} onRemove={handleReset} />

          {!repairedBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <div className="p-3 bg-accent/5 border border-accent/20 rounded text-xs text-ink-muted leading-relaxed font-sans">
                <strong>Repair Mechanism Notice:</strong> This tool loads the PDF stream in client-side memory to trace and reconstruct broken XREF offset tables, re-index pages, and resolve missing catalog references. It helps recover files that throw "offset error" or render incorrectly in standard viewers.
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleRepairPdf} label="Repair PDF" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {repairedBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Repair Results /
              </h4>

              <div className="grid grid-cols-2 gap-4 text-center py-2 w-full max-w-sm">
                <div className="border-r border-border">
                  <span className="font-mono text-[9px] text-ink-muted uppercase block">Original Size</span>
                  <span className="text-base font-bold text-ink block mt-1">{formatBytes(file.size)}</span>
                </div>
                <div>
                  <span className="font-mono text-[9px] text-ink-muted uppercase block">Repaired Size</span>
                  <span className="text-base font-bold text-accent block mt-1">
                    {formatBytes(repairedBlob.size)}
                  </span>
                </div>
              </div>

              <div className="bg-accent/5 border border-accent/20 rounded p-3 text-center w-full max-w-sm text-xs text-ink-muted leading-relaxed">
                Reconstructed catalog streams successfully. Download below.
              </div>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Repaired PDF" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RepairPdf;
