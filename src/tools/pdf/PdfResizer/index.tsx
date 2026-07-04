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

type SizePreset = 'original' | 'a4' | 'letter';

export const PdfResizer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<SizePreset>('original');
  const [scale, setScale] = useState<number>(100); // percentage (100, 75, 50)
  const [quality, setQuality] = useState<number>(0.7); // 0.1 to 1.0

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resizedBlob, setResizedBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResizedBlob(null);
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

  const handleResize = async () => {
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

      for (let i = 1; i <= numPages; i++) {
        setStatus(`Resizing and compressing page ${i} of ${numPages}...`);
        setProgress(10 + (i / numPages) * 75);

        const page = await pdfDoc.getPage(i);
        
        // Retrieve original page coordinates (72 points per inch)
        const originalViewport = page.getViewport({ scale: 1.0 });
        let targetWidth = originalViewport.width;
        let targetHeight = originalViewport.height;

        // Apply page size presets
        if (preset === 'a4') {
          // A4 dimensions: 595 x 842 points
          targetWidth = 595;
          targetHeight = 842;
        } else if (preset === 'letter') {
          // US Letter dimensions: 612 x 792 points
          targetWidth = 612;
          targetHeight = 792;
        } else if (preset === 'original' && scale !== 100) {
          // Apply scale percentage
          targetWidth = (originalViewport.width * scale) / 100;
          targetHeight = (originalViewport.height * scale) / 100;
        }

        // Render scale: Use 1.5x scaling factor for canvas to prevent output text from becoming blurry
        const renderScale = 1.5;
        const renderViewport = page.getViewport({ 
          scale: (targetWidth / originalViewport.width) * renderScale 
        });

        // Create canvas to render page
        const canvas = document.createElement('canvas');
        canvas.width = renderViewport.width;
        canvas.height = renderViewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get 2D canvas context');

        // Render page content
        const renderContext = {
          canvasContext: ctx,
          viewport: renderViewport,
          canvas: canvas
        };
        await page.render(renderContext).promise;

        // Compress canvas output to Jpeg DataUrl
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const imageBytes = dataUrlToBytes(compressedDataUrl);

        // Embed in new PDF document
        const embeddedImage = await newPdf.embedJpg(imageBytes);
        const newPage = newPdf.addPage([targetWidth, targetHeight]);
        
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: targetWidth,
          height: targetHeight,
        });
      }

      setProgress(90);
      setStatus('Re-writing index and compiling final PDF...');

      const bytes = await newPdf.save();
      const blob = new Blob([bytes] as any, { type: 'application/pdf' });

      setResizedBlob(blob);
      setProgress(100);
      setStatus('Resizing complete.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'An error occurred during resizing.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resizedBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(resizedBlob, `${baseName}-resized.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResizedBlob(null);
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

          {!resizedBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-5">
              {/* Preset selectors */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  Target Page Size Preset /
                </span>
                <div className="grid grid-cols-3 gap-2 font-mono text-[9px]">
                  {(['original', 'a4', 'letter'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPreset(p)}
                      className={`px-3 py-2 border rounded uppercase tracking-wider transition-colors ${
                        preset === p
                          ? 'bg-accent text-white border-accent'
                          : 'bg-bg text-ink border-border hover:border-accent hover:text-accent'
                      }`}
                    >
                      {p === 'original' ? 'Original Size' : p === 'a4' ? 'A4 Paper' : 'US Letter'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scale selectors (only active if preset is original) */}
              {preset === 'original' && (
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                    Scale Dimensions /
                  </span>
                  <div className="grid grid-cols-3 gap-2 font-mono text-[9px]">
                    {([100, 75, 50] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setScale(s)}
                        className={`px-3 py-2 border rounded uppercase tracking-wider transition-colors ${
                          scale === s
                            ? 'bg-accent text-white border-accent'
                            : 'bg-bg text-ink border-border hover:border-accent hover:text-accent'
                        }`}
                      >
                        {s}% Dimensions
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quality Slider */}
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <label htmlFor="quality-range" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                    Compression Quality /
                  </label>
                  <span className="font-mono text-xs font-bold text-accent bg-bg border border-border px-2 py-0.5 rounded">
                    {Math.round(quality * 100)}%
                  </span>
                </div>
                <input
                  id="quality-range"
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={quality}
                  onChange={e => setQuality(parseFloat(e.target.value))}
                  className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider block mt-1">
                  [Adjusting quality compresses internal media weights, decreasing total file size]
                </span>
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleResize} label="Resize PDF" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {resizedBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Resize Results /
              </h4>

              <div className="grid grid-cols-2 gap-4 text-center py-2 w-full max-w-sm">
                <div className="border-r border-border">
                  <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider block">Original Size</span>
                  <span className="text-base font-bold text-ink block mt-1">{formatBytes(file.size)}</span>
                </div>
                <div>
                  <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider block">Resized Size</span>
                  <span className="text-base font-bold text-accent-secondary block mt-1">
                    {formatBytes(resizedBlob.size)}
                  </span>
                </div>
              </div>

              <div className="bg-bg/50 border border-border rounded p-3 text-center w-full max-w-sm">
                <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider">
                  Weight reduction achieved:
                </span>
                <span className="text-xs font-bold text-ink ml-1.5">
                  {Math.round(((file.size - resizedBlob.size) / file.size) * 100)}% smaller
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
                <DownloadButton onClick={handleDownload} label="Download Resized PDF" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfResizer;
