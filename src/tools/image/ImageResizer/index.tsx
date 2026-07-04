import React, { useState, useRef } from 'react';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob } from '../../../lib/fileHelper';

export const ImageResizer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [percentage, setPercentage] = useState<number>(100);
  const [lockRatio, setLockRatio] = useState(true);
  const [mode, setMode] = useState<'pixels' | 'percent'>('pixels');

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resizedBlob, setResizedBlob] = useState<Blob | null>(null);

  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      setFile(selected);
      setResizedBlob(null);

      // Load image properties
      const img = new Image();
      img.onload = () => {
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);
        setWidth(img.width.toString());
        setHeight(img.height.toString());
        setPercentage(100);
        imageRef.current = img;
      };
      img.src = URL.createObjectURL(selected);
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setWidth(val);
    
    if (lockRatio && originalWidth > 0 && val !== '') {
      const numVal = parseFloat(val);
      if (!isNaN(numVal)) {
        const calculatedHeight = Math.round((numVal / originalWidth) * originalHeight);
        setHeight(calculatedHeight.toString());
      }
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHeight(val);
    
    if (lockRatio && originalHeight > 0 && val !== '') {
      const numVal = parseFloat(val);
      if (!isNaN(numVal)) {
        const calculatedWidth = Math.round((numVal / originalHeight) * originalWidth);
        setWidth(calculatedWidth.toString());
      }
    }
  };

  const handlePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = parseInt(e.target.value);
    setPercentage(pct);
    if (originalWidth > 0) {
      setWidth(Math.round((originalWidth * pct) / 100).toString());
      setHeight(Math.round((originalHeight * pct) / 100).toString());
    }
  };

  const handleResize = () => {
    if (!file || !imageRef.current) return;

    const targetWidth = parseInt(width);
    const targetHeight = parseInt(height);

    if (isNaN(targetWidth) || isNaN(targetHeight) || targetWidth <= 0 || targetHeight <= 0) {
      alert('Please enter valid positive dimensions.');
      return;
    }

    setIsProcessing(true);
    setProgress(30);
    setStatus('Drawing image on canvas...');

    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D context');

        ctx.drawImage(imageRef.current!, 0, 0, targetWidth, targetHeight);
        
        setProgress(70);
        setStatus('Generating export file...');

        canvas.toBlob(
          blob => {
            if (blob) {
              setResizedBlob(blob);
              setProgress(100);
              setStatus('Resizing complete.');
            } else {
              throw new Error('Canvas export returned null');
            }
            setIsProcessing(false);
          },
          file.type,
          0.92
        );
      } catch (err) {
        console.error(err);
        setStatus('Error resizing image.');
        setIsProcessing(false);
        setProgress(0);
      }
    }, 300);
  };

  const handleDownload = () => {
    if (resizedBlob && file) {
      downloadBlob(resizedBlob, `resized-${file.name}`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResizedBlob(null);
    setOriginalWidth(0);
    setOriginalHeight(0);
    setProgress(0);
    setStatus('');
    imageRef.current = null;
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
          <FileCard file={file} index={0} totalFiles={1} onRemove={handleReset} />

          {!resizedBlob && !isProcessing && (
            <div className="border border-border rounded p-4 bg-surface flex flex-col gap-4">
              {/* Mode switcher */}
              <div className="flex border border-border rounded overflow-hidden w-fit font-mono text-[9px] mb-2">
                <button
                  type="button"
                  onClick={() => setMode('pixels')}
                  className={`px-3 py-1.5 uppercase tracking-wider transition-colors ${
                    mode === 'pixels' ? 'bg-accent text-white font-semibold' : 'bg-bg text-ink-muted hover:text-ink'
                  }`}
                >
                  By Pixels
                </button>
                <button
                  type="button"
                  onClick={() => setMode('percent')}
                  className={`px-3 py-1.5 uppercase tracking-wider transition-colors ${
                    mode === 'percent' ? 'bg-accent text-white font-semibold' : 'bg-bg text-ink-muted hover:text-ink'
                  }`}
                >
                  By Percentage
                </button>
              </div>

              {/* Mode-specific controls */}
              {mode === 'pixels' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="resize-width" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Width (px) /</label>
                    <input
                      id="resize-width"
                      type="number"
                      value={width}
                      onChange={handleWidthChange}
                      className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="resize-height" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Height (px) /</label>
                    <input
                      id="resize-height"
                      type="number"
                      value={height}
                      onChange={handleHeightChange}
                      className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="percent-range" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Scale Factor /</label>
                    <span className="font-mono text-xs font-bold text-accent bg-bg border border-border px-2 py-0.5 rounded">
                      {percentage}%
                    </span>
                  </div>
                  <input
                    id="percent-range"
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={percentage}
                    onChange={handlePercentChange}
                    className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>
              )}

              {/* Maintain aspect ratio checkbox */}
              {mode === 'pixels' && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lockRatio}
                    onChange={e => setLockRatio(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-ink-muted font-mono uppercase tracking-wider">
                    Maintain Aspect Ratio ({originalWidth}x{originalHeight})
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleResize} label="Resize Image" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {resizedBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Resize Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                Your image was successfully resized to{' '}
                <strong className="text-accent">{width}px × {height}px</strong>
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Resized Image" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageResizer;
