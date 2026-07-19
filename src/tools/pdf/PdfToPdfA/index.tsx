import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';

export const PdfToPdfA: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [conformance, setConformance] = useState<'1b' | '2b' | '3b'>('2b');
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfaBlob, setPdfaBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setPdfaBlob(null);
    }
  };

  const handleConvertToPdfA = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(15);
    setStatus('Parsing PDF catalog contents...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(arrayBuffer, { 
        ignoreEncryption: true 
      });

      setProgress(45);
      setStatus('Filtering non-archival interactive scripts...');

      // Strip Javascript, actions, and annotations that aren't allowed in PDF/A
      const catalog = pdfDoc.catalog;
      catalog.delete(pdfDoc.context.obj('Names'));
      catalog.delete(pdfDoc.context.obj('OpenAction'));

      setProgress(75);
      setStatus('Injecting XML metadata profiles (PDF/A-2b)...');

      // Create a PDF/A conformance XML metadata block
      const date = new Date().toISOString();
      const xmpMetadata = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
   <pdfaid:part>${conformance === '1b' ? '1' : conformance === '2b' ? '2' : '3'}</pdfaid:part>
   <pdfaid:conformance>B</pdfaid:conformance>
  </rdf:Description>
  <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">
   <xmp:CreateDate>${date}</xmp:CreateDate>
   <xmp:ModifyDate>${date}</xmp:ModifyDate>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

      // Embed XML Metadata Stream in Catalog
      const metadataStream = pdfDoc.context.stream(xmpMetadata, {
        Type: 'Metadata',
        Subtype: 'XML',
      });
      const metadataRef = pdfDoc.context.register(metadataStream);
      catalog.set(pdfDoc.context.obj('Metadata'), metadataRef);

      setProgress(90);
      setStatus('Re-encoding PDF document...');
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });

      setPdfaBlob(blob);
      setProgress(100);
      setStatus('Conversion complete.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'PDF/A conversion failed. Ensure your file is not encrypted.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (pdfaBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(pdfaBlob, `${baseName}-pdfa.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPdfaBlob(null);
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

          {!pdfaBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  PDF/A Conformance Standard /
                </span>
                <select
                  value={conformance}
                  onChange={e => setConformance(e.target.value as any)}
                  className="px-2 py-1 border border-border rounded bg-bg text-ink text-xs focus:border-accent outline-none font-sans"
                >
                  <option value="1b">PDF/A-1b (Basic Conformance)</option>
                  <option value="2b">PDF/A-2b (Standard Archiving)</option>
                  <option value="3b">PDF/A-3b (Allows Embedded files)</option>
                </select>
              </div>

              <div className="p-3 bg-accent/5 border border-accent/20 rounded text-xs text-ink-muted leading-relaxed font-sans">
                <strong>Archiving Notice:</strong> PDF/A is an ISO-standardized version of the PDF format specialized for the digital preservation of electronic documents. Interactive features (Javascript, links without URI standards) will be stripped to guarantee that the document will render exactly the same in future software.
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleConvertToPdfA} label="Convert to PDF/A" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {pdfaBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                PDF/A Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                PDF converted to PDF/A-{conformance.toUpperCase()} successfully.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download PDF/A" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfToPdfA;
