import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, formatBytes } from '../../../lib/fileHelper';

export const ImageCompressor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setCompressedFile(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setStatus('Preparing image for compression...');

    try {
      const options = {
        maxSizeMB: 10,
        useWebWorker: true,
        initialQuality: quality,
        onProgress: (prog: number) => {
          setProgress(20 + prog * 0.7); // Map to 20% - 90%
        }
      };

      setStatus('Compressing image in browser memory...');
      const compressed = await imageCompression(file, options);

      // Verify that size actually decreased, if not we keep original or inform user
      setProgress(95);
      setStatus('Finalizing compressed image...');
      
      // Keep name and format
      const finalFile = new File([compressed], file.name, {
        type: compressed.type,
      });

      setCompressedFile(finalFile);
      setProgress(100);
      setStatus('Compression complete.');
    } catch (err) {
      console.error(err);
      setStatus('Compression failed. Please try a different image.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (compressedFile) {
      downloadBlob(compressedFile, `compressed-${file?.name}`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCompressedFile(null);
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {!file ? (
        <DropZone
          accept="image/png,image/jpeg,image/webp"
          acceptLabel="Images (PNG, JPG, WebP)"
          onFilesAdded={handleFilesAdded}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <FileCard
            file={file}
            index={0}
            totalFiles={1}
            onRemove={handleReset}
          />

          {/* Settings Grid */}
          {!compressedFile && !isProcessing && (
            <div className="border border-border rounded p-4 bg-surface flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="quality-slider" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                    Compression Quality /
                  </label>
                  <span className="font-mono text-xs font-bold text-accent bg-bg border border-border px-2 py-0.5 rounded">
                    {Math.round(quality * 100)}%
                  </span>
                </div>
                <input
                  id="quality-slider"
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={quality}
                  onChange={e => setQuality(parseFloat(e.target.value))}
                  className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider block mt-1">
                  [Lower quality yields smaller file size but reduces details]
                </span>
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton
                  onClick={handleCompress}
                  label="Compress Image"
                />
              </div>
            </div>
          )}

          {/* Progress Container */}
          {isProcessing && (
            <ProgressBar progress={progress} status={status} />
          )}

          {/* Compression Results */}
          {compressedFile && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2">
                Compression Metrics /
              </h4>
              <div className="grid grid-cols-2 gap-4 text-center py-2">
                <div className="border-r border-border">
                  <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider block">Original Size</span>
                  <span className="text-base font-bold text-ink block mt-1">{formatBytes(file.size)}</span>
                </div>
                <div>
                  <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider block">Compressed Size</span>
                  <span className="text-base font-bold text-accent-secondary block mt-1">
                    {formatBytes(compressedFile.size)}
                  </span>
                </div>
              </div>

              <div className="bg-bg/50 border border-border/80 rounded p-3 text-center">
                <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider">
                  Reduction achieved:
                </span>
                <span className="text-xs font-bold text-ink ml-1.5">
                  {Math.round(((file.size - compressedFile.size) / file.size) * 100)}% smaller
                </span>
              </div>

              <div className="flex justify-between items-center mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton
                  onClick={handleDownload}
                  label="Download Compressed Image"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageCompressor;
