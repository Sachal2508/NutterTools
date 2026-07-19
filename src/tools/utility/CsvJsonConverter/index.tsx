import React, { useState } from 'react';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob } from '../../../lib/fileHelper';
import { ArrowLeftRight, Copy, ClipboardCheck } from 'lucide-react';

export const CsvJsonConverter: React.FC = () => {
  const [direction, setDirection] = useState<'csv2json' | 'json2csv'>('csv2json');
  const [inputText, setInputText] = useState('name,role,experience\nNutterTools,Client Toolbox,100%\nGemini,AI assistant,Advanced');
  const [outputText, setOutputText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    try {
      if (direction === 'csv2json') {
        const lines = inputText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) {
          setOutputText('[]');
          return;
        }

        // Parse headers from first row
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        const jsonArray = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          const rowObj: { [key: string]: string } = {};
          
          headers.forEach((h, idx) => {
            rowObj[h] = cols[idx] || '';
          });

          jsonArray.push(rowObj);
        }

        setOutputText(JSON.stringify(jsonArray, null, 2));
      } else {
        // JSON to CSV
        const json = JSON.parse(inputText);
        if (!Array.isArray(json) || json.length === 0) {
          throw new Error('Input must be a JSON array of objects.');
        }

        const headers = Object.keys(json[0]);
        let csv = headers.join(',') + '\n';

        json.forEach(row => {
          const rowValues = headers.map(h => {
            const val = String(row[h] || '');
            // Wrap in quotes if commas exist
            return val.includes(',') ? `"${val}"` : val;
          });
          csv += rowValues.join(',') + '\n';
        });

        setOutputText(csv.trim());
      }
    } catch (err: any) {
      alert(err.message || 'Conversion failed. Please verify syntax formatting.');
    }
  };

  const handleCopy = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (outputText) {
      const type = direction === 'csv2json' ? 'application/json' : 'text/csv';
      const name = direction === 'csv2json' ? 'data.json' : 'data.csv';
      const blob = new Blob([outputText], { type });
      downloadBlob(blob, name);
    }
  };

  const handleToggleDirection = () => {
    setDirection(direction === 'csv2json' ? 'json2csv' : 'csv2json');
    setInputText(outputText);
    setOutputText('');
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  return (
    <div className="flex flex-col gap-4 font-sans">
      <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
        
        <div className="flex flex-wrap gap-3 items-center border-b border-border pb-2">
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
            Dataset Conversion /
          </span>

          <button
            type="button"
            onClick={handleToggleDirection}
            className="flex items-center gap-1.5 px-3 py-1 bg-accent text-white font-mono text-[10px] uppercase tracking-wider rounded hover:bg-accent-secondary transition-colors"
          >
            <ArrowLeftRight size={11} /> {direction === 'csv2json' ? 'CSV ➔ JSON' : 'JSON ➔ CSV'}
          </button>

          {outputText && (
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 border border-border text-[10px] uppercase font-mono tracking-wider text-ink-muted hover:text-ink hover:bg-bg rounded transition-colors ml-auto"
            >
              {copied ? <ClipboardCheck size={11} className="text-success" /> : <Copy size={11} />}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9px] text-ink-muted uppercase">
              {direction === 'csv2json' ? 'Input CSV Text /' : 'Input JSON Text /'}
            </span>
            <textarea
              rows={10}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="w-full p-3 border border-border bg-bg text-ink rounded font-mono text-xs focus:border-accent outline-none resize-y leading-relaxed"
              placeholder={direction === 'csv2json' ? 'col1,col2\nval1,val2' : '[{"col1":"val1"}]'}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9px] text-ink-muted uppercase">
              {direction === 'csv2json' ? 'Output JSON /' : 'Output CSV /'}
            </span>
            <textarea
              rows={10}
              readOnly
              value={outputText}
              className="w-full p-3 border border-border bg-bg text-ink rounded font-mono text-xs focus:border-accent outline-none resize-y leading-relaxed"
              placeholder="Converted result will appear here..."
            />
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-border pt-4 mt-1">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase hover:text-ink hover:bg-bg transition-colors"
          >
            Clear
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConvert}
              className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase hover:text-ink hover:bg-bg transition-colors"
            >
              Convert
            </button>
            <DownloadButton onClick={handleDownload} label="Download Result" disabled={!outputText} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default CsvJsonConverter;
