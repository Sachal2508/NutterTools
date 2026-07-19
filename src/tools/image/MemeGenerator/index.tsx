import React, { useState, useEffect, useRef } from 'react';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob } from '../../../lib/fileHelper';
import { Eye } from 'lucide-react';

export const MemeGenerator: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  // Texts state
  const [topText, setTopText] = useState('TOP CAPTION TEXT');
  const [bottomText, setBottomText] = useState('BOTTOM CAPTION TEXT');
  const [fontSize, setFontSize] = useState(36);
  const [textColor, setTextColor] = useState('#ffffff');
  const [outlineColor, setOutlineColor] = useState('#000000');
  const [outlineWidth, setOutlineWidth] = useState(4);
  const [uppercase, setUppercase] = useState(true);

  // Position control (percentage from center-top/center-bottom)
  const [topTextY, setTopTextY] = useState(10); // percentage from top
  const [bottomTextY, setBottomTextY] = useState(90); // percentage from top
  const [activeDrag, setActiveDrag] = useState<'top' | 'bottom' | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      const f = files[0];
      setFile(f);
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  // Re-draw canvas on any text / styling updates
  useEffect(() => {
    if (!imageSrc) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size matching the image dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw background image
      ctx.drawImage(img, 0, 0);

      // Draw top text
      drawStyledText(
        ctx,
        uppercase ? topText.toUpperCase() : topText,
        canvas.width / 2,
        (topTextY / 100) * canvas.height
      );

      // Draw bottom text
      drawStyledText(
        ctx,
        uppercase ? bottomText.toUpperCase() : bottomText,
        canvas.width / 2,
        (bottomTextY / 100) * canvas.height
      );
    };
    img.src = imageSrc;
  }, [imageSrc, topText, bottomText, fontSize, textColor, outlineColor, outlineWidth, uppercase, topTextY, bottomTextY]);

  const drawStyledText = (ctx: CanvasRenderingContext2D, textStr: string, x: number, y: number) => {
    ctx.font = `bold ${fontSize}px Impact, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = outlineWidth;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw outline first, then text fill
    ctx.strokeText(textStr, x, y);
    ctx.fillText(textStr, x, y);
  };

  // Interactive mouse/touch dragging parameters
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Detect closest active text layer Y coordinate (topTextY or bottomTextY)
    const distToTop = Math.abs(clickY - topTextY);
    const distToBottom = Math.abs(clickY - bottomTextY);

    if (distToTop < 12 && distToTop < distToBottom) {
      setActiveDrag('top');
    } else if (distToBottom < 12) {
      setActiveDrag('bottom');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeDrag || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newY = Math.min(98, Math.max(2, ((e.clientY - rect.top) / rect.height) * 100));

    if (activeDrag === 'top') {
      setTopTextY(newY);
    } else {
      setBottomTextY(newY);
    }
  };

  const handleMouseUp = () => {
    setActiveDrag(null);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas && file) {
      canvas.toBlob((blob) => {
        if (blob) {
          const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
          downloadBlob(blob, `${baseName}-meme.jpg`);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImageSrc(null);
    setTopText('TOP CAPTION TEXT');
    setBottomText('BOTTOM CAPTION TEXT');
    setTopTextY(10);
    setBottomTextY(90);
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {!imageSrc ? (
        <DropZone accept="image/*" acceptLabel="Meme image base" onFilesAdded={handleFilesAdded} />
      ) : (
        <div className="flex flex-col gap-4">
          <FileCard file={file!} index={0} totalFiles={1} onRemove={handleReset} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Editor Controls */}
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 h-fit">
              <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                Meme Text & styling /
              </span>

              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[9px] text-ink-muted uppercase">Top Caption /</span>
                <input
                  type="text"
                  value={topText}
                  onChange={e => setTopText(e.target.value)}
                  className="px-3 py-1.5 border border-border bg-bg text-ink rounded text-xs focus:border-accent outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[9px] text-ink-muted uppercase">Bottom Caption /</span>
                <input
                  type="text"
                  value={bottomText}
                  onChange={e => setBottomText(e.target.value)}
                  className="px-3 py-1.5 border border-border bg-bg text-ink rounded text-xs focus:border-accent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] text-ink-muted uppercase">Font Size ({fontSize}px) /</span>
                  <input
                    type="range"
                    min={16}
                    max={80}
                    value={fontSize}
                    onChange={e => setFontSize(parseInt(e.target.value))}
                    className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] text-ink-muted uppercase">Stroke Size ({outlineWidth}px) /</span>
                  <input
                    type="range"
                    min={0}
                    max={12}
                    value={outlineWidth}
                    onChange={e => setOutlineWidth(parseInt(e.target.value))}
                    className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] text-ink-muted uppercase">Text Color /</span>
                  <input
                    type="color"
                    value={textColor}
                    onChange={e => setTextColor(e.target.value)}
                    className="w-full h-8 border border-border rounded bg-bg cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] text-ink-muted uppercase">Outline Color /</span>
                  <input
                    type="color"
                    value={outlineColor}
                    onChange={e => setOutlineColor(e.target.value)}
                    className="w-full h-8 border border-border rounded bg-bg cursor-pointer"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-ink-muted leading-relaxed mt-2">
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={e => setUppercase(e.target.checked)}
                  className="w-4 h-4 border border-border rounded accent-accent bg-surface"
                />
                Force UPPERCASE text formatting
              </label>

              <div className="p-3 bg-accent/5 border border-accent/20 rounded text-[10px] text-ink-muted leading-relaxed">
                <strong>💡 Drag Tip:</strong> You can click and drag text captions vertically directly inside the preview screen to reposition them.
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleDownload} label="Download Meme" />
              </div>
            </div>

            {/* Interactive Canvas Preview */}
            <div className="lg:col-span-2 border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2">
                <Eye size={12} /> Interactive Preview Canvas /
              </span>

              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="relative border border-border/60 bg-black/5 rounded overflow-hidden shadow-sm mx-auto cursor-ns-resize max-w-md w-full select-none"
              >
                {/* Render canvas */}
                <canvas ref={canvasRef} className="w-full h-auto object-contain block" />
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default MemeGenerator;
