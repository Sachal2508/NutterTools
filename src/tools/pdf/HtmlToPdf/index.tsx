import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob } from '../../../lib/fileHelper';
import { Code2, Globe, Upload } from 'lucide-react';

export const HtmlToPdf: React.FC = () => {
  const [sourceType, setSourceType] = useState<'code' | 'url'>('code');
  const [htmlCode, setHtmlCode] = useState('<h1>Hello World</h1>\n<p>This is a high-fidelity client-side PDF convert preview page.</p>\n<table style="width:100%; border-collapse:collapse; margin-top:20px;">\n  <tr style="background:#f3f4f6;">\n    <th style="border:1px solid #ddd; padding:8px;">Header 1</th>\n    <th style="border:1px solid #ddd; padding:8px;">Header 2</th>\n  </tr>\n  <tr>\n    <td style="border:1px solid #ddd; padding:8px;">Data A</td>\n    <td style="border:1px solid #ddd; padding:8px;">Data B</td>\n  </tr>\n</table>');
  const [webUrl, setWebUrl] = useState('');
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleHtmlFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setPdfBlob(null);
    const f = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setHtmlCode(reader.result as string);
      setSourceType('code');
    };
    reader.readAsText(f);
  };

  const handleConvertToPdf = async () => {
    setIsProcessing(true);
    setProgress(20);
    setStatus('Initializing viewport renderer...');

    // Create an offscreen DOM container to render HTML securely
    const renderContainer = document.createElement('div');
    renderContainer.style.position = 'absolute';
    renderContainer.style.left = '-9999px';
    renderContainer.style.top = '0';
    renderContainer.style.width = '800px';
    renderContainer.style.padding = '40px';
    renderContainer.style.background = '#FFFFFF';
    document.body.appendChild(renderContainer);

    try {
      if (sourceType === 'code') {
        setProgress(40);
        setStatus('Injecting raw HTML code streams...');
        renderContainer.innerHTML = htmlCode;
      } else {
        setProgress(30);
        setStatus('Fetching remote webpage structure...');
        
        // Webpages require proxying to bypass CORS if loaded client-side directly
        // We will fetch via CORS proxy (e.g. allorigins or similar free proxy) to load the DOM structure
        const proxiedUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(webUrl)}`;
        const response = await fetch(proxiedUrl);
        const data = await response.json();
        
        if (!data.contents) {
          throw new Error('Could not fetch webpage contents. Please ensure the URL is correct and public.');
        }

        setProgress(60);
        setStatus('Resolving stylesheets and images...');

        // Set contents and base element to fix relative links/images
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        // Inject a base tag matching original URL to resolve asset files
        const base = doc.createElement('base');
        base.href = webUrl;
        doc.head.insertBefore(base, doc.head.firstChild);

        renderContainer.innerHTML = doc.documentElement.innerHTML;
      }

      // Settle fonts and layouts
      await new Promise((resolve) => setTimeout(resolve, 800));

      setProgress(75);
      setStatus('Rendering webpage pixels to PDF canvas...');

      const canvas = await html2canvas(renderContainer, {
        scale: 2.0, // High DPI capture
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      setProgress(90);
      setStatus('Compiling PDF file...');

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth - 40;
      const imgHeight = (imgWidth * canvas.height) / canvas.width;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      pdf.addImage(imgData, 'JPEG', 20, 20, imgWidth, Math.min(imgHeight, pdfHeight - 40));

      const blob = pdf.output('blob');
      setPdfBlob(blob);
      setProgress(100);
      setStatus('Conversion complete.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'HTML to PDF conversion failed.');
      setProgress(0);
    } finally {
      if (document.body.contains(renderContainer)) {
        document.body.removeChild(renderContainer);
      }
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (pdfBlob) {
      downloadBlob(pdfBlob, `webpage-convert-${Date.now()}.pdf`);
    }
  };

  const handleReset = () => {
    setPdfBlob(null);
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-4 border border-border rounded bg-surface p-4">
        <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2">
          Select Source Type /
        </h4>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => { setSourceType('code'); setPdfBlob(null); }}
            className={`flex items-center gap-2 px-4 py-2 border rounded font-mono text-xs uppercase tracking-wider transition-colors ${
              sourceType === 'code' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted bg-surface hover:text-ink'
            }`}
          >
            <Code2 size={13} /> HTML Code
          </button>
          <button
            type="button"
            onClick={() => { setSourceType('url'); setPdfBlob(null); }}
            className={`flex items-center gap-2 px-4 py-2 border rounded font-mono text-xs uppercase tracking-wider transition-colors ${
              sourceType === 'url' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted bg-surface hover:text-ink'
            }`}
          >
            <Globe size={13} /> Web Page URL
          </button>

          {sourceType === 'code' && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 border border-border text-ink-muted hover:text-ink rounded font-mono text-[10px] uppercase ml-auto hover:bg-bg transition-colors"
            >
              <Upload size={11} /> Load File
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            accept=".html,.htm"
            onChange={handleHtmlFileUpload}
            className="hidden"
          />
        </div>

        {sourceType === 'code' ? (
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9px] text-ink-muted uppercase">HTML Code Editor /</span>
            <textarea
              rows={8}
              value={htmlCode}
              onChange={e => { setHtmlCode(e.target.value); setPdfBlob(null); }}
              className="w-full p-3 border border-border bg-bg text-ink rounded font-mono text-xs focus:border-accent outline-none transition-colors resize-y leading-relaxed"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9px] text-ink-muted uppercase">Enter Web URL /</span>
            <input
              type="url"
              placeholder="e.g. https://example.com"
              value={webUrl}
              onChange={e => { setWebUrl(e.target.value); setPdfBlob(null); }}
              className="w-full px-3 py-2 border border-border bg-bg text-ink rounded text-xs font-sans focus:border-accent outline-none transition-colors"
            />
          </div>
        )}
      </div>

      {!pdfBlob && !isProcessing && (
        <div className="flex justify-end gap-3">
          <DownloadButton onClick={handleConvertToPdf} label="Convert to PDF" />
        </div>
      )}

      {isProcessing && <ProgressBar progress={progress} status={status} />}

      {pdfBlob && (
        <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
          <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
            HTML Status /
          </h4>
          <p className="text-sm font-sans text-ink">
            Webpage structure captured and compiled successfully.
          </p>

          <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
            >
              Start Over
            </button>
            <DownloadButton onClick={handleDownload} label="Download PDF" />
          </div>
        </div>
      )}
    </div>
  );
};

export default HtmlToPdf;
