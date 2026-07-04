import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob } from '../../../lib/fileHelper';
import { Pencil, Type as TypeIcon, RotateCcw } from 'lucide-react';

export const SignatureMaker: React.FC = () => {
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [penColor, setPenColor] = useState('#1E2A2F');
  const [penWidth, setPenWidth] = useState(2.5);

  // Type signature states
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState('Caveat');
  const [typedColor, setTypedColor] = useState('#1E2A2F');

  const sigCanvasRef = useRef<SignatureCanvas | null>(null);

  const colors = [
    { label: 'Charcoal', hex: '#1E2A2F' },
    { label: 'Navy Blue', hex: '#1D4ED8' },
    { label: 'Dark Red', hex: '#B4453A' }
  ];

  const fonts = [
    { name: 'Caveat', family: '"Caveat", cursive' },
    { name: 'Pacifico', family: '"Pacifico", cursive' },
    { name: 'Great Vibes', family: '"Great Vibes", cursive' },
    { name: 'Sacramento', family: '"Sacramento", cursive' }
  ];

  const handleClear = () => {
    if (mode === 'draw' && sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    } else {
      setTypedName('');
    }
  };

  const handleDownload = () => {
    if (mode === 'draw') {
      if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
        const canvas = sigCanvasRef.current.getTrimmedCanvas();
        canvas.toBlob(blob => {
          if (blob) {
            downloadBlob(blob, `signature-${Date.now()}.png`);
          }
        }, 'image/png');
      } else {
        alert('Please draw a signature first.');
      }
    } else {
      if (!typedName.trim()) {
        alert('Please type a signature first.');
        return;
      }

      // Draw typed signature onto canvas to export
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fully transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set typography font
      ctx.fillStyle = typedColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Select family
      const fontFamily = fonts.find(f => f.name === selectedFont)?.family || 'sans-serif';
      ctx.font = `64px ${fontFamily}`;
      ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

      // Create trimmed canvas if desired, or download directly
      canvas.toBlob(blob => {
        if (blob) {
          downloadBlob(blob, `typed-signature-${Date.now()}.png`);
        }
      }, 'image/png');
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Mode selectors */}
      <div className="flex border border-border rounded overflow-hidden w-fit font-mono text-[10px]">
        <button
          type="button"
          onClick={() => setMode('draw')}
          className={`px-3 py-1.5 uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
            mode === 'draw' ? 'bg-accent text-white font-semibold' : 'bg-bg text-ink-muted hover:text-ink'
          }`}
        >
          <Pencil size={11} />
          <span>Draw Signature</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('type')}
          className={`px-3 py-1.5 uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
            mode === 'type' ? 'bg-accent text-white font-semibold' : 'bg-bg text-ink-muted hover:text-ink'
          }`}
        >
          <TypeIcon size={11} />
          <span>Type Signature</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Settings column */}
        <div className="flex flex-col gap-4 border border-border rounded p-4 bg-bg/25">
          {mode === 'draw' ? (
            <>
              {/* Draw Settings */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Pen Color /</span>
                <div className="flex gap-2">
                  {colors.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setPenColor(c.hex)}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        penColor === c.hex
                          ? 'border-accent scale-110 ring-1 ring-accent'
                          : 'border-border hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="pen-width" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Stroke Width /</label>
                  <span className="font-mono text-xs font-semibold">{penWidth}px</span>
                </div>
                <input
                  id="pen-width"
                  type="range"
                  min="1"
                  max="6"
                  step="0.5"
                  value={penWidth}
                  onChange={e => setPenWidth(parseFloat(e.target.value))}
                  className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>
            </>
          ) : (
            <>
              {/* Type Settings */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name-input" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Type Your Name /</label>
                <input
                  id="name-input"
                  type="text"
                  value={typedName}
                  onChange={e => setTypedName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent font-sans"
                  maxLength={24}
                />
              </div>

              <div className="flex flex-col gap-2 mt-1">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Select Font Style /</span>
                <div className="flex flex-col gap-1">
                  {fonts.map(f => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => setSelectedFont(f.name)}
                      className={`p-2 border rounded text-left transition-colors text-lg ${
                        selectedFont === f.name
                          ? 'border-accent bg-accent/5 font-bold'
                          : 'border-border hover:border-accent/40 bg-surface'
                      }`}
                      style={{ fontFamily: f.family }}
                    >
                      {typedName || 'Signature'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Ink Color /</span>
                <div className="flex gap-2">
                  {colors.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setTypedColor(c.hex)}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        typedColor === c.hex
                          ? 'border-accent scale-110 ring-1 ring-accent'
                          : 'border-border hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 border-t border-border pt-4 mt-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 px-3 py-1.5 border border-border rounded text-ink-muted hover:text-ink hover:bg-bg transition-colors flex items-center justify-center gap-1 text-xs font-mono uppercase tracking-wider"
            >
              <RotateCcw size={12} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Canvas Display Column */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
            Signature Workspace /
          </span>

          <div className="w-full h-[220px] bg-bg border border-border border-dashed rounded flex items-center justify-center overflow-hidden relative shadow-inner">
            {mode === 'draw' ? (
              <SignatureCanvas
                ref={ref => { sigCanvasRef.current = ref; }}
                penColor={penColor}
                minWidth={penWidth - 0.5}
                maxWidth={penWidth + 0.5}
                canvasProps={{
                  className: 'w-full h-full cursor-crosshair bg-transparent',
                }}
              />
            ) : (
              <div
                className="w-full text-center text-4xl truncate px-4 select-none leading-relaxed"
                style={{
                  fontFamily: fonts.find(f => f.name === selectedFont)?.family || 'sans-serif',
                  color: typedColor,
                }}
              >
                {typedName || <span className="text-ink-muted text-sm italic font-sans">[Enter text to preview]</span>}
              </div>
            )}
            <span className="absolute bottom-2 left-3 font-mono text-[9px] text-ink-muted uppercase">
              [Transparent PNG output]
            </span>
          </div>

          <div className="flex justify-end gap-3">
            <DownloadButton
              onClick={handleDownload}
              label="Download Signature"
              disabled={mode === 'draw' ? false : !typedName.trim()}
              className="w-full md:w-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureMaker;
