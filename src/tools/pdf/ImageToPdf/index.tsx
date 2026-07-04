import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import heic2any from 'heic2any';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob } from '../../../lib/fileHelper';

export const ImageToPdf: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFilesAdded = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setPdfBlob(null);
  };

  const handleRemove = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPdfBlob(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setFiles(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
    setPdfBlob(null);
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
    setPdfBlob(null);
  };

  // HTML5 Drag & Drop
  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setFiles(prev => {
      const copy = [...prev];
      const item = copy.splice(draggedIndex, 1)[0];
      copy.splice(index, 0, item);
      return copy;
    });
    setDraggedIndex(index);
  };
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setPdfBlob(null);
  };

  const convertImageToJpegBytes = async (file: File): Promise<{ bytes: Uint8Array; width: number; height: number }> => {
    let activeFile = file;

    // 1. HEIC conversion
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'heic' || file.type === 'image/heic') {
      const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
      const blob = Array.isArray(result) ? result[0] : result;
      activeFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
    }

    // 2. Load image into canvas to extract normalized JPEG bytes
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(activeFile);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not get 2D context');

          // Draw white background (handles transparent PNG/GIF/WebP)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          URL.revokeObjectURL(url);

          // Decode Data URL to bytes
          const base64 = dataUrl.split(',')[1];
          const binaryString = window.atob(base64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          resolve({
            bytes,
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image element'));
      };
      img.src = url;
    });
  };

  const handleCompilePdf = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(10);
    setStatus('Initializing PDF builder...');

    try {
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStatus(`Processing image ${i + 1} of ${files.length}: "${file.name}"...`);
        setProgress(15 + (i / files.length) * 70);

        const { bytes, width, height } = await convertImageToJpegBytes(file);
        
        // Embed the JPEG into the PDF
        const embeddedImg = await pdfDoc.embedJpg(bytes);
        
        // Add A4 or exact image-sized page (we use exact dimensions to preserve ratio)
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });
      }

      setProgress(90);
      setStatus('Saving PDF indexing blocks...');

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes] as any, { type: 'application/pdf' });

      setPdfBlob(blob);
      setProgress(100);
      setStatus('PDF compilation complete.');
    } catch (err) {
      console.error(err);
      setStatus('Failed to build PDF. Ensure images are not corrupted.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (pdfBlob) {
      downloadBlob(pdfBlob, `compiled-images-${Date.now()}.pdf`);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setPdfBlob(null);
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <DropZone
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,.heic"
        acceptLabel="Images (PNG, JPEG, WebP, BMP, GIF, HEIC)"
        multiple={true}
        onFilesAdded={handleFilesAdded}
      />

      {files.length > 0 && (
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
              Images to compile ({files.length}) /
            </span>
            <button
              onClick={handleReset}
              className="font-mono text-[9px] text-ink-muted hover:text-danger uppercase tracking-wider transition-colors"
            >
              [Clear all]
            </button>
          </div>

          {/* List grid */}
          <div className="flex flex-col gap-2">
            {files.map((file, idx) => (
              <FileCard
                key={`${file.name}-${idx}`}
                file={file}
                index={idx}
                totalFiles={files.length}
                onRemove={() => handleRemove(idx)}
                onMoveUp={() => handleMoveUp(idx)}
                onMoveDown={() => handleMoveDown(idx)}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={handleDragEnd}
              />
            ))}
          </div>

          {!pdfBlob && !isProcessing && (
            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <DownloadButton
                onClick={handleCompilePdf}
                label="Generate PDF"
                disabled={files.length === 0}
              />
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {pdfBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                PDF Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                Compiled <strong className="text-accent">{files.length} images</strong> into a PDF successfully.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download compiled PDF" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageToPdf;
