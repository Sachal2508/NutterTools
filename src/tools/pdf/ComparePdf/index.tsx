import React, { useState, useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';
import DropZone from '../../../components/shared/DropZone';
import ProgressBar from '../../../components/shared/ProgressBar';
import { Columns } from 'lucide-react';

// Setup worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const ComparePdf: React.FC = () => {
  const [fileLeft, setFileLeft] = useState<File | null>(null);
  const [fileRight, setFileRight] = useState<File | null>(null);
  
  const [thumbsLeft, setThumbsLeft] = useState<string[]>([]);
  const [thumbsRight, setThumbsRight] = useState<string[]>([]);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePage, setActivePage] = useState(1);

  // Render left PDF pages
  useEffect(() => {
    if (!fileLeft) {
      setThumbsLeft([]);
      return;
    }

    const renderLeft = async () => {
      setIsProcessing(true);
      setProgress(10);
      setStatus('Loading left PDF document...');

      try {
        const fileReader = new FileReader();
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve) => {
          fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
          fileReader.readAsArrayBuffer(fileLeft);
        });

        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdfDoc = await loadingTask.promise;
        const numPages = pdfDoc.numPages;

        const thumbs: string[] = [];
        for (let i = 1; i <= numPages; i++) {
          setStatus(`Rendering left page ${i} of ${numPages}...`);
          setProgress(10 + Math.round((i / numPages) * 40));

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
        setThumbsLeft(thumbs);
        setProgress(100);
        setStatus('');
      } catch (err) {
        console.error('Left PDF render failed:', err);
        setStatus('Failed to render left PDF document.');
      } finally {
        setIsProcessing(false);
      }
    };

    renderLeft();
  }, [fileLeft]);

  // Render right PDF pages
  useEffect(() => {
    if (!fileRight) {
      setThumbsRight([]);
      return;
    }

    const renderRight = async () => {
      setIsProcessing(true);
      setProgress(10);
      setStatus('Loading right PDF document...');

      try {
        const fileReader = new FileReader();
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve) => {
          fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
          fileReader.readAsArrayBuffer(fileRight);
        });

        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdfDoc = await loadingTask.promise;
        const numPages = pdfDoc.numPages;

        const thumbs: string[] = [];
        for (let i = 1; i <= numPages; i++) {
          setStatus(`Rendering right page ${i} of ${numPages}...`);
          setProgress(10 + Math.round((i / numPages) * 40));

          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.5 });

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
        setThumbsRight(thumbs);
        setProgress(100);
        setStatus('');
      } catch (err) {
        console.error('Right PDF render failed:', err);
        setStatus('Failed to render right PDF document.');
      } finally {
        setIsProcessing(false);
      }
    };

    renderRight();
  }, [fileRight]);

  const maxPages = Math.max(thumbsLeft.length, thumbsRight.length);

  const handleReset = () => {
    setFileLeft(null);
    setFileRight(null);
    setThumbsLeft([]);
    setThumbsRight([]);
    setActivePage(1);
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {!fileLeft || !fileRight ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
              Original PDF (Left Side) /
            </span>
            {fileLeft ? (
              <div className="p-4 border border-border bg-surface rounded text-center text-xs font-mono text-ink">
                Loaded: {fileLeft.name}
              </div>
            ) : (
              <DropZone accept="application/pdf" acceptLabel="Original PDF" onFilesAdded={(f) => setFileLeft(f[0])} />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
              Modified PDF (Right Side) /
            </span>
            {fileRight ? (
              <div className="p-4 border border-border bg-surface rounded text-center text-xs font-mono text-ink">
                Loaded: {fileRight.name}
              </div>
            ) : (
              <DropZone accept="application/pdf" acceptLabel="Modified PDF" onFilesAdded={(f) => setFileRight(f[0])} />
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center border border-border rounded bg-surface p-3 font-sans">
            <span className="text-xs text-ink-muted flex items-center gap-1.5 font-mono">
              <Columns size={12} /> Comparing: {fileLeft.name} vs {fileRight.name}
            </span>
            
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1 border border-border text-[10px] uppercase font-mono tracking-wider text-ink-muted hover:text-ink hover:bg-bg rounded transition-colors"
            >
              Close Comparison
            </button>
          </div>

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {!isProcessing && thumbsLeft.length > 0 && thumbsRight.length > 0 && (
            <div className="flex flex-col gap-4 border border-border rounded bg-surface p-4">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  Page-by-page visual comparison /
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
                  <span className="font-mono text-xs text-ink flex items-center">Page {activePage} / {maxPages}</span>
                  <button
                    type="button"
                    disabled={activePage === maxPages}
                    onClick={() => setActivePage(activePage + 1)}
                    className="px-2 py-1 border border-border text-xs rounded disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                
                {/* Left Page Render */}
                <div className="flex flex-col gap-2 items-center">
                  <span className="font-mono text-[9px] text-ink-muted uppercase">Original Document - Page {activePage}</span>
                  <div className="border border-border bg-white rounded aspect-[1/1.4] w-full max-w-sm overflow-hidden flex items-center justify-center select-none shadow-sm">
                    {thumbsLeft[activePage - 1] ? (
                      <img src={thumbsLeft[activePage - 1]} alt="Original page view" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-xs text-ink-muted italic">Page does not exist in original</span>
                    )}
                  </div>
                </div>

                {/* Right Page Render */}
                <div className="flex flex-col gap-2 items-center">
                  <span className="font-mono text-[9px] text-ink-muted uppercase">Modified Document - Page {activePage}</span>
                  <div className="border border-border bg-white rounded aspect-[1/1.4] w-full max-w-sm overflow-hidden flex items-center justify-center select-none shadow-sm">
                    {thumbsRight[activePage - 1] ? (
                      <img src={thumbsRight[activePage - 1]} alt="Modified page view" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-xs text-ink-muted italic">Page does not exist in modified</span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComparePdf;
