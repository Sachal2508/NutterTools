import React, { useState, useRef, useEffect } from 'react';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import { Pipette, Copy, ClipboardCheck } from 'lucide-react';

export const ImageColorPicker: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Active color values
  const [hex, setHex] = useState('#ffffff');
  const [rgbVal, setRgbVal] = useState('rgb(255, 255, 255)');
  const [hslVal, setHslVal] = useState('hsl(0, 0%, 100%)');
  
  const [copied, setCopied] = useState(false);
  const [loupeVisible, setLoupeVisible] = useState(false);
  const [loupePos, setLoupePos] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const zoomCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
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
      // Set display scale width to fit container width nicely (e.g. 400px wide)
      const containerWidth = 400;
      const scale = containerWidth / img.width;
      canvas.width = containerWidth;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Color coordinate conversion logic
  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (c: number) => {
      const hexCode = c.toString(16);
      return hexCode.length === 1 ? '0' + hexCode : hexCode;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);

    // Get pixel details
    const pixelData = ctx.getImageData(x, y, 1, 1).data;
    const r = pixelData[0];
    const g = pixelData[1];
    const b = pixelData[2];

    const currentHex = rgbToHex(r, g, b);
    setHex(currentHex);
    setRgbVal(`rgb(${r}, ${g}, ${b})`);
    setHslVal(rgbToHsl(r, g, b));

    // Loupe coordinate follow
    setLoupeVisible(true);
    setLoupePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    // Render zoomed-in loupe canvas magnifier grid
    renderZoomLoupe(ctx, x, y);
  };

  const renderZoomLoupe = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const zoomCanvas = zoomCanvasRef.current;
    if (!zoomCanvas) return;
    const zoomCtx = zoomCanvas.getContext('2d');
    if (!zoomCtx) return;

    zoomCtx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);
    
    // Draw 9x9 pixels surrounding the target coordinate
    const zoomSize = 9;
    const scale = zoomCanvas.width / zoomSize; // scale grid cells

    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const px = x + dx;
        const py = y + dy;
        
        try {
          const pixel = ctx.getImageData(px, py, 1, 1).data;
          zoomCtx.fillStyle = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
          zoomCtx.fillRect((dx + 4) * scale, (dy + 4) * scale, scale, scale);
        } catch (err) {
          zoomCtx.fillStyle = '#000000';
          zoomCtx.fillRect((dx + 4) * scale, (dy + 4) * scale, scale, scale);
        }
      }
    }

    // Draw central target grid overlay border
    zoomCtx.strokeStyle = '#FFFFFF';
    zoomCtx.lineWidth = 1.5;
    zoomCtx.strokeRect(4 * scale, 4 * scale, scale, scale);
  };

  const handleMouseLeave = () => {
    setLoupeVisible(false);
  };

  const handleCopyColor = (valStr: string) => {
    navigator.clipboard.writeText(valStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFile(null);
    setImageSrc(null);
    setHex('#ffffff');
    setRgbVal('rgb(255, 255, 255)');
    setHslVal('hsl(0, 0%, 100%)');
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {!imageSrc ? (
        <DropZone accept="image/*" acceptLabel="Design image source" onFilesAdded={handleFilesAdded} />
      ) : (
        <div className="flex flex-col gap-4 animate-fade-in">
          <FileCard file={file!} index={0} totalFiles={1} onRemove={handleReset} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Color Details Panel */}
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 h-fit">
              <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2">
                Color Metadata /
              </span>

              {/* Color swatch preview */}
              <div 
                style={{ backgroundColor: hex }}
                className="w-full h-20 rounded border border-border shadow-inner transition-colors duration-100"
              />

              <div className="flex flex-col gap-3 py-1">
                <div className="flex justify-between items-center bg-bg/50 border border-border/40 p-2 rounded">
                  <div>
                    <span className="font-mono text-[8px] text-ink-muted uppercase block">HEX Color Code</span>
                    <span className="text-xs font-mono font-bold text-ink">{hex}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyColor(hex)}
                    className="p-1.5 border border-border bg-surface text-ink-muted hover:text-accent rounded transition-colors"
                  >
                    {copied ? <ClipboardCheck size={13} className="text-success" /> : <Copy size={13} />}
                  </button>
                </div>

                <div className="flex justify-between items-center bg-bg/50 border border-border/40 p-2 rounded">
                  <div>
                    <span className="font-mono text-[8px] text-ink-muted uppercase block">RGB Tuple</span>
                    <span className="text-xs font-mono font-bold text-ink">{rgbVal}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyColor(rgbVal)}
                    className="p-1.5 border border-border bg-surface text-ink-muted hover:text-accent rounded transition-colors"
                  >
                    {copied ? <ClipboardCheck size={13} className="text-success" /> : <Copy size={13} />}
                  </button>
                </div>

                <div className="flex justify-between items-center bg-bg/50 border border-border/40 p-2 rounded">
                  <div>
                    <span className="font-mono text-[8px] text-ink-muted uppercase block">HSL Values</span>
                    <span className="text-xs font-mono font-bold text-ink">{hslVal}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyColor(hslVal)}
                    className="p-1.5 border border-border bg-surface text-ink-muted hover:text-accent rounded transition-colors"
                  >
                    {copied ? <ClipboardCheck size={13} className="text-success" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {copied && (
                <div className="text-center text-xs text-success bg-success/5 border border-success/20 p-2 rounded font-sans leading-none">
                  Copied Color to Clipboard!
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

            {/* Magnifier Canvas Preview */}
            <div className="lg:col-span-2 border border-border rounded bg-surface p-4 flex flex-col gap-4 text-center items-center justify-center">
              <div className="flex justify-between items-center border-b border-border pb-2 w-full">
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  <Pipette size={12} className="text-accent" /> Canvas color picker /
                </span>
              </div>

              <div className="relative border border-border/60 bg-black/5 rounded overflow-hidden shadow-sm mt-4 select-none cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleCopyColor(hex)}
                  className="block mx-auto max-w-full"
                />

                {/* Floating zoomed loupe magnifier bubble */}
                {loupeVisible && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${loupePos.x}px`,
                      top: `${loupePos.y}px`,
                      transform: 'translate(-50%, -125%)',
                      pointerEvents: 'none',
                    }}
                    className="flex flex-col items-center justify-center border border-border bg-white rounded shadow-lg p-1.5 aspect-square w-24 overflow-hidden"
                  >
                    <canvas ref={zoomCanvasRef} width={80} height={80} className="w-full h-full rounded border border-border bg-white" />
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ImageColorPicker;
