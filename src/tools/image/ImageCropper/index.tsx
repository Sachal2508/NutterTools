import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob } from '../../../lib/fileHelper';

export const ImageCropper: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined); // undefined = freeform
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

  const presets = [
    { label: 'Freeform', value: undefined },
    { label: 'Square (1:1)', value: 1 },
    { label: 'Widescreen (16:9)', value: 16 / 9 },
    { label: 'Standard (4:3)', value: 4 / 3 },
    { label: 'Portrait (3:4)', value: 3 / 4 },
  ];

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      setFile(selected);
      setImageSrc(URL.createObjectURL(selected));
      setCroppedBlob(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels || !file) return;

    setIsProcessing(true);
    setProgress(30);
    setStatus('Cropping image on local canvas...');

    setTimeout(async () => {
      try {
        const image = new Image();
        image.src = imageSrc;
        await new Promise((resolve) => (image.onload = resolve));

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D context');

        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        setProgress(80);
        setStatus('Generating cropped file...');

        canvas.toBlob(
          (blob) => {
            if (blob) {
              setCroppedBlob(blob);
              setProgress(100);
              setStatus('Cropping complete.');
            } else {
              throw new Error('Canvas export failed');
            }
            setIsProcessing(false);
          },
          file.type,
          0.95
        );
      } catch (err) {
        console.error(err);
        setStatus('Error cropping image.');
        setIsProcessing(false);
        setProgress(0);
      }
    }, 200);
  };

  const handleDownload = () => {
    if (croppedBlob && file) {
      downloadBlob(croppedBlob, `cropped-${file.name}`);
    }
  };

  const handleReset = () => {
    if (imageSrc) {
      URL.revokeObjectURL(imageSrc);
    }
    setFile(null);
    setImageSrc(null);
    setCroppedBlob(null);
    setCroppedAreaPixels(null);
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
          <FileCard file={file} index={0} totalFiles={1} onRemove={handleReset} />

          {!croppedBlob && !isProcessing && imageSrc && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              {/* Presets panel */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  Aspect Ratio Presets /
                </span>
                <div className="flex flex-wrap gap-1.5 font-mono text-[9px]">
                  {presets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAspect(preset.value)}
                      className={`px-3 py-1.5 border rounded uppercase tracking-wider transition-colors ${
                        aspect === preset.value
                          ? 'bg-accent text-white border-accent'
                          : 'bg-bg text-ink border-border hover:border-accent hover:text-accent'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Crop Box Area */}
              <div className="relative w-full h-[320px] bg-bg border border-border rounded overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  classes={{
                    containerClassName: 'bg-bg',
                  }}
                />
              </div>

              {/* Zoom controls */}
              <div className="flex flex-col gap-1 border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <label htmlFor="zoom-slider" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Zoom factor /</label>
                  <span className="font-mono text-xs font-bold text-accent bg-bg border border-border px-2 py-0.5 rounded">
                    {zoom.toFixed(1)}x
                  </span>
                </div>
                <input
                  id="zoom-slider"
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleCrop} label="Crop Image" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {croppedBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Crop Status /
              </h4>
              
              <div className="max-w-[200px] border border-border rounded p-1.5 bg-bg/50">
                <img src={URL.createObjectURL(croppedBlob)} alt="Cropped Preview" className="w-full h-auto rounded" />
              </div>

              <p className="text-sm font-sans text-ink mt-2">
                Image was cropped successfully in your browser window.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Cropped Image" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageCropper;
