import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun, ImageRun } from 'docx';
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
  const [mode, setMode] = useState<'high-fidelity' | 'editable'>('high-fidelity');
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

  const dataUrlToBytes = (dataUrl: string): Uint8Array => {
    const base64 = dataUrl.split(',')[1];
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const handleConvertToWord = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(5);
    setStatus('Initializing PDF engine...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      if (mode === 'editable') {
        const docParagraphs: Paragraph[] = [];

        for (let i = 1; i <= numPages; i++) {
          setStatus(`Extracting text from page ${i} of ${numPages}...`);
          setProgress(10 + (i / numPages) * 70);

          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          const items = textContent.items as any[];

          if (items.length === 0) {
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
      } else {
        // High-fidelity layout mode: render PDF pages as high-resolution images and bundle them into DOCX
        const sections: any[] = [];

        for (let i = 1; i <= numPages; i++) {
          setStatus(`Rendering page ${i} of ${numPages} to high-resolution layout...`);
          setProgress(10 + (i / numPages) * 75);

          const page = await pdfDoc.getPage(i);
          // Render at 1.5x scale (good balance between quality and file size)
          const viewport = page.getViewport({ scale: 1.5 });

          // Create canvas to render page
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get 2D canvas context');

          // Render page
          const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
            canvas: canvas,
          };
          await page.render(renderContext).promise;

          // Convert canvas output to JPEG (smaller files than PNG, preserves watermarks & alignments)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          const imageBytes = dataUrlToBytes(dataUrl);

          // Get original layout dimensions for DOCX page mapping (1pt = 20twips)
          const originalViewport = page.getViewport({ scale: 1.0 });
          const pageWidthTwips = Math.round(originalViewport.width * 20);
          const pageHeightTwips = Math.round(originalViewport.height * 20);

          // Convert page dimensions to pixels for the ImageRun transformation (1px = 15twips at 96 DPI)
          const imageWidthPx = Math.round(pageWidthTwips / 15);
          const imageHeightPx = Math.round(pageHeightTwips / 15);

          sections.push({
            properties: {
              page: {
                margin: { top: 0, right: 0, bottom: 0, left: 0 },
                size: {
                  width: pageWidthTwips,
                  height: pageHeightTwips,
                },
              },
            },
            children: [
              new Paragraph({
                indent: { start: 0, end: 0 },
                spacing: { before: 0, after: 0 },
                children: [
                  new ImageRun({
                    data: imageBytes,
                    transformation: {
                      width: imageWidthPx,
                      height: imageHeightPx,
                    },
                    type: 'jpg',
                  }),
                ],
              }),
            ],
          });
        }

        setProgress(90);
        setStatus('Packaging high-fidelity document elements...');

        const doc = new Document({
          sections: sections,
        });

        const blob = await Packer.toBlob(doc);
        setDocxBlob(blob);
      }

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
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  Conversion Mode /
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                  <button
                    type="button"
                    onClick={() => setMode('high-fidelity')}
                    className={`p-3 border rounded text-left flex flex-col justify-between transition-colors ${
                      mode === 'high-fidelity'
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/40 bg-surface'
                    }`}
                  >
                    <span className="font-sans text-xs font-bold text-ink flex items-center gap-1.5">
                      High-Fidelity Layout
                      <span className="bg-accent/10 text-accent text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                        Best
                      </span>
                    </span>
                    <span className="font-sans text-[10px] text-ink-muted mt-1 leading-normal">
                      Preserves all formatting, layout structures, images, shapes, tables, and watermarks exactly as they appear in the PDF.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('editable')}
                    className={`p-3 border rounded text-left flex flex-col justify-between transition-colors ${
                      mode === 'editable'
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/40 bg-surface'
                    }`}
                  >
                    <span className="font-sans text-xs font-bold text-ink">Editable Text Only</span>
                    <span className="font-sans text-[10px] text-ink-muted mt-1 leading-normal">
                      Extracts the text layers into a standard editable Word layout. Formatting and images will be discarded.
                    </span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-accent/5 border border-accent/20 rounded text-xs text-ink-muted leading-relaxed font-sans">
                {mode === 'high-fidelity' ? (
                  <>
                    <strong>Fidelity Notice:</strong> Each PDF page is rendered to a high-quality image and embedded full-page in the Word document. This guarantees 100% exact reproduction of layouts, tables, watermarks, and graphics.
                  </>
                ) : (
                  <>
                    <strong>Fidelity Notice:</strong> Extracts plain text structures from the document's text layers. It produces fully editable text, but custom layouts, graphics, tables, and watermarks will not be preserved.
                  </>
                )}
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
                Word document generated successfully ({mode === 'high-fidelity' ? 'High-Fidelity Layout' : 'Editable Text Only'}).
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

