import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import JSZip from 'jszip';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';
import { Download } from 'lucide-react';

// Setup worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PagePreview {
  pageNum: number;
  dataUrl: string;
}

export const PdfToJpg: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pagePreviews, setPagePreviews] = useState<PagePreview[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDoneRendering, setIsDoneRendering] = useState(false);

  const handleFilesAdded = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setPagePreviews([]);
    setIsDoneRendering(false);

    setIsProcessing(true);
    setProgress(10);
    setStatus('Loading PDF pages into rendering cache...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(selected);
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const previews: PagePreview[] = [];

      for (let i = 1; i <= numPages; i++) {
        setStatus(`Rendering page ${i} of ${numPages}...`);
        setProgress(10 + (i / numPages) * 80);

        const page = await pdf.getPage(i);
        // Render at standard 1.5 scale (~150 DPI) for clear images
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D context');

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        };
        await page.render(renderContext).promise;

        previews.push({
          pageNum: i,
          dataUrl: canvas.toDataURL('image/jpeg', 0.9),
        });
      }

      setPagePreviews(previews);
      setProgress(100);
      setStatus('All pages rendered.');
      setIsDoneRendering(true);
    } catch (err: any) {
      console.error(err);
      setStatus('Failed to render PDF pages.');
      setProgress(0);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (preview: PagePreview) => {
    if (!file) return;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
    // Convert data url to blob
    fetch(preview.dataUrl)
      .then(res => res.blob())
      .then(blob => {
        downloadBlob(blob, `${baseName}-page-${preview.pageNum}.jpg`);
      });
  };

  const handleDownloadAllZip = async () => {
    if (!file || pagePreviews.length === 0) return;

    setIsProcessing(true);
    setStatus('Compressing all pages into a ZIP...');
    setProgress(50);

    try {
      const zip = new JSZip();
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));

      for (const preview of pagePreviews) {
        const base64 = preview.dataUrl.split(',')[1];
        zip.file(`${baseName}-page-${preview.pageNum}.jpg`, base64, { base64: true });
      }

      setProgress(85);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `${baseName}-jpg-pages.zip`);
      
      setProgress(100);
      setStatus('ZIP download complete.');
    } catch (err) {
      console.error(err);
      alert('Failed to generate ZIP archive.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPagePreviews([]);
    setIsDoneRendering(false);
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

          {isDoneRendering && pagePreviews.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-border pt-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  Rendered Pages ({pagePreviews.length}) /
                </span>
                <button
                  onClick={handleDownloadAllZip}
                  className="font-mono text-[10px] text-accent hover:underline uppercase tracking-wider flex items-center gap-1 font-bold"
                >
                  <Download size={12} />
                  <span>Download All as ZIP</span>
                </button>
              </div>

              {/* Grid of thumbnails */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {pagePreviews.map((preview) => (
                  <div
                    key={preview.pageNum}
                    className="border border-border rounded bg-surface p-2 flex flex-col items-center gap-2 group hover:border-accent/40 transition-colors"
                  >
                    <div className="w-full aspect-[3/4] bg-bg border border-border/50 rounded overflow-hidden relative shadow-inner">
                      <img src={preview.dataUrl} alt={`Page ${preview.pageNum}`} className="w-full h-full object-contain" />
                      <span className="absolute top-1.5 left-1.5 font-mono text-[8px] bg-ink/85 text-surface px-1.5 py-0.5 rounded">
                        PAGE {preview.pageNum}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDownloadSingle(preview)}
                      className="w-full py-1 bg-bg border border-border rounded hover:border-accent hover:text-accent font-mono text-[9px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                    >
                      <Download size={10} />
                      <span>JPG</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownloadAllZip} label="Download all pages (ZIP)" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfToJpg;
