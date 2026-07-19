import React from 'react';
import { useParams } from 'react-router-dom';
import { toolsRegistry } from '../data/toolsRegistry';
import ToolPageLayout from '../components/shared/ToolPageLayout';
import NotFound from './NotFound';

// Import all 23 tool widgets
import MergePdf from '../tools/pdf/MergePdf';
import SplitPdf from '../tools/pdf/SplitPdf';
import CompressPdf from '../tools/pdf/CompressPdf';
import PdfToWord from '../tools/pdf/PdfToWord';
import WordToPdf from '../tools/pdf/WordToPdf';
import PdfToJpg from '../tools/pdf/PdfToJpg';
import ImageToPdf from '../tools/pdf/ImageToPdf';
import RotatePdf from '../tools/pdf/RotatePdf';
import UnlockPdf from '../tools/pdf/UnlockPdf';
import ProtectPdf from '../tools/pdf/ProtectPdf';
import PdfBulkExportImages from '../tools/pdf/PdfBulkExportImages';
import PdfPageNumbers from '../tools/pdf/PdfPageNumbers';
import PdfResizer from '../tools/pdf/PdfResizer';

// New PDF Tool Widget Imports
import RemovePages from '../tools/pdf/RemovePages';
import ExtractPages from '../tools/pdf/ExtractPages';
import OrganizePdf from '../tools/pdf/OrganizePdf';
import ScanToPdf from '../tools/pdf/ScanToPdf';
import RepairPdf from '../tools/pdf/RepairPdf';
import OcrPdf from '../tools/pdf/OcrPdf';
import ExcelToPdf from '../tools/pdf/ExcelToPdf';
import PdfToExcel from '../tools/pdf/PdfToExcel';
import PdfToPptx from '../tools/pdf/PdfToPptx';
import HtmlToPdf from '../tools/pdf/HtmlToPdf';
import PdfToPdfA from '../tools/pdf/PdfToPdfA';
import AddWatermark from '../tools/pdf/AddWatermark';
import CropPdf from '../tools/pdf/CropPdf';
import PdfForms from '../tools/pdf/PdfForms';
import SignPdf from '../tools/pdf/SignPdf';
import RedactPdf from '../tools/pdf/RedactPdf';
import ComparePdf from '../tools/pdf/ComparePdf';
import AiSummarizer from '../tools/pdf/AiSummarizer';
import PdfToMarkdown from '../tools/pdf/PdfToMarkdown';

import ImageCompressor from '../tools/image/ImageCompressor';
import ImageResizer from '../tools/image/ImageResizer';
import ImageFormatConverter from '../tools/image/ImageFormatConverter';
import ImageCropper from '../tools/image/ImageCropper';
import PassportPhotoMaker from '../tools/image/PassportPhotoMaker';
import GrayscaleConverter from '../tools/image/GrayscaleConverter';
import SignatureMaker from '../tools/image/SignatureMaker';

// New Image Tool Widget Imports
import MemeGenerator from '../tools/image/MemeGenerator';
import ExifStripper from '../tools/image/ExifStripper';
import ImageColorPicker from '../tools/image/ImageColorPicker';
import DpiConverter from '../tools/image/DpiConverter';
import ColorPaletteExtractor from '../tools/image/ColorPaletteExtractor';
import ImageBase64 from '../tools/image/ImageBase64';

import QrCodeGenerator from '../tools/utility/QrCodeGenerator';
import WordCharacterCounter from '../tools/utility/WordCharacterCounter';
import PasswordGenerator from '../tools/utility/PasswordGenerator';
import TextCaseConverter from '../tools/utility/TextCaseConverter';

// New Utility Tool Widget Imports
import JsonFormatter from '../tools/utility/JsonFormatter';
import DiffChecker from '../tools/utility/DiffChecker';
import CsvJsonConverter from '../tools/utility/CsvJsonConverter';
import BarcodeTool from '../tools/utility/BarcodeTool';
import MarkdownEditor from '../tools/utility/MarkdownEditor';
import TextToSpeech from '../tools/utility/TextToSpeech';
import AgeCalculator from '../tools/utility/AgeCalculator';
import UuidGenerator from '../tools/utility/UuidGenerator';

