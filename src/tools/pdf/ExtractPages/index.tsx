import React, { useState, useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';

// Setup worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const ExtractPages: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pagesCount, setPagesCount] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]); // 1-indexed page numbers
  const [rangeInput, setRangeInput] = useState('');
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRenderingThumbnails, setIsRenderingThumbnails] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setSelectedPages([]);
      setRangeInput('');
      setResultBlob(null);
      setThumbnails([]);
    }
  };

  // Render thumbnails
  useEffect(() => {
    if (!file) return;

    const renderThumbnails = async () => {
      setIsRenderingThumbnails(true);
      setProgress(5);
      setStatus('Loading document pages...');
      
      try {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdfDoc = await loadingTask.promise;
        const numPages = pdfDoc.numPages;
        setPagesCount(numPages);

        const thumbs: string[] = [];
        for (let i = 1; i <= numPages; i++) {
          setStatus(`Rendering page ${i} of ${numPages} thumbnail...`);
          setProgress(Math.round(5 + (i / numPages) * 90));

          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.25 }); // low resolution for thumbnails

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const renderContext = {
              canvasContext: ctx,
              viewport: viewport,
              canvas: canvas,
            };
            await page.render(renderContext).promise;
            thumbs.push(canvas.toDataURL('image/jpeg', 0.8));
          }
        }
        setThumbnails(thumbs);
        setProgress(100);
        setStatus('');
      } catch (err) {
        console.error('Thumbnail rendering failed:', err);
        setStatus('Failed to load page previews.');
      } finally {
        setIsRenderingThumbnails(false);
      }
    };

    renderThumbnails();
  }, [file]);

  const togglePageSelection = (pageNumber: number) => {
    let newSelection: number[];
    if (selectedPages.includes(pageNumber)) {
      newSelection = selectedPages.filter(p => p !== pageNumber);
    } else {
      newSelection = [...selectedPages, pageNumber].sort((a, b) => a - b);
    }
    setSelectedPages(newSelection);
    setResultBlob(null);

    // Sync input field to selection
    setRangeInput(newSelection.join(', '));
  };

  const handleRangeChange = (val: string) => {
    setRangeInput(val);
    setResultBlob(null);

    // Parse input (e.g. "1-3, 5")
    const pages: number[] = [];
    const parts = val.split(',');
    
    parts.forEach(part => {
      const clean = part.trim();
      if (clean.includes('-')) {
        const [startStr, endStr] = clean.split('-');
        const start = parseInt(startStr);
        const end = parseInt(endStr);
        if (!isNaN(start) && !isNaN(end)) {
          const lower = Math.min(start, end);
          const upper = Math.max(start, end);
          for (let p = lower; p <= upper; p++) {
            if (p >= 1 && p <= pagesCount && !pages.includes(p)) {
              pages.push(p);
            }
          }
        }
      } else {
        const p = parseInt(clean);
        if (!isNaN(p) && p >= 1 && p <= pagesCount && !pages.includes(p)) {
          pages.push(p);
        }
      }
    });

    setSelectedPages(pages.sort((a, b) => a - b));
  };

  const handleExtractPages = async () => {
    if (!file || selectedPages.length === 0) return;

    setIsProcessing(true);
    setProgress(20);
    setStatus('Initializing extraction engine...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const dstDoc = await PDFDocument.create();

      setProgress(50);
      setStatus('Copying selected pages...');

      const indicesToCopy = selectedPages.map(p => p - 1);
      const copiedPages = await dstDoc.copyPages(srcDoc, indicesToCopy);
      copiedPages.forEach(page => dstDoc.addPage(page));

      setProgress(85);
      setStatus('Compiling PDF file...');

      const bytes = await dstDoc.save();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });

      setResultBlob(blob);
      setProgress(100);
      setStatus('Processing complete.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'Failed to extract pages.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(resultBlob, `${baseName}-extracted.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setThumbnails([]);
    setSelectedPages([]);
    setRangeInput('');
    setResultBlob(null);
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

          {isRenderingThumbnails && <ProgressBar progress={progress} status={status} />}

          {!isRenderingThumbnails && thumbnails.length > 0 && !resultBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="range-input" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  Pages to Extract /
                </label>
                <input
                  id="range-input"
                  type="text"
                  placeholder="e.g. 1-3, 5 (or click pages below)"
                  value={rangeInput}
                  onChange={e => handleRangeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-bg text-ink rounded text-xs font-mono focus:border-accent outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-4 max-h-[400px] overflow-y-auto border-t border-b border-border my-2 p-1">
                {thumbnails.map((src, idx) => {
                  const pageNum = idx + 1;
                  const isSelected = selectedPages.includes(pageNum);
                  return (
                    <div
                      key={pageNum}
                      onClick={() => togglePageSelection(pageNum)}
                      className={`relative border rounded p-2 bg-bg flex flex-col items-center gap-1.5 cursor-pointer group transition-all duration-200 select-none ${
                        isSelected 
                          ? 'border-accent bg-accent/5 scale-95 shadow-sm ring-1 ring-accent' 
                          : 'border-border hover:border-accent/60'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-ink-muted">Page {pageNum}</span>
                      
                      <div className="relative border border-border/50 bg-white rounded overflow-hidden aspect-[1/1.4] w-28 flex items-center justify-center">
                        <img src={src} alt={`Page ${pageNum} preview`} className="max-w-full max-h-full object-contain" />
                        {isSelected && (
                          <div className="absolute top-2 left-2 w-4 h-4 bg-accent text-white font-mono text-[9px] rounded-full flex items-center justify-center font-bold">
                            ✓
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Cancel
                </button>
                <DownloadButton 
                  onClick={handleExtractPages} 
                  label="Extract Pages" 
                  disabled={selectedPages.length === 0} 
                />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {resultBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Extract Output /
              </h4>
              <p className="text-sm font-sans text-ink">
                Extracted {selectedPages.length} page(s) successfully. New document ready ({selectedPages.length} pages total).
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download PDF" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExtractPages;
