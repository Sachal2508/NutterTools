import React, { useState, useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';
import { Trash2 } from 'lucide-react';

// Setup worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface SignaturePlacement {
  pageNumber: number; // 1-indexed
  xPercentage: number; // relative x position
  yPercentage: number; // relative y position (from top)
  widthPercentage: number; // relative width of signature
  heightPercentage: number;
}

export const SignPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pagesCount, setPagesCount] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [activePage, setActivePage] = useState(1);
  
  const [signMode, setSignMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('John Doe');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [placements, setPlacements] = useState<SignaturePlacement[]>([]);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRenderingThumbnails, setIsRenderingThumbnails] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const pageViewRef = useRef<HTMLDivElement | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setPlacements([]);
      setResultBlob(null);
      setThumbnails([]);
      setSignatureDataUrl(null);
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
          const viewport = page.getViewport({ scale: 0.5 }); // reasonable resolution for page preview

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

  // Drawing signature canvas logic
  useEffect(() => {
    if (signMode !== 'draw' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return {
        x: ((clientX - rect.left) / rect.width) * canvas.width,
        y: ((clientY - rect.top) / rect.height) * canvas.height,
      };
    };

    const startDraw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawingRef.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!drawingRef.current) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stopDraw = () => {
      if (drawingRef.current) {
        drawingRef.current = false;
        // Generate transparent png data url
        setSignatureDataUrl(canvas.toDataURL('image/png'));
      }
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);

    return () => {
      canvas.removeEventListener('mousedown', startDraw);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDraw);
      canvas.removeEventListener('mouseleave', stopDraw);
      canvas.removeEventListener('touchstart', startDraw);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDraw);
    };
  }, [signMode]);

  // Handle Typed Signature
  useEffect(() => {
    if (signMode !== 'type' || !typedName.trim()) return;

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = 'italic bold 32px Georgia, serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, 200, 60);
      setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  }, [signMode, typedName]);

  const clearDrawingCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureDataUrl(null);
    }
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!signatureDataUrl || !pageViewRef.current) return;
    const rect = pageViewRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPlacement: SignaturePlacement = {
      pageNumber: activePage,
      xPercentage: (x / rect.width) * 100,
      yPercentage: (y / rect.height) * 100,
      widthPercentage: 20, // default size 20% of page width
      heightPercentage: 8,
    };

    setPlacements([...placements, newPlacement]);
    setResultBlob(null);
  };

  const removePlacement = (idx: number) => {
    setPlacements(placements.filter((_, i) => i !== idx));
    setResultBlob(null);
  };

  const handleApplySignature = async () => {
    if (!file || placements.length === 0 || !signatureDataUrl) return;

    setIsProcessing(true);
    setProgress(20);
    setStatus('Embedding digital signature data...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      setProgress(50);
      setStatus('Applying placements on PDF pages...');

      const signatureBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
      const embeddedSig = await pdfDoc.embedPng(signatureBytes);

      placements.forEach(p => {
        const page = pdfDoc.getPage(p.pageNumber - 1);
        const { width, height } = page.getSize();

        // Calculate layout coordinates
        const sigWidth = (p.widthPercentage / 100) * width;
        const sigHeight = (p.heightPercentage / 100) * height;
        const x = (p.xPercentage / 100) * width - sigWidth / 2;
        
        // pdf-lib Y starts from bottom of the page
        const y = height - (p.yPercentage / 100) * height - sigHeight / 2;

        page.drawImage(embeddedSig, {
          x,
          y,
          width: sigWidth,
          height: sigHeight,
        });
      });

      setProgress(85);
      setStatus('Packaging signed PDF document...');
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });

      setResultBlob(blob);
      setProgress(100);
      setStatus('Signatures applied successfully.');
    } catch (err: any) {
      console.error(err);
      setStatus('Failed to sign document. Please try again.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(resultBlob, `${baseName}-signed.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setThumbnails([]);
    setSignatureDataUrl(null);
    setPlacements([]);
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Sign Maker Panel */}
              <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 h-fit">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  Create Signature /
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setSignMode('draw'); clearDrawingCanvas(); }}
                    className={`flex-1 py-1.5 border rounded text-xs font-mono uppercase tracking-wider transition-colors ${
                      signMode === 'draw' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted bg-surface'
                    }`}
                  >
                    Draw
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignMode('type')}
                    className={`flex-1 py-1.5 border rounded text-xs font-mono uppercase tracking-wider transition-colors ${
                      signMode === 'type' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted bg-surface'
                    }`}
                  >
                    Type
                  </button>
                </div>

                {signMode === 'draw' ? (
                  <div className="flex flex-col gap-2">
                    <canvas
                      ref={canvasRef}
                      width={300}
                      height={120}
                      className="border border-border rounded bg-white w-full aspect-[2.5/1] touch-none cursor-crosshair"
                    />
                    <button
                      type="button"
                      onClick={clearDrawingCanvas}
                      className="text-[10px] font-mono text-ink-muted hover:text-error uppercase tracking-wider text-right self-end"
                    >
                      Clear Pad
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[9px] text-ink-muted uppercase">Type Name /</span>
                    <input
                      type="text"
                      value={typedName}
                      onChange={e => setTypedName(e.target.value)}
                      className="px-3 py-1.5 border border-border bg-bg text-ink rounded text-xs focus:border-accent outline-none"
                    />
                  </div>
                )}

                {signatureDataUrl && (
                  <div className="p-3 bg-accent/5 border border-accent/20 rounded text-xs text-ink-muted leading-relaxed font-sans mt-2">
                    <strong>Stamp Tool Ready:</strong> Click on the page preview on the right to place your signature. You can place it multiple times.
                  </div>
                )}

                {placements.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2 border-t border-border pt-4">
                    <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                      Placements list ({placements.length}) /
                    </span>
                    <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                      {placements.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] bg-bg/50 border border-border/40 px-2 py-1 rounded">
                          <span className="font-mono text-ink-muted">Page {p.pageNumber} stamp</span>
                          <button
                            type="button"
                            onClick={() => removePlacement(idx)}
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
                    onClick={handleApplySignature} 
                    label="Save Signature" 
                    disabled={placements.length === 0}
                  />
                </div>
              </div>

              {/* Right Column: Page Viewer & Positioner */}
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
                  ref={pageViewRef}
                  onClick={handlePageClick}
                  className="relative border border-border/60 bg-white rounded overflow-hidden shadow-sm mx-auto cursor-crosshair aspect-[1/1.4] w-full max-w-md flex items-center justify-center select-none"
                >
                  <img 
                    src={thumbnails[activePage - 1]} 
                    alt={`Active page preview`} 
                    className="max-w-full max-h-full object-contain pointer-events-none" 
                  />

                  {/* Render signature placements on this active page */}
                  {placements.map((p, idx) => {
                    if (p.pageNumber !== activePage) return null;
                    return (
                      <div
                        key={idx}
                        style={{
                          position: 'absolute',
                          left: `${p.xPercentage}%`,
                          top: `${p.yPercentage}%`,
                          width: `${p.widthPercentage}%`,
                          height: `${p.heightPercentage}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation(); // prevent adding new stamp
                          removePlacement(idx);
                        }}
                        className="border border-dashed border-accent bg-accent/10 flex items-center justify-center group cursor-pointer"
                        title="Click to remove signature"
                      >
                        {signatureDataUrl && (
                          <img src={signatureDataUrl} alt="Signature stamp" className="max-w-full max-h-full object-contain" />
                        )}
                        <div className="absolute inset-0 bg-error/10 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-error font-bold font-mono">
                          Remove
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {resultBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Sign Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                PDF document signed successfully ({placements.length} signature stamps applied).
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

export default SignPdf;
