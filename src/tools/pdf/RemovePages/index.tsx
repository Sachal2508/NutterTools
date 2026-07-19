import React, { useState, useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';
import { Trash2, RotateCcw } from 'lucide-react';

// Setup worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const RemovePages: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pagesCount, setPagesCount] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [removedPages, setRemovedPages] = useState<number[]>([]); // 1-indexed page numbers
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRenderingThumbnails, setIsRenderingThumbnails] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setRemovedPages([]);
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

  const togglePageRemove = (pageNumber: number) => {
    if (removedPages.includes(pageNumber)) {
      setRemovedPages(removedPages.filter(p => p !== pageNumber));
    } else {
      if (removedPages.length >= pagesCount - 1) {
        alert('You must keep at least one page in the document.');
        return;
      }
      setRemovedPages([...removedPages, pageNumber]);
    }
    setResultBlob(null);
  };

  const handleRemovePages = async () => {
    if (!file || removedPages.length === 0) return;

    setIsProcessing(true);
    setProgress(20);
    setStatus('Repairing file structures...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const dstDoc = await PDFDocument.create();

      setProgress(50);
      setStatus('Re-arranging active pages...');

      const indicesToKeep = Array.from({ length: pagesCount }, (_, i) => i)
        .filter(i => !removedPages.includes(i + 1));

      const copiedPages = await dstDoc.copyPages(srcDoc, indicesToKeep);
      copiedPages.forEach(page => dstDoc.addPage(page));

      setProgress(85);
      setStatus('Re-building outlines and links...');

      const bytes = await dstDoc.save();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });

      setResultBlob(blob);
      setProgress(100);
      setStatus('Processing complete.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'Failed to remove pages.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(resultBlob, `${baseName}-modified.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setThumbnails([]);
    setRemovedPages([]);
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
              <div className="p-3 bg-accent/5 border border-accent/20 rounded text-xs text-ink-muted leading-relaxed font-sans">
                <strong>How to Remove Pages:</strong> Click on individual page cards to select them for deletion. Selected pages will fade out and show a "Removed" status. Once you're done, click "Apply Changes" below.
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-4 max-h-[450px] overflow-y-auto border-t border-b border-border my-2 p-1">
                {thumbnails.map((src, idx) => {
                  const pageNum = idx + 1;
                  const isRemoved = removedPages.includes(pageNum);
                  return (
                    <div
                      key={pageNum}
                      onClick={() => togglePageRemove(pageNum)}
                      className={`relative border rounded p-2 bg-bg flex flex-col items-center gap-1.5 cursor-pointer group transition-all duration-200 select-none ${
                        isRemoved 
                          ? 'opacity-40 border-error/50 bg-error/5 scale-95' 
                          : 'border-border hover:border-accent hover:shadow-md'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-ink-muted">Page {pageNum}</span>
                      
                      <div className="relative border border-border/50 bg-white rounded overflow-hidden aspect-[1/1.4] w-28 flex items-center justify-center">
                        <img src={src} alt={`Page ${pageNum} preview`} className="max-w-full max-h-full object-contain" />
                        {isRemoved && (
                          <div className="absolute inset-0 bg-error/15 flex items-center justify-center font-mono text-[10px] text-error font-bold uppercase tracking-wider">
                            Removed
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className={`absolute top-2 right-2 p-1 rounded-full border transition-colors ${
                          isRemoved 
                            ? 'bg-accent/10 border-accent/30 text-accent hover:bg-accent/20' 
                            : 'bg-surface border-border text-ink-muted hover:text-error hover:border-error/30 hover:bg-error/5 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isRemoved ? <RotateCcw size={12} /> : <Trash2 size={12} />}
                      </button>
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
                  onClick={handleRemovePages} 
                  label="Apply Changes" 
                  disabled={removedPages.length === 0} 
                />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {resultBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Organize Output /
              </h4>
              <p className="text-sm font-sans text-ink">
                Removed {removedPages.length} page(s) successfully. New document ready ({pagesCount - removedPages.length} pages total).
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

export default RemovePages;
