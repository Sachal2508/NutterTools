import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';

// Setup worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const OcrPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState('eng');
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [textBlob, setTextBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setExtractedText('');
      setTextBlob(null);
    }
  };

  const handleRunOcr = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(5);
    setStatus('Initializing OCR engine...');

    let worker: any = null;

    try {
      // Create Tesseract worker
      worker = await createWorker(lang);

      const arrayBuffer = await readFileAsArrayBuffer(file);
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      let fullText = '';

      for (let i = 1; i <= numPages; i++) {
        setStatus(`OCR: Rendering page ${i} of ${numPages} for text scanning...`);
        setProgress(10 + Math.round((i / numPages) * 15));

        const page = await pdfDoc.getPage(i);
        // Render at 2.0x scale to give OCR engine crisp text bounds
        const viewport = page.getViewport({ scale: 2.0 });

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

        setStatus(`OCR: Scanning text from page ${i} of ${numPages}...`);
        setProgress(25 + Math.round((i / numPages) * 70));

        // Perform OCR on the canvas
        const { data: { text } } = await worker.recognize(canvas);
        
        fullText += `--- Page ${i} ---\n\n${text}\n\n`;
      }

      setExtractedText(fullText);
      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      setTextBlob(blob);
      setProgress(100);
      setStatus('OCR scanning complete.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'An error occurred during OCR text scanning.');
      setProgress(0);
    } finally {
      if (worker) {
        await worker.terminate();
      }
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (textBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(textBlob, `${baseName}-ocr.txt`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setExtractedText('');
    setTextBlob(null);
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {!file ? (
        <DropZone accept="application/pdf,image/*" acceptLabel="PDF or Scanned Images" onFilesAdded={handleFilesAdded} />
      ) : (
        <div className="flex flex-col gap-4">
          <FileCard file={file} index={0} totalFiles={1} onRemove={handleReset} />

          {!textBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  OCR Scanning Language /
                </span>
                <select
                  value={lang}
                  onChange={e => setLang(e.target.value)}
                  className="px-2 py-1 border border-border rounded bg-bg text-ink text-xs focus:border-accent outline-none font-sans"
                >
                  <option value="eng">English (eng)</option>
                  <option value="spa">Spanish (spa)</option>
                  <option value="fra">French (fra)</option>
                  <option value="deu">German (deu)</option>
                  <option value="ita">Italian (ita)</option>
                  <option value="por">Portuguese (por)</option>
                </select>
              </div>

              <div className="p-3 bg-accent/5 border border-accent/20 rounded text-xs text-ink-muted leading-relaxed font-sans">
                <strong>OCR Engine Notice:</strong> The document will be rendered page-by-page to a high-resolution canvas locally in browser memory and analyzed using Tesseract WebAssembly. Ideal for scanned documents, PDF forms, or photos.
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleRunOcr} label="Run OCR Scan" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {textBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                OCR Scan Complete /
              </h4>
              
              <div className="w-full text-left bg-bg border border-border rounded p-3 font-mono text-[11px] max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed text-ink-muted">
                {extractedText}
              </div>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Text File (.txt)" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OcrPdf;
