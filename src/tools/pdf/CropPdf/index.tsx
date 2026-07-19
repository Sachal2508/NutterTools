import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';

export const CropPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  
  // Crop margins in points (1 inch = 72 points)
  const [cropTop, setCropTop] = useState(40);
  const [cropRight, setCropRight] = useState(40);
  const [cropBottom, setCropBottom] = useState(40);
  const [cropLeft, setCropLeft] = useState(40);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setCroppedBlob(null);
    }
  };

  const handleCropPdf = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(20);
    setStatus('Initializing PDF cropper...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const numPages = pdfDoc.getPageCount();

      setProgress(50);
      setStatus('Adjusting page crop bounds...');

      for (let i = 0; i < numPages; i++) {
        setStatus(`Cropping page ${i + 1} of ${numPages}...`);
        setProgress(50 + Math.round((i / numPages) * 40));

        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();

        // Calculate new crop bounds
        const newX = cropLeft;
        const newY = cropBottom;
        const newWidth = width - cropLeft - cropRight;
        const newHeight = height - cropTop - cropBottom;

        if (newWidth <= 50 || newHeight <= 50) {
          throw new Error('Crop margins are too large. Pages must have at least 50pt width and height.');
        }

        // Set the CropBox metadata properties
        page.setCropBox(newX, newY, newWidth, newHeight);
      }

      setProgress(95);
      setStatus('Saving cropped PDF stream...');
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });

      setCroppedBlob(blob);
      setProgress(100);
      setStatus('Cropping complete.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'Crop failed. Please check your margin entries.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (croppedBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(croppedBlob, `${baseName}-cropped.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCroppedBlob(null);
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

          {!croppedBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                Crop Margins (in points, 72pt = 1 inch) /
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] text-ink-muted uppercase">Top Margin /</span>
                  <input
                    type="number"
                    min={0}
                    value={cropTop}
                    onChange={e => setCropTop(Math.max(0, parseInt(e.target.value) || 0))}
                    className="px-3 py-1.5 border border-border bg-bg text-ink rounded text-xs font-sans focus:border-accent outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] text-ink-muted uppercase">Right Margin /</span>
                  <input
                    type="number"
                    min={0}
                    value={cropRight}
                    onChange={e => setCropRight(Math.max(0, parseInt(e.target.value) || 0))}
                    className="px-3 py-1.5 border border-border bg-bg text-ink rounded text-xs font-sans focus:border-accent outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] text-ink-muted uppercase">Bottom Margin /</span>
                  <input
                    type="number"
                    min={0}
                    value={cropBottom}
                    onChange={e => setCropBottom(Math.max(0, parseInt(e.target.value) || 0))}
                    className="px-3 py-1.5 border border-border bg-bg text-ink rounded text-xs font-sans focus:border-accent outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] text-ink-muted uppercase">Left Margin /</span>
                  <input
                    type="number"
                    min={0}
                    value={cropLeft}
                    onChange={e => setCropLeft(Math.max(0, parseInt(e.target.value) || 0))}
                    className="px-3 py-1.5 border border-border bg-bg text-ink rounded text-xs font-sans focus:border-accent outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-accent/5 border border-accent/20 rounded text-xs text-ink-muted leading-relaxed font-sans">
                <strong>Crop Bounds Notice:</strong> This tool sets the page view bounds (`CropBox`) metadata parameter. The underlying content remains inside, but software viewer applications will crop it out of view.
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleCropPdf} label="Crop PDF Pages" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {croppedBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Crop Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                All pages cropped successfully.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Cropped PDF" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CropPdf;
