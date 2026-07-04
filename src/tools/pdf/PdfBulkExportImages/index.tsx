import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import JSZip from 'jszip';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';

// Setup worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const PdfBulkExportImages: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setZipBlob(null);
    }
  };

  const handleExportZip = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setStatus('Opening PDF document...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const zip = new JSZip();
      const ext = format === 'image/jpeg' ? 'jpg' : 'png';
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));

      for (let i = 1; i <= numPages; i++) {
        setStatus(`Rendering page ${i} of ${numPages} for export...`);
        setProgress(10 + (i / numPages) * 75);

        const page = await pdf.getPage(i);
        // Render at high-quality 2.0 scale (~200 DPI) for bulk image extraction
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D canvas context');

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        };
        await page.render(renderContext).promise;

        const dataUrl = canvas.toDataURL(format, 0.92);
        const base64 = dataUrl.split(',')[1];
        zip.file(`${baseName}-page-${i}.${ext}`, base64, { base64: true });
      }

      setProgress(90);
      setStatus('Compressing rendered pages into ZIP archive...');

      const blob = await zip.generateAsync({ type: 'blob' });
      setZipBlob(blob);
      setProgress(100);
      setStatus('Export complete.');
    } catch (err: any) {
      console.error(err);
      setStatus('Image export failed. Ensure your file is a valid PDF.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (zipBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(zipBlob, `${baseName}-images-export.zip`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setZipBlob(null);
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

          {!zipBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  Select Export format /
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormat('image/jpeg')}
                    className={`p-3 border rounded text-left flex flex-col justify-between transition-colors ${
                      format === 'image/jpeg' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40 bg-surface'
                    }`}
                  >
                    <span className="font-sans text-xs font-bold text-ink">JPEG (.jpg)</span>
                    <span className="font-mono text-[9px] text-ink-muted uppercase mt-1">
                      Smaller size, standard photo compression
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('image/png')}
                    className={`p-3 border rounded text-left flex flex-col justify-between transition-colors ${
                      format === 'image/png' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40 bg-surface'
                    }`}
                  >
                    <span className="font-sans text-xs font-bold text-ink">PNG (.png)</span>
                    <span className="font-mono text-[9px] text-ink-muted uppercase mt-1">
                      Lossless quality, preserves line details
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleExportZip} label="Export ZIP" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {zipBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Export Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                All pages converted and bundled into a ZIP file.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download ZIP Archive" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfBulkExportImages;
