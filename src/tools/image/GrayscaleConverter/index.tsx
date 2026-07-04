import React, { useState, useRef } from 'react';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob } from '../../../lib/fileHelper';

export const GrayscaleConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [grayscaleBlob, setGrayscaleBlob] = useState<Blob | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      setFile(selected);
      setGrayscaleBlob(null);

      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);

      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
      };
      img.src = url;
    }
  };

  const handleConvert = () => {
    if (!file || !imgRef.current) return;

    setIsProcessing(true);
    setProgress(30);
    setStatus('Applying monochrome filters...');

    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = imgRef.current!.naturalWidth;
        canvas.height = imgRef.current!.naturalHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        // Apply filters directly to canvas context
        // grayscale(100%) combined with custom brightness & contrast percentages
        ctx.filter = `grayscale(100%) brightness(${brightness}%) contrast(${contrast}%)`;
        ctx.drawImage(imgRef.current!, 0, 0);

        setProgress(80);
        setStatus('Compiling black & white image file...');

        canvas.toBlob(
          blob => {
            if (blob) {
              setGrayscaleBlob(blob);
              setProgress(100);
              setStatus('Conversion complete.');
            } else {
              throw new Error('Canvas compilation failed');
            }
            setIsProcessing(false);
          },
          file.type,
          0.95
        );
      } catch (err) {
        console.error(err);
        setStatus('Monochrome conversion failed.');
        setProgress(0);
        setIsProcessing(false);
      }
    }, 200);
  };

  const handleDownload = () => {
    if (grayscaleBlob && file) {
      downloadBlob(grayscaleBlob, `monochrome-${file.name}`);
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setGrayscaleBlob(null);
    setBrightness(100);
    setContrast(100);
    setProgress(0);
    setStatus('');
    imgRef.current = null;
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

          {!grayscaleBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              {/* Dynamic filter preview */}
              {previewUrl && (
                <div className="w-full flex items-center justify-center p-2 bg-bg border border-border rounded max-h-[220px] overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Grayscale preview"
                    className="max-h-[200px] w-auto rounded object-contain transition-all"
                    style={{
                      filter: `grayscale(100%) brightness(${brightness}%) contrast(${contrast}%)`,
                    }}
                  />
                </div>
              )}

              {/* Slider tools */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="brightness-slider" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Brightness /</label>
                    <span className="font-mono text-xs font-bold text-accent bg-bg border border-border px-2 py-0.5 rounded">
                      {brightness}%
                    </span>
                  </div>
                  <input
                    id="brightness-slider"
                    type="range"
                    min="50"
                    max="150"
                    step="5"
                    value={brightness}
                    onChange={e => setBrightness(parseInt(e.target.value))}
                    className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="contrast-slider" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Contrast /</label>
                    <span className="font-mono text-xs font-bold text-accent bg-bg border border-border px-2 py-0.5 rounded">
                      {contrast}%
                    </span>
                  </div>
                  <input
                    id="contrast-slider"
                    type="range"
                    min="50"
                    max="150"
                    step="5"
                    value={contrast}
                    onChange={e => setContrast(parseInt(e.target.value))}
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
                <DownloadButton onClick={handleConvert} label="Apply Grayscale" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {grayscaleBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Monochrome Status /
              </h4>

              <div className="max-w-[200px] border border-border rounded p-1 bg-bg/50">
                <img src={URL.createObjectURL(grayscaleBlob)} alt="Grayscale Result" className="w-full h-auto rounded" />
              </div>

              <p className="text-sm font-sans text-ink">
                Monochrome conversions finished successfully.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Monochrome Image" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GrayscaleConverter;
