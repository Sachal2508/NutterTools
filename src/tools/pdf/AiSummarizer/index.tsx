import React, { useState, useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import { readFileAsArrayBuffer } from '../../../lib/fileHelper';
import { Sparkles, Key, BrainCircuit } from 'lucide-react';

// Setup worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const AiSummarizer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [saveKey, setSaveKey] = useState(true);
  const [summaryLevel, setSummaryLevel] = useState<'brief' | 'detailed'>('brief');
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  // Load API Key from local storage if available
  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key') || '';
    if (saved) {
      setApiKey(saved);
    }
  }, []);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setSummaryText('');
    }
  };

  const handleSummarize = async () => {
    if (!file) return;
    if (!apiKey.trim()) {
      alert('Please enter your Gemini API Key first.');
      return;
    }

    if (saveKey) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }

    setIsProcessing(true);
    setProgress(15);
    setStatus('Extracting document text layers...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      let extractedText = '';
      
      // Limit text extraction size to avoid hitting token constraints (extract up to first 25 pages)
      const pagesToExtract = Math.min(numPages, 25);
      
      for (let i = 1; i <= pagesToExtract; i++) {
        setStatus(`Extracting text from page ${i} of ${pagesToExtract}...`);
        setProgress(15 + Math.round((i / pagesToExtract) * 35));

        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        extractedText += pageText + '\n';
      }

      if (!extractedText.trim()) {
        throw new Error('This PDF has no readable text layout. Make sure it contains selectable text.');
      }

      setProgress(60);
      setStatus('Connecting to Gemini AI Engine...');

      // Build summary prompt
      const summaryPrompt = summaryLevel === 'brief' 
        ? `Provide a concise, bulleted summary highlighting the core findings, main arguments, and conclusions of the following text:\n\n${extractedText}`
        : `Provide a detailed structural summary of the following document. Break it down into sections (e.g. Overview, Key Takeaways, Detailed Findings, Next Steps):\n\n${extractedText}`;

      // Call Gemini Beta API directly client-side
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: summaryPrompt }]
            }]
          }),
        }
      );

      setProgress(85);
      setStatus('Synthesizing summary results...');

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Gemini API query returned an error.');
      }

      const rawSummary = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawSummary) {
        throw new Error('Unable to extract content summary from Gemini AI response.');
      }

      setSummaryText(rawSummary);
      setProgress(100);
      setStatus('Summary generated.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'Summarizer failed. Please check your API key and file contents.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setSummaryText('');
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {!file ? (
        <DropZone accept="application/pdf" acceptLabel="PDF file" onFilesAdded={handleFilesAdded} />
      ) : (
        <div className="flex flex-col gap-4">
          <FileCard file={file} index={0} totalFiles={1} onRemove={handleReset} />

          {!summaryText && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label htmlFor="api-key" className="flex items-center gap-1.5 font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  <Key size={12} /> Gemini API Key /
                </label>
                <input
                  id="api-key"
                  type="password"
                  placeholder="Enter your Gemini API key (starts with AIzaSy...)"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-bg text-ink rounded text-xs font-mono focus:border-accent outline-none"
                />
                <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] text-ink-muted leading-relaxed font-sans mt-1">
                  <input
                    type="checkbox"
                    checked={saveKey}
                    onChange={e => setSaveKey(e.target.checked)}
                    className="w-3.5 h-3.5 border border-border rounded accent-accent bg-surface"
                  />
                  Save API Key in this browser for future visits
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] text-ink-muted uppercase">Summary Detail Level /</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSummaryLevel('brief')}
                      className={`py-1.5 border rounded text-xs font-sans font-bold transition-colors ${
                        summaryLevel === 'brief' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted bg-surface'
                      }`}
                    >
                      Brief Bullets
                    </button>
                    <button
                      type="button"
                      onClick={() => setSummaryLevel('detailed')}
                      className={`py-1.5 border rounded text-xs font-sans font-bold transition-colors ${
                        summaryLevel === 'detailed' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted bg-surface'
                      }`}
                    >
                      Detailed Outline
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-accent/5 border border-accent/20 rounded text-xs text-ink-muted leading-relaxed font-sans">
                <strong>Privacy Guarantee:</strong> This application runs 100% client-side. Your API key and PDF file data are sent directly to Google's official Gemini API endpoints. No server logs or storage intermediaries are used.
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSummarize}
                  className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white font-mono text-xs uppercase tracking-wider rounded shadow hover:bg-accent-secondary transition-colors"
                >
                  <Sparkles size={14} /> Summarize
                </button>
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {summaryText && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in items-center">
              <h4 className="flex items-center gap-1.5 font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                <BrainCircuit size={12} className="text-accent" /> AI Summary Result /
              </h4>
              
              <div className="w-full text-left bg-bg border border-border rounded p-4 font-sans text-xs max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed text-ink shadow-inner">
                {summaryText}
              </div>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiSummarizer;
