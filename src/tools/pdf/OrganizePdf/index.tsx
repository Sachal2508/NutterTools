import React, { useState, useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';
import { Trash2, RotateCw, ArrowLeft, ArrowRight } from 'lucide-react';

// Setup worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PageItem {
  id: string; // unique ID
  originalIndex: number; // 0-based page index in the source PDF
  src: string; // Thumbnail data URL
  rotation: number; // Current rotation adjustment in degrees (0, 90, 180, 270)
}

export const OrganizePdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRenderingThumbnails, setIsRenderingThumbnails] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setPages([]);
      setResultBlob(null);
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

        const items: PageItem[] = [];
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
            
            items.push({
              id: `${i}-${Date.now()}`,
              originalIndex: i - 1,
              src: canvas.toDataURL('image/jpeg', 0.8),
              rotation: 0,
            });
          }
        }
        setPages(items);
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

  const handleRotatePage = (idx: number) => {
    const updated = [...pages];
    updated[idx].rotation = (updated[idx].rotation + 90) % 360;
    setPages(updated);
    setResultBlob(null);
  };

  const handleDeletePage = (idx: number) => {
    if (pages.length <= 1) {
      alert('You must keep at least one page in the document.');
      return;
    }
    const updated = pages.filter((_, i) => i !== idx);
    setPages(updated);
    setResultBlob(null);
  };

  const handleMoveLeft = (idx: number) => {
    if (idx === 0) return;
    const updated = [...pages];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    setPages(updated);
    setResultBlob(null);
  };

  const handleMoveRight = (idx: number) => {
    if (idx === pages.length - 1) return;
    const updated = [...pages];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    setPages(updated);
    setResultBlob(null);
  };

  // Drag and Drop support
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    const list = [...pages];
    const draggedItem = list[draggedIdx];
    list.splice(draggedIdx, 1);
    list.splice(idx, 0, draggedItem);
    
    setDraggedIdx(idx);
    setPages(list);
    setResultBlob(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const handleSaveOrganization = async () => {
    if (!file || pages.length === 0) return;

    setIsProcessing(true);
    setProgress(20);
    setStatus('Re-building PDF catalog structures...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const dstDoc = await PDFDocument.create();

      setProgress(40);
      setStatus('Synthesizing page order layouts...');

      // Copy pages and apply rotations
      for (let k = 0; k < pages.length; k++) {
        const item = pages[k];
        setStatus(`Stitch copying page ${k + 1} of ${pages.length}...`);
        setProgress(40 + Math.round((k / pages.length) * 45));

        const [copiedPage] = await dstDoc.copyPages(srcDoc, [item.originalIndex]);
        if (item.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((currentRotation + item.rotation) % 360));
        }
        dstDoc.addPage(copiedPage);
      }

      setProgress(90);
      setStatus('Packaging document binary...');

      const bytes = await dstDoc.save();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });

      setResultBlob(blob);
      setProgress(100);
      setStatus('Save complete.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'Failed to save document organization.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(resultBlob, `${baseName}-organized.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
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

          {!isRenderingThumbnails && pages.length > 0 && !resultBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <div className="p-3 bg-accent/5 border border-accent/20 rounded text-xs text-ink-muted leading-relaxed font-sans">
                <strong>How to Organize:</strong> Drag and drop page cards to reorder them. Use the buttons on each card to rotate or delete pages.
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-4 max-h-[450px] overflow-y-auto border-t border-b border-border my-2 p-1">
                {pages.map((item, idx) => {
                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={e => handleDragStart(e, idx)}
                      onDragOver={e => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`relative border border-border rounded p-2 bg-bg flex flex-col items-center gap-1.5 cursor-move transition-shadow duration-200 select-none group ${
                        draggedIdx === idx ? 'border-accent bg-accent/5 opacity-50' : 'hover:border-accent/60 hover:shadow-md'
                      }`}
                    >
                      <span className="font-mono text-[9px] text-ink-muted">Page {idx + 1} (orig {item.originalIndex + 1})</span>
                      
                      <div className="relative border border-border/50 bg-white rounded overflow-hidden aspect-[1/1.4] w-28 flex items-center justify-center">
                        <img 
                          src={item.src} 
                          alt={`Page preview`} 
                          style={{ transform: `rotate(${item.rotation}deg)` }}
                          className="max-w-full max-h-full object-contain transition-transform duration-200" 
                        />
                      </div>

                      {/* Rotation and delete overlay tools */}
                      <div className="flex gap-2 justify-center w-full mt-1 border-t border-border/40 pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleMoveLeft(idx)}
                          disabled={idx === 0}
                          className="p-1 border border-border bg-surface text-ink-muted hover:text-ink rounded disabled:opacity-30 disabled:pointer-events-none"
                          title="Move Left"
                        >
                          <ArrowLeft size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRotatePage(idx)}
                          className="p-1 border border-border bg-surface text-ink-muted hover:text-accent rounded"
                          title="Rotate 90° Clockwise"
                        >
                          <RotateCw size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePage(idx)}
                          className="p-1 border border-border bg-surface text-ink-muted hover:text-error hover:border-error/20 rounded"
                          title="Remove Page"
                        >
                          <Trash2 size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveRight(idx)}
                          disabled={idx === pages.length - 1}
                          className="p-1 border border-border bg-surface text-ink-muted hover:text-ink rounded disabled:opacity-30 disabled:pointer-events-none"
                          title="Move Right"
                        >
                          <ArrowRight size={10} />
                        </button>
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
                  onClick={handleSaveOrganization} 
                  label="Save Organization" 
                />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {resultBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Organize Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                Document organized successfully ({pages.length} pages total).
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

export default OrganizePdf;
