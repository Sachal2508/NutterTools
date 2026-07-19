import React, { useState, useEffect, useRef } from 'react';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import { Palette, Copy, ClipboardCheck } from 'lucide-react';

interface ColorItem {
  hex: string;
  rgb: string;
}

export const ColorPaletteExtractor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [palette, setPalette] = useState<ColorItem[]>([]);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setPalette([]);
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(files[0]);
    }
  };

  useEffect(() => {
    if (!imageSrc) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Draw image at small size to optimize pixel counting
      canvas.width = 60;
      canvas.height = 60;
      ctx.drawImage(img, 0, 0, 60, 60);

      // Extract colors
      const imgData = ctx.getImageData(0, 0, 60, 60).data;
      const extracted = extractPaletteColors(imgData, 5);
      setPalette(extracted);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Basic color clustering to find dominant, visually separated colors
  const extractPaletteColors = (imgData: Uint8ClampedArray, count: number): ColorItem[] => {
    const colors: { r: number; g: number; b: number; count: number }[] = [];
    
    // Step 1: Accumulate color counts (reduce color precision to 5 bits per channel to group similar shades)
    const step = 4; // Sample every 4th pixel for speed
    for (let i = 0; i < imgData.length; i += 4 * step) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const a = imgData[i + 3];

      // Ignore transparent pixels
      if (a < 128) continue;

      // Group close colors by bucket rounding
      const bucketSize = 16;
      const br = Math.round(r / bucketSize) * bucketSize;
      const bg = Math.round(g / bucketSize) * bucketSize;
      const bb = Math.round(b / bucketSize) * bucketSize;

      const existing = colors.find(c => Math.abs(c.r - br) < 20 && Math.abs(c.g - bg) < 20 && Math.abs(c.b - bb) < 20);
      if (existing) {
        existing.count++;
      } else {
        colors.push({ r: br, g: bg, b: bb, count: 1 });
      }
    }

    // Step 2: Sort by frequency
    colors.sort((a, b) => b.count - a.count);

    // Step 3: Pick the top N colors that are visually distinct
    const result: ColorItem[] = [];
    const colorDistance = (c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }) => {
      return Math.sqrt((c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2);
    };

    for (let i = 0; i < colors.length && result.length < count; i++) {
      const c = colors[i];
      // Keep colors that have a distance threshold from existing selections
      const isDistinct = result.every(res => {
        const parts = res.rgb.replace(/[^\d,]/g, '').split(',').map(Number);
        return colorDistance(c, { r: parts[0], g: parts[1], b: parts[2] }) > 65;
      });

      if (isDistinct || result.length === 0) {
        const hexStr = '#' + [c.r, c.g, c.b].map(x => {
          const hex = Math.min(255, Math.max(0, x)).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('');
        
        result.push({
          hex: hexStr,
          rgb: `rgb(${c.r}, ${c.g}, ${c.b})`
        });
      }
    }

    // Fill remaining slots if distinct colors are too few
    while (result.length < count && colors.length > result.length) {
      const c = colors[result.length];
      const hexStr = '#' + [c.r, c.g, c.b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
      result.push({ hex: hexStr, rgb: `rgb(${c.r}, ${c.g}, ${c.b})` });
    }

    return result;
  };

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const handleReset = () => {
    setFile(null);
    setImageSrc(null);
    setPalette([]);
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {!imageSrc ? (
        <DropZone accept="image/*" acceptLabel="Color palette image" onFilesAdded={handleFilesAdded} />
      ) : (
        <div className="flex flex-col gap-4 animate-fade-in">
          <FileCard file={file!} index={0} totalFiles={1} onRemove={handleReset} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Color Palette Cards */}
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 h-fit">
              <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2">
                Dominant Palette /
              </span>

              {palette.length > 0 ? (
                <div className="flex flex-col gap-3 py-1">
                  {palette.map((color, idx) => (
                    <div 
                      key={color.hex} 
                      onClick={() => handleCopyColor(color.hex)}
                      className="flex items-center gap-3 border border-border/40 bg-bg/50 p-2 rounded cursor-pointer hover:border-accent/40 hover:shadow-sm transition-all"
                    >
                      <div 
                        style={{ backgroundColor: color.hex }}
                        className="w-10 h-10 rounded border border-border/30 shadow-inner"
                      />
                      <div>
                        <span className="font-mono text-[8px] text-ink-muted uppercase block">Color #{idx + 1}</span>
                        <span className="text-xs font-mono font-bold text-ink">{color.hex}</span>
                        <span className="text-[9px] font-mono text-ink-muted">{color.rgb}</span>
                      </div>
                      <button
                        type="button"
                        className="p-1.5 border border-border bg-surface text-ink-muted rounded ml-auto"
                      >
                        {copiedHex === color.hex ? <ClipboardCheck size={12} className="text-success" /> : <Copy size={12} />}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 border border-border/60 bg-bg text-center rounded text-xs text-ink-muted italic">
                  Sampling dominant colors...
                </div>
              )}

              {copiedHex && (
                <div className="text-center text-xs text-success bg-success/5 border border-success/20 p-2 rounded font-sans leading-none">
                  Copied {copiedHex} to Clipboard!
                </div>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase hover:text-ink hover:bg-bg transition-colors"
              >
                Reset Image
              </button>
            </div>

            {/* Image Preview */}
            <div className="lg:col-span-2 border border-border rounded bg-surface p-4 flex flex-col gap-4 text-center items-center justify-center">
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                <Palette size={12} className="text-accent" /> Palette Extractor Preview /
              </span>

              <div className="relative border border-border/50 bg-black/5 rounded overflow-hidden aspect-[1.3/1] max-w-sm w-full flex items-center justify-center mt-4">
                <img src={imageSrc} alt="Palette source preview" className="max-w-full max-h-full object-contain" />
              </div>

              {/* Offscreen sampling canvas */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPaletteExtractor;
