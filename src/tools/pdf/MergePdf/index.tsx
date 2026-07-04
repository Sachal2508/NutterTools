import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';

export const MergePdf: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);

  // Drag state for list reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFilesAdded = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setMergedBlob(null);
  };

  const handleRemove = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setMergedBlob(null);
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
    setMergedBlob(null);
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
    setMergedBlob(null);
  };

  // HTML5 Drag and Drop Handlers for Reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Perform live swap for visual feedback
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
    setMergedBlob(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      alert('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setStatus('Initializing workspace...');

    try {
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStatus(`Reading document ${i + 1} of ${files.length}: "${file.name}"...`);
        setProgress(15 + (i / files.length) * 60);

        const arrayBuffer = await readFileAsArrayBuffer(file);
        
        // Handle password protected files
        let srcPdf;
        try {
          srcPdf = await PDFDocument.load(arrayBuffer);
        } catch (loadErr: any) {
          if (loadErr.message?.includes('password') || loadErr.message?.includes('encrypted')) {
            throw new Error(`"${file.name}" is password-protected. Please unlock it first.`);
          }
          throw loadErr;
        }

        const pages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }

      setProgress(85);
      setStatus('Compressing structural indexes and generating merged PDF...');
      
      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes] as any, { type: 'application/pdf' });
      
      setMergedBlob(blob);
      setProgress(100);
      setStatus('Merge complete.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'An error occurred while merging your PDF files.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (mergedBlob) {
      downloadBlob(mergedBlob, `merged-${Date.now()}.pdf`);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setMergedBlob(null);
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <DropZone
        accept="application/pdf"
        acceptLabel="PDF files"
        multiple={true}
        onFilesAdded={handleFilesAdded}
      />

      {files.length > 0 && (
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
              Files to merge ({files.length}) /
            </span>
            <button
              onClick={handleReset}
              className="font-mono text-[9px] text-ink-muted hover:text-danger uppercase tracking-wider transition-colors"
            >
              [Clear all]
            </button>
          </div>

          {/* List of files with drag to reorder */}
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

          {!mergedBlob && !isProcessing && (
            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <DownloadButton
                onClick={handleMerge}
                label="Merge PDFs"
                disabled={files.length < 2}
              />
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {mergedBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Merge Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                Merged <strong className="text-accent">{files.length} files</strong> successfully.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Merged PDF" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MergePdf;
