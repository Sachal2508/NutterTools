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

import ImageCompressor from '../tools/image/ImageCompressor';
import ImageResizer from '../tools/image/ImageResizer';
import ImageFormatConverter from '../tools/image/ImageFormatConverter';
import ImageCropper from '../tools/image/ImageCropper';
import PassportPhotoMaker from '../tools/image/PassportPhotoMaker';
import GrayscaleConverter from '../tools/image/GrayscaleConverter';
import SignatureMaker from '../tools/image/SignatureMaker';

import QrCodeGenerator from '../tools/utility/QrCodeGenerator';
import WordCharacterCounter from '../tools/utility/WordCharacterCounter';
import PasswordGenerator from '../tools/utility/PasswordGenerator';
import TextCaseConverter from '../tools/utility/TextCaseConverter';

// Switch component mapping tool IDs to widgets
const renderToolWidget = (id: string): React.ReactNode => {
  switch (id) {
    // PDF / (12)
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

    // IMAGE / (7)
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

    // UTILITY / (4)
    case 'qr-generator':
      return <QrCodeGenerator />;
    case 'word-counter':
      return <WordCharacterCounter />;
    case 'password-generator':
      return <PasswordGenerator />;
    case 'case-converter':
      return <TextCaseConverter />;

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
