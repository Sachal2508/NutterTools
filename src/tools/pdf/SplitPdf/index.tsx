import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';

export const SplitPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [mode, setMode] = useState<'range' | 'all'>('range');
  const [rangeInput, setRangeInput] = useState('1');

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [zipMode, setZipMode] = useState(false);

  const handleFilesAdded = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setOutputBlob(null);

    // Get page count
    try {
      const buffer = await readFileAsArrayBuffer(selected);
      const pdf = await PDFDocument.load(buffer);
      setPageCount(pdf.getPageCount());
      setRangeInput(`1-${pdf.getPageCount()}`);
    } catch (err) {
      console.error(err);
      alert('Failed to read PDF pages. Make sure it is not corrupted.');
      setFile(null);
    }
  };

  const parsePages = (input: string, maxPage: number): number[] => {
    const indices: number[] = [];
    const items = input.split(',');

    for (const item of items) {
      const trimmed = item.trim();
      if (!trimmed) continue;

      if (trimmed.includes('-')) {
        const parts = trimmed.split('-');
        const start = parseInt(parts[0]);
        const end = parseInt(parts[1]);

        if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0 || start > maxPage || end > maxPage) {
          throw new Error(`Invalid range: ${trimmed}. Page count is ${maxPage}.`);
        }

        const min = Math.min(start, end);
        const max = Math.max(start, end);

        for (let i = min; i <= max; i++) {
          indices.push(i - 1); // 0-indexed conversion
        }
      } else {
        const page = parseInt(trimmed);
        if (isNaN(page) || page <= 0 || page > maxPage) {
          throw new Error(`Invalid page number: ${trimmed}. Page count is ${maxPage}.`);
        }
        indices.push(page - 1); // 0-indexed conversion
      }
    }

    return Array.from(new Set(indices)).sort((a, b) => a - b);
  };

  const handleSplit = async () => {
    if (!file || pageCount === 0) return;

    setIsProcessing(true);
    setProgress(10);
    setStatus('Loading workspace PDF...');

    try {
      const buffer = await readFileAsArrayBuffer(file);
      const srcPdf = await PDFDocument.load(buffer);

      if (mode === 'range') {
        setZipMode(false);
        setStatus('Parsing selected page ranges...');
        setProgress(30);

        const targetIndices = parsePages(rangeInput, pageCount);
        if (targetIndices.length === 0) {
          throw new Error('No valid pages specified for extraction.');
        }

        setProgress(50);
        setStatus('Extracting page buffers...');

        const splitPdf = await PDFDocument.create();
        const copiedPages = await splitPdf.copyPages(srcPdf, targetIndices);
        copiedPages.forEach(page => splitPdf.addPage(page));

        setProgress(85);
        setStatus('Finalizing PDF compile...');
        
        const bytes = await splitPdf.save();
        const blob = new Blob([bytes] as any, { type: 'application/pdf' });
        
        setOutputBlob(blob);
        setProgress(100);
        setStatus('Split complete.');
      } else {
        // Split every page into separate file and pack in ZIP
        setZipMode(true);
        setStatus('Extracting pages individually...');
        setProgress(20);

        const zip = new JSZip();

        for (let i = 0; i < pageCount; i++) {
          setStatus(`Processing page ${i + 1} of ${pageCount}...`);
          setProgress(20 + (i / pageCount) * 60);

          const singlePdf = await PDFDocument.create();
          const [copiedPage] = await singlePdf.copyPages(srcPdf, [i]);
          singlePdf.addPage(copiedPage);

          const bytes = await singlePdf.save();
          zip.file(`page-${i + 1}.pdf`, bytes);
        }

        setProgress(85);
        setStatus('Compressing files into a ZIP folder...');
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        setOutputBlob(zipBlob);
        setProgress(100);
        setStatus('All pages split successfully.');
      }
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'An error occurred while splitting the PDF.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (outputBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      if (zipMode) {
        downloadBlob(outputBlob, `${baseName}-split-pages.zip`);
      } else {
        downloadBlob(outputBlob, `${baseName}-extracted.pdf`);
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
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

          {!outputBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              {/* Mode switch */}
              <div className="flex border border-border rounded overflow-hidden w-fit font-mono text-[9px] mb-1">
                <button
                  type="button"
                  onClick={() => setMode('range')}
                  className={`px-3 py-1.5 uppercase tracking-wider transition-colors ${
                    mode === 'range' ? 'bg-accent text-white font-semibold' : 'bg-bg text-ink-muted hover:text-ink'
                  }`}
                >
                  Page Ranges
                </button>
                <button
                  type="button"
                  onClick={() => setMode('all')}
                  className={`px-3 py-1.5 uppercase tracking-wider transition-colors ${
                    mode === 'all' ? 'bg-accent text-white font-semibold' : 'bg-bg text-ink-muted hover:text-ink'
                  }`}
                >
                  Split All Pages
                </button>
              </div>

              {/* Mode settings */}
              {mode === 'range' ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="split-range" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                      Specify Page ranges /
                    </label>
                    <span className="text-[10px] text-ink-muted">Total: {pageCount} pages</span>
                  </div>
                  <input
                    id="split-range"
                    type="text"
                    value={rangeInput}
                    onChange={e => setRangeInput(e.target.value)}
                    placeholder="e.g. 1-3, 5 (for pages 1, 2, 3 and 5)"
                    className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent font-mono"
                  />
                  <span className="font-mono text-[9px] text-ink-muted uppercase mt-0.5">
                    [Use hyphens for ranges and commas to separate multiple rules]
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-bg border border-border rounded text-xs text-ink-muted">
                  This will slice your PDF document into <strong className="text-ink">{pageCount} individual files</strong> and package them inside a single downloadable ZIP bundle.
                </div>
              )}

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleSplit} label="Split PDF" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {outputBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Split Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                Split operations completed. Ready for download.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton
                  onClick={handleDownload}
                  label={zipMode ? 'Download ZIP Package' : 'Download Split PDF'}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SplitPdf;
