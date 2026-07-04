import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';

// Setup worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const PdfToWord: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setDocxBlob(null);
    }
  };

  const handleConvertToWord = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setStatus('Reading PDF text layers...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      const docParagraphs: Paragraph[] = [];

      for (let i = 1; i <= numPages; i++) {
        setStatus(`Extracting text from page ${i} of ${numPages}...`);
        setProgress(10 + (i / numPages) * 70);

        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];

        if (items.length === 0) {
          // Empty page or scanned image page
          docParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: `[Scan Image Page ${i} - No selectable text found]`, italics: true })],
              pageBreakBefore: i > 1,
            })
          );
          continue;
        }

        // Sort items by Y descending (top-to-bottom), then X ascending (left-to-right)
        // Group items that share roughly the same Y coordinate (within 5 units)
        const linesMap: { [key: number]: any[] } = {};
        
        items.forEach(item => {
          const y = Math.round(item.transform[5]);
          // Find if there is an existing Y close to this (within 5 units)
          const matchedYKey = Object.keys(linesMap).find(key => Math.abs(parseInt(key) - y) <= 5);
          
          if (matchedYKey) {
            linesMap[parseInt(matchedYKey)].push(item);
          } else {
            linesMap[y] = [item];
          }
        });

        // Sort the Y coordinates descending
        const sortedYKeys = Object.keys(linesMap)
          .map(k => parseInt(k))
          .sort((a, b) => b - a);

        let isFirstParagraphOnPage = true;

        sortedYKeys.forEach(yKey => {
          // Sort items on this line by X coordinate ascending
          const lineItems = linesMap[yKey];
          lineItems.sort((a, b) => a.transform[4] - b.transform[4]);

          // Join text items into a line
          const lineText = lineItems.map(item => item.str).join(' ');

          if (lineText.trim()) {
            docParagraphs.push(
              new Paragraph({
                children: [new TextRun(lineText)],
                // Apply page break only to the first paragraph of subsequent pages
                pageBreakBefore: i > 1 && isFirstParagraphOnPage,
              })
            );
            isFirstParagraphOnPage = false;
          }
        });
      }

      setProgress(85);
      setStatus('Building .docx structural file layout...');

      // Compile Document using docx packer
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docParagraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      setDocxBlob(blob);
      setProgress(100);
      setStatus('Conversion complete.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'An error occurred during Word conversion.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (docxBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(docxBlob, `${baseName}.docx`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setDocxBlob(null);
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

          {!docxBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <div className="p-3 bg-accent/5 border border-accent/20 rounded text-xs text-ink-muted leading-relaxed">
                <strong>Important Conversion Note:</strong> This tool extracts text layers from selectable PDFs. Custom columns, graphics, or scanned image pages (non-selectable text) may not preserve original document grids. You will receive an editable layout ready for word processors.
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleConvertToWord} label="Convert to Word" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {docxBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Word Conversion Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                Editable Word document generated successfully.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Word Doc" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfToWord;
