import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';
import { RotateCw } from 'lucide-react';

// Setup worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PagePreview {
  pageNum: number;
  dataUrl: string;
}

export const RotatePdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pagePreviews, setPagePreviews] = useState<PagePreview[]>([]);
  const [rotations, setRotations] = useState<{ [pageNum: number]: number }>({}); // store angles in degrees (0, 90, 180, 270)

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDoneRendering, setIsDoneRendering] = useState(false);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);

  const handleFilesAdded = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setPagePreviews([]);
    setRotations({});
    setIsDoneRendering(false);
    setOutputBlob(null);

    setIsProcessing(true);
    setProgress(15);
    setStatus('Loading pages to visual rotation board...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(selected);
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const previews: PagePreview[] = [];

      for (let i = 1; i <= numPages; i++) {
        setStatus(`Loading page layout ${i} of ${numPages}...`);
        setProgress(15 + (i / numPages) * 75);

        const page = await pdf.getPage(i);
        // Render at a smaller scale (e.g. 0.8) to keep thumbnails fast and lightweight
        const viewport = page.getViewport({ scale: 0.8 });

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

        previews.push({
          pageNum: i,
          dataUrl: canvas.toDataURL('image/jpeg', 0.85),
        });
      }

      setPagePreviews(previews);
      setProgress(100);
      setStatus('All pages loaded.');
      setIsDoneRendering(true);
    } catch (err: any) {
      console.error(err);
      setStatus('Failed to load PDF preview thumbnails.');
      setProgress(0);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const rotatePage = (pageNum: number) => {
    setRotations(prev => ({
      ...prev,
      [pageNum]: ((prev[pageNum] || 0) + 90) % 360,
    }));
    setOutputBlob(null);
  };

  const rotateAll = () => {
    const updated: { [pageNum: number]: number } = {};
    pagePreviews.forEach(p => {
      updated[p.pageNum] = ((rotations[p.pageNum] || 0) + 90) % 360;
    });
    setRotations(updated);
    setOutputBlob(null);
  };

  const handleSaveChanges = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(30);
    setStatus('Opening PDF structure for rotation writing...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      setProgress(60);
      setStatus('Writing page rotation metadata angles...');

      pages.forEach((page, index) => {
        const pageNum = index + 1;
        const rotateAngle = rotations[pageNum] || 0;
        
        if (rotateAngle > 0) {
          const currentRotation = page.getRotation().angle;
          const newRotation = (currentRotation + rotateAngle) % 360;
          page.setRotation(degrees(newRotation));
        }
      });

      setProgress(85);
      setStatus('Writing modifications to PDF byte array...');

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes] as any, { type: 'application/pdf' });

      setOutputBlob(blob);
      setProgress(100);
      setStatus('Rotation coordinates saved.');
    } catch (err) {
      console.error(err);
      setStatus('Failed to save rotations.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (outputBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(outputBlob, `${baseName}-rotated.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPagePreviews([]);
    setRotations({});
    setIsDoneRendering(false);
    setOutputBlob(null);
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

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {isDoneRendering && pagePreviews.length > 0 && !outputBlob && !isProcessing && (
            <div className="flex flex-col gap-4 border-t border-border pt-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  Page Rotation Panel /
                </span>
                <button
                  onClick={rotateAll}
                  className="font-mono text-[10px] text-accent hover:underline uppercase tracking-wider flex items-center gap-1 font-bold"
                >
                  <RotateCw size={11} />
                  <span>Rotate All 90°</span>
                </button>
              </div>

              {/* Grid of pages */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {pagePreviews.map((preview) => {
                  const angle = rotations[preview.pageNum] || 0;
                  return (
                    <div
                      key={preview.pageNum}
                      className="border border-border rounded bg-surface p-2 flex flex-col items-center gap-2 group hover:border-accent/40 transition-colors"
                    >
                      <div className="w-full aspect-square bg-bg border border-border/50 rounded overflow-hidden relative flex items-center justify-center p-1">
                        <img
                          src={preview.dataUrl}
                          alt={`Page ${preview.pageNum}`}
                          className="max-w-full max-h-full object-contain transition-transform duration-200"
                          style={{ transform: `rotate(${angle}deg)` }}
                        />
                        <span className="absolute top-1.5 left-1.5 font-mono text-[8px] bg-ink/85 text-surface px-1.5 py-0.5 rounded">
                          PAGE {preview.pageNum}
                        </span>
                        {angle > 0 && (
                          <span className="absolute top-1.5 right-1.5 font-mono text-[8px] bg-accent text-white px-1.5 py-0.5 rounded uppercase font-bold">
                            {angle}°
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => rotatePage(preview.pageNum)}
                        className="w-full py-1 bg-bg border border-border rounded hover:border-accent hover:text-accent font-mono text-[9px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                      >
                        <RotateCw size={10} />
                        <span>Rotate 90°</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleSaveChanges} label="Apply rotations & Save" />
              </div>
            </div>
          )}

          {outputBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Rotate Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                All rotations successfully written into PDF coordinates.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Rotated PDF" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RotatePdf;