// Switch component mapping tool IDs to widgets
const renderToolWidget = (id: string): React.ReactNode => {
  switch (id) {
    // PDF / (12 + 18 = 30)
    case 'merge-pdf':
      return <MergePdf />;
    case 'split-pdf':
      return <SplitPdf />;
    case 'compress-pdf':
      return <CompressPdf />;
    case 'pdf-to-word':
      return <PdfToWord />;
    case 'word-to-pdf':
      return <WordToPdf />;
    case 'pdf-to-jpg':
      return <PdfToJpg />;
    case 'image-to-pdf':
      return <ImageToPdf />;
    case 'rotate-pdf':
      return <RotatePdf />;
    case 'unlock-pdf':
      return <UnlockPdf />;
    case 'protect-pdf':
      return <ProtectPdf />;
    case 'pdf-to-images-zip':
      return <PdfBulkExportImages />;
    case 'pdf-page-numbers':
      return <PdfPageNumbers />;
    case 'pdf-resizer':
      return <PdfResizer />;

    // NEW PDF Tools
    case 'remove-pages':
      return <RemovePages />;
    case 'extract-pages':
      return <ExtractPages />;
    case 'organize-pdf':
      return <OrganizePdf />;
    case 'scan-to-pdf':
      return <ScanToPdf />;
    case 'repair-pdf':
      return <RepairPdf />;
    case 'ocr-pdf':
      return <OcrPdf />;
    case 'excel-to-pdf':
      return <ExcelToPdf />;
    case 'pdf-to-excel':
      return <PdfToExcel />;
    case 'pdf-to-pptx':
      return <PdfToPptx />;
    case 'html-to-pdf':
      return <HtmlToPdf />;
    case 'pdf-to-pdfa':
      return <PdfToPdfA />;
    case 'add-watermark':
      return <AddWatermark />;
    case 'crop-pdf':
      return <CropPdf />;
    case 'pdf-forms':
      return <PdfForms />;
    case 'sign-pdf':
      return <SignPdf />;
    case 'redact-pdf':
      return <RedactPdf />;
    case 'compare-pdf':
      return <ComparePdf />;
    case 'ai-summarizer':
      return <AiSummarizer />;
    case 'pdf-to-markdown':
      return <PdfToMarkdown />;

    // IMAGE / (7 + 6 = 13)
    case 'compress-image':
      return <ImageCompressor />;
    case 'resize-image':
      return <ImageResizer />;
    case 'convert-image':
      return <ImageFormatConverter />;
    case 'crop-image':
      return <ImageCropper />;
    case 'passport-photo':
      return <PassportPhotoMaker />;
    case 'grayscale-image':
      return <GrayscaleConverter />;
    case 'signature-maker':
      return <SignatureMaker />;
    case 'meme-generator':
      return <MemeGenerator />;
    case 'exif-stripper':
      return <ExifStripper />;
    case 'image-color-picker':
      return <ImageColorPicker />;
    case 'dpi-converter':
      return <DpiConverter />;
    case 'color-palette-extractor':
      return <ColorPaletteExtractor />;
    case 'image-base64':
      return <ImageBase64 />;

    // UTILITY / (4 + 8 = 12)
    case 'qr-generator':
      return <QrCodeGenerator />;
    case 'word-counter':
      return <WordCharacterCounter />;
    case 'password-generator':
      return <PasswordGenerator />;
    case 'case-converter':
      return <TextCaseConverter />;
    case 'json-formatter':
      return <JsonFormatter />;
    case 'diff-checker':
      return <DiffChecker />;
    case 'csv-json-converter':
      return <CsvJsonConverter />;
    case 'barcode-tool':
      return <BarcodeTool />;
    case 'markdown-editor':
      return <MarkdownEditor />;
    case 'text-to-speech':
      return <TextToSpeech />;
    case 'age-calculator':
      return <AgeCalculator />;
    case 'uuid-generator':
      return <UuidGenerator />;

    default:
      return null;
  }
};

export const ToolPage: React.FC = () => {
  // Extract route params
  const { toolId } = useParams<{ toolId: string }>();

  // Find tool registry metadata matching the current route
  const currentPath = window.location.pathname;
  const tool = toolsRegistry.find(t => t.id === toolId || t.route === currentPath);

  if (!tool) {
    return <NotFound />;
  }

  const widget = renderToolWidget(tool.id);

  if (!widget) {
    return <NotFound />;
  }

  return <ToolPageLayout tool={tool}>{widget}</ToolPageLayout>;
};

export default ToolPage;
