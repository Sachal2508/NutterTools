import React, { useState, useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocument, rgb } from 'pdf-lib';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';
import { Trash2 } from 'lucide-react';

// Setup worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface RedactionBox {
  pageNumber: number; // 1-indexed
  x: number; // percentage left
  y: number; // percentage top
  width: number; // percentage width
  height: number;
}

export const RedactPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pagesCount, setPagesCount] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [activePage, setActivePage] = useState(1);
  const [boxes, setBoxes] = useState<RedactionBox[]>([]);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRenderingThumbnails, setIsRenderingThumbnails] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState<RedactionBox | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setBoxes([]);
      setResultBlob(null);
      setThumbnails([]);
      setCurrentBox(null);
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
          setStatus(`Rendering page ${i} of ${numPages} preview...`);
          setProgress(Math.round(5 + (i / numPages) * 90));

          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.5 }); // preview size

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
            thumbs.push(canvas.toDataURL('image/jpeg', 0.85));
          }
        }
        setThumbnails(thumbs);
        setProgress(100);
        setStatus('');
      } catch (err) {
        console.error('Page rendering failed:', err);
        setStatus('Failed to load page previews.');
      } finally {
        setIsRenderingThumbnails(false);
      }
    };

    renderThumbnails();
  }, [file]);

  // Click & Drag drawing redaction rectangle logic
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || resultBlob) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    startPosRef.current = { x, y };

    setCurrentBox({
      pageNumber: activePage,
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      width: 0,
      height: 0,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingRef.current || !containerRef.current || !currentBox) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const startX = startPosRef.current.x;
    const startY = startPosRef.current.y;

    const left = Math.min(startX, x);
    const top = Math.min(startY, y);
    const width = Math.abs(startX - x);
    const height = Math.abs(startY - y);

    setCurrentBox({
      pageNumber: activePage,
      x: (left / rect.width) * 100,
      y: (top / rect.height) * 100,
      width: (width / rect.width) * 100,
      height: (height / rect.height) * 100,
    });
  };

  const handleMouseUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      if (currentBox && currentBox.width > 1 && currentBox.height > 1) {
        setBoxes([...boxes, currentBox]);
      }
      setCurrentBox(null);
      setResultBlob(null);
    }
  };

  const removeBox = (idx: number) => {
    setBoxes(boxes.filter((_, i) => i !== idx));
    setResultBlob(null);
  };

  const handleApplyRedaction = async () => {
    if (!file || boxes.length === 0) return;

    setIsProcessing(true);
    setProgress(20);
    setStatus('Initializing redaction engine...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      setProgress(50);
      setStatus('Burning solid black rects into PDF streams...');

      boxes.forEach(b => {
        const page = pdfDoc.getPage(b.pageNumber - 1);
        const { width, height } = page.getSize();

        // Calculate layout coordinates
        const boxX = (b.x / 100) * width;
        // pdf-lib Y starts from bottom
        const boxHeight = (b.height / 100) * height;
        const boxY = height - (b.y / 100) * height - boxHeight;
        const boxWidth = (b.width / 100) * width;

        page.drawRectangle({
          x: boxX,
          y: boxY,
          width: boxWidth,
          height: boxHeight,
          color: rgb(0, 0, 0), // solid black cover
        });
      });

      setProgress(85);
      setStatus('Consolidating PDF bytes...');
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });

      setResultBlob(blob);
      setProgress(100);
      setStatus('Redactions applied successfully.');
    } catch (err: any) {
      console.error(err);
      setStatus('Redaction process failed.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(resultBlob, `${baseName}-redacted.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setThumbnails([]);
    setBoxes([]);
    setResultBlob(null);
    setCurrentBox(null);
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Tools controls */}
              <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 h-fit">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  Redaction Panel /
                </span>

                <div className="p-3 bg-accent/5 border border-accent/20 rounded text-xs text-ink-muted leading-relaxed font-sans">
                  <strong>Instructions:</strong> Click and drag on the page preview to draw black redaction boxes over sensitive text or images. Once placed, click "Apply Redactions" to permanently block them out.
                </div>

                {boxes.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2 border-t border-border pt-4">
                    <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                      Redactions Created ({boxes.length}) /
                    </span>
                    <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                      {boxes.map((b, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] bg-bg/50 border border-border/40 px-2 py-1 rounded">
                          <span className="font-mono text-ink-muted">Page {b.pageNumber} area {Math.round(b.width)}x{Math.round(b.height)}</span>
                          <button
                            type="button"
                            onClick={() => removeBox(idx)}
                            className="text-error hover:text-error/80"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-4 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                  >
                    Cancel
                  </button>
                  <DownloadButton 
                    onClick={handleApplyRedaction} 
                    label="Apply Redactions" 
                    disabled={boxes.length === 0}
                  />
                </div>
              </div>

              {/* Right Column: Page view drawer */}
              <div className="lg:col-span-2 border border-border rounded bg-surface p-4 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                    Interactive PDF Page View /
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={activePage === 1}
                      onClick={() => setActivePage(activePage - 1)}
                      className="px-2 py-1 border border-border text-xs rounded disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span className="font-mono text-xs text-ink flex items-center">{activePage} / {pagesCount}</span>
                    <button
                      type="button"
                      disabled={activePage === pagesCount}
                      onClick={() => setActivePage(activePage + 1)}
                      className="px-2 py-1 border border-border text-xs rounded disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div 
                  ref={containerRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className="relative border border-border/60 bg-white rounded overflow-hidden shadow-sm mx-auto cursor-crosshair aspect-[1/1.4] w-full max-w-md flex items-center justify-center select-none"
                >
                  <img 
                    src={thumbnails[activePage - 1]} 
                    alt={`Active page preview`} 
                    className="max-w-full max-h-full object-contain pointer-events-none" 
                  />

                  {/* Render saved redaction boxes on this active page */}
                  {boxes.map((b, idx) => {
                    if (b.pageNumber !== activePage) return null;
                    return (
                      <div
                        key={idx}
                        style={{
                          position: 'absolute',
                          left: `${b.x}%`,
                          top: `${b.y}%`,
                          width: `${b.width}%`,
                          height: `${b.height}%`,
                        }}
                        className="bg-black border border-error/50 flex items-center justify-center group"
                      >
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeBox(idx); }}
                          className="p-0.5 bg-error text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove Redaction Box"
                        >
                          <Trash2 size={8} />
                        </button>
                      </div>
                    );
                  })}

                  {/* Render active dragging box */}
                  {currentBox && currentBox.pageNumber === activePage && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${currentBox.x}%`,
                        top: `${currentBox.y}%`,
                        width: `${currentBox.width}%`,
                        height: `${currentBox.height}%`,
                      }}
                      className="border-2 border-dashed border-error bg-error/10 pointer-events-none"
                    />
                  )}
                </div>
              </div>

            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {resultBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Redact Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                Redaction blocks burned into PDF document successfully ({boxes.length} areas permanently blacked out).
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

export default RedactPdf;
