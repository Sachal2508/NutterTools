import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob } from '../../../lib/fileHelper';

interface Preset {
  name: string;
  wMm: number;
  hMm: number;
  label: string;
  description: string;
}

export const PassportPhotoMaker: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  
  const presets: Preset[] = [
    { name: 'us', wMm: 51, hMm: 51, label: 'United States / India (2" x 2")', description: '51mm x 51mm, square' },
    { name: 'uk_schengen', wMm: 35, hMm: 45, label: 'United Kingdom / Schengen / PK (35 x 45 mm)', description: '35mm x 45mm, standard portrait' },
    { name: 'ca', wMm: 50, hMm: 70, label: 'Canada / ID Card (50 x 70 mm)', description: '50mm x 70mm, taller portrait' }
  ];

  const [activePreset, setActivePreset] = useState<Preset>(presets[0]);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [printSheetBlob, setPrintSheetBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      setFile(selected);
      setImageSrc(URL.createObjectURL(selected));
      setPrintSheetBlob(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCreatePrintSheet = async () => {
    if (!imageSrc || !croppedAreaPixels || !file) return;

    setIsProcessing(true);
    setProgress(20);
    setStatus('Cropping portrait layout...');

    setTimeout(async () => {
      try {
        const image = new Image();
        image.src = imageSrc;
        await new Promise((resolve) => (image.onload = resolve));

        // Step 1: Crop the passport photo face
        const faceCanvas = document.createElement('canvas');
        faceCanvas.width = croppedAreaPixels.width;
        faceCanvas.height = croppedAreaPixels.height;
        const faceCtx = faceCanvas.getContext('2d');
        if (!faceCtx) throw new Error('Could not get face canvas context');

        faceCtx.drawImage(
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

        setProgress(50);
        setStatus('Creating printable 4" x 6" grid sheet...');

        // Step 2: Lay it out in a grid on a standard 4x6 inch canvas (300 DPI = 1200 x 1800 pixels)
        // Aspect ratio is 4:6 (W:H) -> 1200 x 1800
        const printCanvas = document.createElement('canvas');
        printCanvas.width = 1200;
        printCanvas.height = 1800;
        const printCtx = printCanvas.getContext('2d');
        if (!printCtx) throw new Error('Could not get print canvas context');

        // Fill with white background
        printCtx.fillStyle = '#FFFFFF';
        printCtx.fillRect(0, 0, printCanvas.width, printCanvas.height);

        // Draw header info (non-printable margins area)
        printCtx.fillStyle = '#97A0A3';
        printCtx.font = 'bold 20px monospace';
        printCtx.fillText('THE WORKBENCH | PASSPORT PHOTO SHEET (4" x 6")', 50, 60);
        printCtx.font = '14px monospace';
        printCtx.fillText(`Preset: ${activePreset.label.toUpperCase()} - 100% Client-Side`, 50, 85);

        // Calculate positions
        // 4x6 in paper is 101.6mm x 152.4mm
        const sheetWidthMm = 101.6;
        const sheetHeightMm = 152.4;

        // Convert dimensions from mm to pixels on 1200x1800 sheet
        const photoWidthPx = Math.round((activePreset.wMm / sheetWidthMm) * printCanvas.width);
        const photoHeightPx = Math.round((activePreset.hMm / sheetHeightMm) * printCanvas.height);

        // Calculate grid layout
        let cols = 2;
        let rows = 3;

        if (activePreset.name === 'uk_schengen') {
          cols = 2;
          rows = 3; // Standard 6 copies on a sheet, nicely spaced
        } else if (activePreset.name === 'ca') {
          cols = 2;
          rows = 2; // Fit 4 copies
        }

        // Spacing calculations
        const startY = 180; // offset below header text
        const availableHeight = printCanvas.height - startY;

        const totalGridWidth = cols * photoWidthPx;
        const totalGridHeight = rows * photoHeightPx;

        const gapX = cols > 1 ? (printCanvas.width - 100 - totalGridWidth) / (cols - 1) : 0;
        const gapY = rows > 1 ? (availableHeight - 100 - totalGridHeight) / (rows - 1) : 0;

        const startX = 50;

        setProgress(75);
        setStatus('Drawing photos and cutting guides...');

        // Draw grid
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = startX + c * (photoWidthPx + gapX);
            const y = startY + r * (photoHeightPx + gapY);

            // Draw photo
            printCtx.drawImage(faceCanvas, x, y, photoWidthPx, photoHeightPx);

            // Draw cutting guidelines (very fine grey border)
            printCtx.strokeStyle = '#DCD6C9';
            printCtx.lineWidth = 1;
            printCtx.strokeRect(x - 1, y - 1, photoWidthPx + 2, photoHeightPx + 2);
          }
        }

        setProgress(95);
        setStatus('Compiling print sheet image...');

        printCanvas.toBlob(
          (blob) => {
            if (blob) {
              setPrintSheetBlob(blob);
              setProgress(100);
              setStatus('Print sheet generated successfully.');
            } else {
              throw new Error('Print canvas compilation failed');
            }
            setIsProcessing(false);
          },
          'image/jpeg',
          0.98
        );
      } catch (err) {
        console.error(err);
        setStatus('Failed to generate print sheet.');
        setIsProcessing(false);
        setProgress(0);
      }
    }, 300);
  };

  const handleDownload = () => {
    if (printSheetBlob) {
      downloadBlob(printSheetBlob, `passport-print-sheet-${activePreset.name}.jpg`);
    }
  };

  const handleReset = () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setFile(null);
    setImageSrc(null);
    setPrintSheetBlob(null);
    setCroppedAreaPixels(null);
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {!file ? (
        <DropZone
          accept="image/png,image/jpeg,image/webp"
          acceptLabel="Portrait Images (PNG, JPG, WebP)"
          onFilesAdded={handleFilesAdded}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <FileCard file={file} index={0} totalFiles={1} onRemove={handleReset} />

          {!printSheetBlob && !isProcessing && imageSrc && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              {/* Presets */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  Select Passport Dimension Template /
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setActivePreset(preset)}
                      className={`p-3 border rounded text-left flex flex-col justify-between transition-colors ${
                        activePreset.name === preset.name
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-accent/40 bg-surface'
                      }`}
                    >
                      <span className="font-sans text-xs font-bold text-ink">{preset.label}</span>
                      <span className="font-mono text-[9px] text-ink-muted uppercase mt-1">
                        {preset.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cropper area */}
              <div className="flex flex-col gap-1 border-t border-border pt-4">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-2">
                  Crop face and shoulders /
                </span>
                <div className="relative w-full h-[320px] bg-bg border border-border rounded overflow-hidden">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={activePreset.wMm / activePreset.hMm}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>
              </div>

              {/* Zoom */}
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
                <DownloadButton onClick={handleCreatePrintSheet} label="Generate Printable Grid" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {printSheetBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Sheet Status /
              </h4>

              <div className="max-w-[180px] border border-border rounded p-1 bg-bg/50 shadow-inner">
                <img src={URL.createObjectURL(printSheetBlob)} alt="Printable Grid Preview" className="w-full h-auto" />
              </div>

              <p className="text-xs text-ink-muted leading-relaxed max-w-sm mt-2">
                Your <strong>4" × 6" printable sheet</strong> is ready. Printing this sheet on standard photo paper yields multiple exact-sized passport photos.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Printable JPG" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PassportPhotoMaker;
