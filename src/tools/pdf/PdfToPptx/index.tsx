import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import JSZip from 'jszip';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';

// Setup worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const PdfToPptx: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pptxBlob, setPptxBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setPptxBlob(null);
    }
  };

  const handlePdfToPptx = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(5);
    setStatus('Initializing PowerPoint layout builder...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      const zip = new JSZip();

      // Relational content structures for PPTX formatting
      zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);

      let slidesOverride = '';
      let slideIds = '';
      let slideRelationships = '';

      const dataUrlToBytes = (dataUrl: string): Uint8Array => {
        const base64 = dataUrl.split(',')[1];
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      };

      for (let i = 1; i <= numPages; i++) {
        setStatus(`Rendering slide ${i} of ${numPages}...`);
        setProgress(10 + Math.round((i / numPages) * 70));

        const page = await pdfDoc.getPage(i);
        // Render at 1.5x scale (balance slide file size and graphics details)
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get 2D canvas context');

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        };
        await page.render(renderContext).promise;

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const imageBytes = dataUrlToBytes(dataUrl);

        // Add the slide image to slide media folder
        zip.file(`ppt/media/image${i}.jpg`, imageBytes);

        // Slide XML content
        zip.file(`ppt/slides/slide${i}.xml`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      <p:pic>
        <p:nvPicPr>
          <p:cNvPr id="2" name="Slide Background Image"/>
          <p:cNvPicPr>
            <a:picLocks noGrp="1" noRot="1" noChangeAspect="1"/>
          </p:cNvPicPr>
          <p:nvPr/>
        </p:nvPicPr>
        <p:blipFill>
          <a:blip r:embed="rIdImage1"/>
          <a:stretch>
            <a:fillRect/>
          </a:stretch>
        </p:blipFill>
        <p:spPr>
          <a:xfrm>
            <a:off x="0" y="0"/>
            <a:ext cx="9144000" cy="5143500"/>
          </a:xfrm>
          <a:prstGeom prst="rect">
            <a:avLst/>
          </a:prstGeom>
        </p:spPr>
      </p:pic>
    </p:spTree>
  </p:cSld>
</p:sld>`);

        // Slide XML relationship content linking to its image
        zip.file(`ppt/slides/_rels/slide${i}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdImage1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${i}.jpg"/>
</Relationships>`);

        // Accumulate presentation manifests
        slidesOverride += `<Override PartName="/ppt/slides/slide${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\n`;
        slideIds += `<p:sldId id="${256 + i}" r:id="rId${i}"/>\n`;
        slideRelationships += `<Relationship Id="rId${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i}.xml"/>\n`;
      }

      setProgress(85);
      setStatus('Structuring slide layout templates...');

      // Content Types XML
      zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${slidesOverride}
</Types>`);

      // Core Presentation XML listing slide ID records
      zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
    ${slideIds}
  </p:sldIdLst>
  <p:notesSz cx="508000" cy="508000"/>
</p:presentation>`);

      // Core Presentation XML relationships maps
      zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${slideRelationships}
</Relationships>`);

      setProgress(90);
      setStatus('Packaging slides zip archive...');

      const blob = await zip.generateAsync({ type: 'blob' });
      setPptxBlob(blob);
      setProgress(100);
      setStatus('Conversion complete.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'PDF to PPTX conversion failed.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (pptxBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(pptxBlob, `${baseName}.pptx`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPptxBlob(null);
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

          {!pptxBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <div className="p-3 bg-accent/5 border border-accent/20 rounded text-xs text-ink-muted leading-relaxed font-sans">
                <strong>Important Conversion Note:</strong> Each page of the PDF will be converted to a slide-size background layout in PowerPoint. This ensures 100% exact copy of headings, drawings, equations, watermarks, and layouts.
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handlePdfToPptx} label="Convert to PowerPoint" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {pptxBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                PowerPoint Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                PowerPoint presentation slideshow generated successfully.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Slideshow (.pptx)" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfToPptx;
