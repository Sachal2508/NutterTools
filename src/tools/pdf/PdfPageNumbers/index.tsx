import React, { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';

type Position = 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
type Format = 'number' | 'page-number' | 'page-x-of-y';

export const PdfPageNumbers: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<Position>('bottom-center');
  const [format, setFormat] = useState<Format>('page-x-of-y');
  const [fontSize, setFontSize] = useState<number>(10);
  const [margin, setMargin] = useState<number>(20);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [numberedBlob, setNumberedBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setNumberedBlob(null);
    }
  };

  const handleAddNumbers = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(20);
    setStatus('Loading PDF into workspace...');

    setTimeout(async () => {
      try {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();
        const totalPages = pages.length;

        setProgress(50);
        setStatus('Overlaying coordinates onto document page grids...');

        pages.forEach((page, index) => {
          const pageNum = index + 1;
          
          // Format text
          let text = '';
          if (format === 'number') {
            text = `${pageNum}`;
          } else if (format === 'page-number') {
            text = `Page ${pageNum}`;
          } else if (format === 'page-x-of-y') {
            text = `Page ${pageNum} of ${totalPages}`;
          }

          const { width, height } = page.getSize();
          const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
          const textHeight = helveticaFont.heightAtSize(fontSize);

          // Calculate Coordinates
          let x = 0;
          let y = 0;

          switch (position) {
            case 'bottom-left':
              x = margin;
              y = margin;
              break;
            case 'bottom-center':
              x = (width - textWidth) / 2;
              y = margin;
              break;
            case 'bottom-right':
              x = width - margin - textWidth;
              y = margin;
              break;
            case 'top-left':
              x = margin;
              y = height - margin - textHeight;
              break;
            case 'top-center':
              x = (width - textWidth) / 2;
              y = height - margin - textHeight;
              break;
            case 'top-right':
              x = width - margin - textWidth;
              y = height - margin - textHeight;
              break;
          }

          // Draw the text
          page.drawText(text, {
            x,
            y,
            size: fontSize,
            font: helveticaFont,
            color: rgb(0.36, 0.42, 0.44), // Muted dark grey/blue color (#5C6B70 equivalent)
          });
        });

        setProgress(85);
        setStatus('Compiling modified PDF bytes...');

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes] as any, { type: 'application/pdf' });

        setNumberedBlob(blob);
        setProgress(100);
        setStatus('Page numbers added successfully.');
      } catch (err) {
        console.error(err);
        setStatus('Failed to overlay page numbers.');
        setProgress(0);
      } finally {
        setIsProcessing(false);
      }
    }, 200);
  };

  const handleDownload = () => {
    if (numberedBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(numberedBlob, `${baseName}-numbered.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setNumberedBlob(null);
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

          {!numberedBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              {/* Settings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="position-select" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Numbering Position /</label>
                  <select
                    id="position-select"
                    value={position}
                    onChange={e => setPosition(e.target.value as Position)}
                    className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent font-sans"
                  >
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="format-select" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Numbering Format /</label>
                  <select
                    id="format-select"
                    value={format}
                    onChange={e => setFormat(e.target.value as Format)}
                    className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent font-sans"
                  >
                    <option value="page-x-of-y">"Page X of Y"</option>
                    <option value="page-number">"Page X"</option>
                    <option value="number">Only Page Number ("X")</option>
                  </select>
                </div>
              </div>

              {/* Margins */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="margin-slider" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Offset Margins (pt) /</label>
                    <span className="font-mono text-xs font-bold text-accent bg-bg border border-border px-2 py-0.5 rounded">
                      {margin} pt
                    </span>
                  </div>
                  <input
                    id="margin-slider"
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={margin}
                    onChange={e => setMargin(parseInt(e.target.value))}
                    className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="fontsize-slider" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Font Size /</label>
                    <span className="font-mono text-xs font-bold text-accent bg-bg border border-border px-2 py-0.5 rounded">
                      {fontSize} px
                    </span>
                  </div>
                  <input
                    id="fontsize-slider"
                    type="range"
                    min="8"
                    max="16"
                    step="1"
                    value={fontSize}
                    onChange={e => setFontSize(parseInt(e.target.value))}
                    className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleAddNumbers} label="Add Page Numbers" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {numberedBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Overlay Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                Page numbers successfully written to your PDF.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Numbered PDF" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfPageNumbers;
