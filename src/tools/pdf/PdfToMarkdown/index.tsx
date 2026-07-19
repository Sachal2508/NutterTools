import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';

// Setup worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const PdfToMarkdown: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [markdownText, setMarkdownText] = useState('');
  const [mdBlob, setMdBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setMarkdownText('');
      setMdBlob(null);
    }
  };

  const handleConvertToMarkdown = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setStatus('Initializing PDF markdown compiler...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      let markdownOutput = '';

      for (let i = 1; i <= numPages; i++) {
        setStatus(`Translating page ${i} of ${numPages} to Markdown...`);
        setProgress(10 + Math.round((i / numPages) * 80));

        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];

        if (items.length === 0) continue;

        // Sort items by Y coordinate descending (top-to-bottom) and X ascending (left-to-right)
        const lineGroups: { [key: number]: any[] } = {};
        
        items.forEach(item => {
          const y = Math.round(item.transform[5]);
          // Group items within a coordinate tolerance of 4 points
          const matchedYKey = Object.keys(lineGroups).find(k => Math.abs(parseInt(k) - y) <= 4);
          if (matchedYKey) {
            lineGroups[parseInt(matchedYKey)].push(item);
          } else {
            lineGroups[y] = [item];
          }
        });

        const sortedYKeys = Object.keys(lineGroups)
          .map(k => parseInt(k))
          .sort((a, b) => b - a);

        let pageMarkdown = `<!-- Page ${i} -->\n\n`;

        sortedYKeys.forEach(y => {
          const lineItems = lineGroups[y];
          lineItems.sort((a, b) => a.transform[4] - b.transform[4]);

          let lineText = '';
          let isHeading = false;
          let headingLevel = 2;

          lineItems.forEach(item => {
            const str = item.str.trim();
            if (!str) return;

            // Simple heuristic to detect headings based on font height (item.height or scale transform[0])
            const fontSize = Math.round(item.transform[0]);
            if (fontSize >= 18) {
              isHeading = true;
              headingLevel = 1;
            } else if (fontSize >= 14) {
              isHeading = true;
              headingLevel = 2;
            }

            // Append item text
            lineText += (lineText ? ' ' : '') + item.str;
          });

          if (lineText.trim()) {
            if (isHeading) {
              const prefix = '#'.repeat(headingLevel);
              pageMarkdown += `${prefix} ${lineText.trim()}\n\n`;
            } else {
              pageMarkdown += `${lineText.trim()}\n\n`;
            }
          }
        });

        markdownOutput += pageMarkdown + '\n';
      }

      setMarkdownText(markdownOutput);
      const blob = new Blob([markdownOutput], { type: 'text/markdown;charset=utf-8' });
      setMdBlob(blob);
      setProgress(100);
      setStatus('Conversion complete.');
    } catch (err: any) {
      console.error(err);
      setStatus('Conversion failed. Make sure your file is not encrypted.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (mdBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(mdBlob, `${baseName}.md`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setMarkdownText('');
    setMdBlob(null);
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

          {!mdBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <div className="p-3 bg-accent/5 border border-accent/20 rounded text-xs text-ink-muted leading-relaxed font-sans">
                <strong>Format Support Notice:</strong> This tool parses selectable text layers, detects lines, headings, and lists based on character height, and converts them to plain text Markdown.
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleConvertToMarkdown} label="Convert to Markdown" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {mdBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Markdown Result /
              </h4>
              
              <div className="w-full text-left bg-bg border border-border rounded p-3 font-mono text-[11px] max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed text-ink-muted">
                {markdownText}
              </div>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Markdown (.md)" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfToMarkdown;
