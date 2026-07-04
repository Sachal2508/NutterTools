import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer, formatBytes } from '../../../lib/fileHelper';

// Configure pdfjs worker locally via Vite asset URL loader
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const CompressPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<'standard' | 'extreme'>('standard');
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setCompressedBlob(null);
    }
  };

  const dataUrlToBytes = (dataUrl: string): Uint8Array => {
    const base64 = dataUrl.split(',')[1];
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(5);
    setStatus('Initializing PDF engine...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      const newPdf = await PDFDocument.create();

      // Settings based on compression level
      // standard: 150 DPI scale (1.5), 70% quality jpeg
      // extreme: 100 DPI scale (1.0), 50% quality jpeg
      const scale = level === 'standard' ? 1.5 : 1.0;
      const quality = level === 'standard' ? 0.7 : 0.45;

      for (let i = 1; i <= numPages; i++) {
        setStatus(`Rendering and compressing page ${i} of ${numPages}...`);
        setProgress(10 + (i / numPages) * 75);

        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale });

        // Create canvas to render page
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get 2D canvas context');

        // Render page
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        };
        await page.render(renderContext).promise;

        // Compress canvas output to Jpeg DataUrl
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const imageBytes = dataUrlToBytes(compressedDataUrl);

        // Embed in new PDF document
        const embeddedImage = await newPdf.embedJpg(imageBytes);
        const newPage = newPdf.addPage([viewport.width, viewport.height]);
        
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });
      }

      setProgress(90);
      setStatus('Re-indexing content outlines and writing output...');

      const bytes = await newPdf.save();
      const blob = new Blob([bytes] as any, { type: 'application/pdf' });

      setCompressedBlob(blob);
      setProgress(100);
      setStatus('Compression complete.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'An error occurred during client-side compression.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (compressedBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(compressedBlob, `${baseName}-compressed.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCompressedBlob(null);
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

          {!compressedBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  Compression Setting /
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLevel('standard')}
                    className={`p-3 border rounded text-left flex flex-col justify-between transition-colors ${
                      level === 'standard'
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/40 bg-surface'
                    }`}
                  >
                    <span className="font-sans text-xs font-bold text-ink">Standard Optimization</span>
                    <span className="font-mono text-[9px] text-ink-muted uppercase mt-1">
                      Good quality balance (150 DPI, 70% quality)
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLevel('extreme')}
                    className={`p-3 border rounded text-left flex flex-col justify-between transition-colors ${
                      level === 'extreme'
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/40 bg-surface'
                    }`}
                  >
                    <span className="font-sans text-xs font-bold text-ink">Maximum Compression</span>
                    <span className="font-mono text-[9px] text-ink-muted uppercase mt-1">
                      Smallest file size (100 DPI, 45% quality)
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
                <DownloadButton onClick={handleCompress} label="Compress PDF" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {compressedBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Compression Results /
              </h4>

              <div className="grid grid-cols-2 gap-4 text-center py-2 w-full max-w-sm">
                <div className="border-r border-border">
                  <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider block">Original Size</span>
                  <span className="text-base font-bold text-ink block mt-1">{formatBytes(file.size)}</span>
                </div>
                <div>
                  <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider block">Compressed Size</span>
                  <span className="text-base font-bold text-accent-secondary block mt-1">
                    {formatBytes(compressedBlob.size)}
                  </span>
                </div>
              </div>

              <div className="bg-bg/50 border border-border rounded p-3 text-center w-full max-w-sm">
                <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider">
                  Reduction achieved:
                </span>
                <span className="text-xs font-bold text-ink ml-1.5">
                  {Math.round(((file.size - compressedBlob.size) / file.size) * 100)}% smaller
                </span>
              </div>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Compressed PDF" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompressPdf;
