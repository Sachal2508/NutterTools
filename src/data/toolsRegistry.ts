import { 
  Merge, Scissors, Minimize2, FileText, FileCode, Image, FileImage, 
  RotateCw, Unlock, Lock, FolderArchive, Hash, Sliders, Maximize, 
  RefreshCw, Crop, Contact, Palette, PenTool, QrCode, Type, Key, Binary,
  Trash2, Download, Grid, Camera, Wrench, Search, FileSpreadsheet,
  Presentation, Globe, FileArchive, Droplet, FileEdit, FileSignature,
  EyeOff, Columns, Sparkles, FileCode2,
  Laugh, CameraOff, Pipette, Braces, GitCompare, ScanBarcode, Mic, Calendar, Fingerprint, Settings
} from 'lucide-react';
import React from 'react';

export interface FAQ {
  q: string;
  a: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: 'pdf' | 'image' | 'utility';
  route: string;
  icon: React.ComponentType<any>;
  instructions: string[];
  faqs: FAQ[];
}

export const toolsRegistry: Tool[] = [
  // PDF / (12 + 18 new = 30)
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    description: 'Combine multiple PDF documents into a single organized file.',
    category: 'pdf',
    route: '/merge-pdf',
    icon: Merge,
    instructions: [
      'Select or drop two or more PDF files into the workbench workspace.',
      'Drag and drop the file cards to reorder them exactly as you need.',
      'Click "Merge PDFs" to assemble and download your consolidated PDF.'
    ],
    faqs: [
      { q: 'Is there a limit on how many PDFs I can merge?', a: 'No hard limit. Since all merging occurs locally in your browser, it depends on your system\'s memory (RAM). We recommend keeping files under 50MB for optimal performance.' },
      { q: 'Will my merged file retain its hyperlinks and annotations?', a: 'Yes, our merging process preserves structural details like internal links, annotations, form fields, and bookmarks.' }
    ]
  },
  {
    id: 'split-pdf',
    name: 'Split PDF',
    description: 'Extract specific page ranges or split a PDF into separate pages.',
    category: 'pdf',
    route: '/split-pdf',
    icon: Scissors,
    instructions: [
      'Drop your PDF file into the upload zone.',
      'Specify the pages you wish to extract (e.g. "1-3, 5" or "all" to split all pages).',
      'Click "Split PDF" to generate and download your selected pages.'
    ],
    faqs: [
      { q: 'Can I split password-protected PDFs?', a: 'You must unlock the PDF first using our "Unlock PDF" tool before splitting it.' },
      { q: 'What syntax is accepted for the ranges?', a: 'You can write numbers like "2", ranges like "3-7", or comma-separated lists like "1, 3, 5-8".' }
    ]
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Reduce the file size of your PDF while maintaining visual quality.',
    category: 'pdf',
    route: '/compress-pdf',
    icon: Minimize2,
    instructions: [
      'Drop your PDF into the workbench workspace.',
      'Choose a compression level (standard or maximum compression).',
      'Click "Compress PDF" and download the optimized smaller file.'
    ],
    faqs: [
      { q: 'How does the client-side compression work?', a: 'The tool extracts embedded images, recompresses them to modern layouts, strips unnecessary document metadata, and recompiles the PDF using browser memory.' },
      { q: 'Will my text become blurry?', a: 'No, vector graphics and text elements are untouched. Only high-resolution images are scaled or re-compressed.' }
    ]
  },
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    description: 'Extract text layout and images into an editable Word document (.docx).',
    category: 'pdf',
    route: '/pdf-to-word',
    icon: FileText,
    instructions: [
      'Upload a PDF document that contains selectable text.',
      'Choose your conversion mode: "High-Fidelity" (preserves all formatting/watermarks as full-page images) or "Editable Text Only" (extracts plain text only).',
      'Click "Convert to Word" and download the generated .docx file.'
    ],
    faqs: [
      { q: 'What is High-Fidelity mode?', a: 'High-Fidelity mode renders the PDF pages to high-resolution images and packages them into the Word document, preserving all margins, watermarks, and graphics exactly.' },
      { q: 'Does this tool support scanned PDFs (OCR)?', a: 'Editable Text mode will not extract text from scans. For scans, we recommend using our specialized OCR PDF tool.' }
    ]
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    description: 'Convert editable DOCX Word files into clean PDF documents.',
    category: 'pdf',
    route: '/word-to-pdf',
    icon: FileCode,
    instructions: [
      'Upload a standard Word document (.docx format only).',
      'Click "Convert to PDF" to render the pages locally inside your browser.',
      'Once complete, download the pixel-accurate PDF file.'
    ],
    faqs: [
      { q: 'Does this support older .doc formats?', a: 'No, it only supports modern XML-based Word files ending in .docx.' },
      { q: 'Will my layouts and images be preserved?', a: 'Yes. By utilizing docx-preview, we render all images, tables, lists, shapes, and alignments with 100% layout fidelity.' }
    ]
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    description: 'Render and export PDF pages as individual high-quality JPG images.',
    category: 'pdf',
    route: '/pdf-to-jpg',
    icon: Image,
    instructions: [
      'Drop your PDF file into the container.',
      'Select the page range or convert all pages.',
      'Click "Convert Pages" to download a ZIP package or save pages individually.'
    ],
    faqs: [
      { q: 'What resolution are the images exported at?', a: 'Pages are rendered at high-resolution 150 DPI by default to balance clarity and file size.' },
      { q: 'Can I export single pages?', a: 'Yes, you can click on individual page thumbnail renders to save them immediately.' }
    ]
  },
  {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    description: 'Convert PNG, JPG, WebP, HEIC, BMP, and GIF images into a consolidated PDF.',
    category: 'pdf',
    route: '/image-to-pdf',
    icon: FileImage,
    instructions: [
      'Drop images into the work grid (JPG, PNG, WebP, HEIC, BMP, GIF supported).',
      'Drag cards to set page ordering, and optionally customize orientation/margins.',
      'Click "Generate PDF" to download the compiled PDF.'
    ],
    faqs: [
      { q: 'Are HEIC files from iPhones supported?', a: 'Yes, HEIC files are automatically converted to standard images client-side before being compiled.' },
      { q: 'Can I mix different image sizes?', a: 'Yes, pages will scale to fit a uniform sheet size (A4 by default).' }
    ]
  },
  {
    id: 'rotate-pdf',
    name: 'Rotate PDF',
    description: 'Rotate individual or all pages inside a PDF document.',
    category: 'pdf',
    route: '/rotate-pdf',
    icon: RotateCw,
    instructions: [
      'Drop your PDF file into the workspace.',
      'Click the rotate buttons on individual page thumbnails or rotate all pages at once.',
      'Click "Save Changes" to download the updated PDF file.'
    ],
    faqs: [
      { q: 'Can I rotate just one page?', a: 'Yes. Each page has its own rotate control. You can rotate pages clockwise or counterclockwise by 90° intervals.' },
      { q: 'Does rotating files degrade quality?', a: 'No. Page rotation alters the orientation metadata coordinates inside the PDF structure, ensuring zero quality loss.' }
    ]
  },
  {
    id: 'unlock-pdf',
    name: 'Unlock PDF',
    description: 'Remove security locks and passwords from a PDF file.',
    category: 'pdf',
    route: '/unlock-pdf',
    icon: Unlock,
    instructions: [
      'Drop your password-protected PDF into the workspace.',
      'Enter the current password in the secure input block.',
      'Click "Unlock PDF" to strip encryption details and download the unlocked file.'
    ],
    faqs: [
      { q: 'Does this hack or crack PDF passwords?', a: 'No. You must know and provide the correct password to unlock the document. This tool decrypts the file and saves a version without password restrictions.' },
      { q: 'What encryption formats are supported?', a: 'Standard PDF protection (RC4/AES-128) is supported. Extremely high AES-256 standard files may display format limit warnings due to browser limits.' }
    ]
  },
  {
    id: 'protect-pdf',
    name: 'Protect PDF',
    description: 'Encrypt your PDF document with a secure password restriction.',
    category: 'pdf',
    route: '/protect-pdf',
    icon: Lock,
    instructions: [
      'Upload the PDF you want to password protect.',
      'Enter a strong password in the workspace text field.',
      'Click "Protect PDF" to encrypt the document and trigger a download.'
    ],
    faqs: [
      { q: 'Is my password sent to a server?', a: 'No. The encryption process runs locally in your browser memory. Your password never leaves your device.' },
      { q: 'Can anyone open a protected file without the password?', a: 'No. The document uses standard secure PDF encryption algorithms.' }
    ]
  },
  {
    id: 'pdf-to-images-zip',
    name: 'PDF Bulk Export Images',
    description: 'Extract all embedded images or convert pages into a ZIP of JPGs.',
    category: 'pdf',
    route: '/pdf-to-images-zip',
    icon: FolderArchive,
    instructions: [
      'Upload a PDF document containing embedded images or pages.',
      'Choose whether to extract raw embedded images or convert full pages.',
      'Click "Export ZIP" to download all images compressed in a single ZIP folder.'
    ],
    faqs: [
      { q: 'What is the difference between extracting images and converting pages?', a: 'Extracting images retrieves only original photo files stored inside the document. Converting pages renders every full page layout as a flat JPG.' }
    ]
  },
  {
    id: 'pdf-page-numbers',
    name: 'Add Page Numbers',
    description: 'Add page numbers with custom positions, fonts, and numbering formats.',
    category: 'pdf',
    route: '/pdf-page-numbers',
    icon: Hash,
    instructions: [
      'Drop your PDF document into the workspace.',
      'Select a alignment (top/bottom, left/center/right) and custom number style.',
      'Click "Add Page Numbers" to overlay coordinates and download.'
    ],
    faqs: [
      { q: 'Does this overwrite existing text?', a: 'Page numbers are overlaid on top of existing contents. Place them in empty margins to avoid overlap.' }
    ]
  },
  {
    id: 'pdf-resizer',
    name: 'PDF Page Resizer',
    description: 'Scale PDF page dimensions and compress file size by adjusting quality.',
    category: 'pdf',
    route: '/pdf-resizer',
    icon: Maximize,
    instructions: [
      'Upload your PDF document to the resizer workspace.',
      'Choose standard page sizes (A4, US Letter) or scale by percentage, and set target compression quality.',
      'Click "Resize PDF" to reconstruct and download your optimized PDF.'
    ],
    faqs: [
      { q: 'How does client-side PDF resizing work?', a: 'We render the pages onto canvas nodes at your chosen dimensions, apply image compression quality constraints, and rebuild the pages into a new PDF using local browser memory.' },
      { q: 'Will I lose links or annotations?', a: 'Because the pages are flattened and re-rendered to achieve target dimensions and compression quality, interactive links and form inputs on original pages will be rasterized.' }
    ]
  },
  // NEW PDF UTILITIES (17 Tools)
  {
    id: 'remove-pages',
    name: 'Remove Pages',
    description: 'Select and delete specific pages from a PDF document.',
    category: 'pdf',
    route: '/remove-pages',
    icon: Trash2,
    instructions: [
      'Upload your PDF document to the workspace.',
      'Select the page thumbnails you wish to delete from the document.',
      'Click "Remove Pages" to generate and download the cleaned PDF file.'
    ],
    faqs: [
      { q: 'Can I undo page deletions?', a: 'Yes, you can click on deleted page thumbnails to restore them before exporting the final PDF.' }
    ]
  },
  {
    id: 'extract-pages',
    name: 'Extract Pages',
    description: 'Isolate specific pages or ranges from your PDF into a new document.',
    category: 'pdf',
    route: '/extract-pages',
    icon: Download,
    instructions: [
      'Upload your PDF file to the workbench.',
      'Enter specific page numbers/ranges, or click thumbnails to select pages to extract.',
      'Click "Extract Pages" to compile and save your selection.'
    ],
    faqs: [
      { q: 'Can I extract non-contiguous page ranges?', a: 'Yes. You can extract pages like "1, 3, 5-8" into a single consolidated PDF.' }
    ]
  },
  {
    id: 'organize-pdf',
    name: 'Organize PDF',
    description: 'Reorder, rotate, or remove pages from a PDF in an interactive workspace.',
    category: 'pdf',
    route: '/organize-pdf',
    icon: Grid,
    instructions: [
      'Upload the PDF file you wish to organize.',
      'Drag and drop the page thumbnails to change their sequential order.',
      'Use the rotate and delete controls on individual pages, then click "Save Organization".'
    ],
    faqs: [
      { q: 'Is my data secure while organizing?', a: 'Yes, page reordering is completed entirely in browser memory. No files are uploaded to any server.' }
    ]
  },
  {
    id: 'scan-to-pdf',
    name: 'Scan to PDF',
    description: 'Scan pages using your device camera or upload image files, then export as PDF.',
    category: 'pdf',
    route: '/scan-to-pdf',
    icon: Camera,
    instructions: [
      'Click "Use Camera" to capture pages using your webcam, or upload images directly.',
      'Apply image enhancement filters (B&W scanner, grayscale, contrast boost).',
      'Click "Build PDF" to generate your scanned document.'
    ],
    faqs: [
      { q: 'Which filters are best for scanned documents?', a: 'The "B&W Document" filter threshold is optimized to clean up shadow gradients and make text highly legible.' }
    ]
  },
  {
    id: 'repair-pdf',
    name: 'Repair PDF',
    description: 'Re-index cross-reference tables and recover structure from corrupted PDFs.',
    category: 'pdf',
    route: '/repair-pdf',
    icon: Wrench,
    instructions: [
      'Upload a damaged, corrupted, or unreadable PDF document.',
      'The tool will scan, repair XREF pointer offsets, and reconstruct the page catalog.',
      'Download the recovered PDF document.'
    ],
    faqs: [
      { q: 'Can it recover files with completely missing bytes?', a: 'It repairs structure, catalog pointers, and offsets. If a file is completely blank or missing internal resource streams, content recovery may be limited.' }
    ]
  },
  {
    id: 'ocr-pdf',
    name: 'OCR PDF',
    description: 'Extract text from scanned PDFs and images using browser-based OCR.',
    category: 'pdf',
    route: '/ocr-pdf',
    icon: Search,
    instructions: [
      'Upload your scanned PDF document or page images.',
      'Select the document language (defaults to English).',
      'Wait for the OCR engine to extract the text, then download the TXT file.'
    ],
    faqs: [
      { q: 'Is the OCR completed on a server?', a: 'No. OCR uses tesseract.js WebAssembly which runs locally inside your browser worker threads.' }
    ]
  },
  {
    id: 'excel-to-pdf',
    name: 'Excel to PDF',
    description: 'Convert Excel spreadsheets (.xlsx) into clean, readable PDF tables.',
    category: 'pdf',
    route: '/excel-to-pdf',
    icon: FileSpreadsheet,
    instructions: [
      'Upload your Excel spreadsheet (.xlsx format).',
      'Configure document page formatting (A4 orientation, gridlines toggle).',
      'Click "Convert to PDF" to compile your spreadsheet into table sheets.'
    ],
    faqs: [
      { q: 'Are formulas and hidden sheets supported?', a: 'Visible data sheets are parsed and rendered. Formatted values are printed, but formulas remain structural.' }
    ]
  },
  {
    id: 'pdf-to-excel',
    name: 'PDF to Excel',
    description: 'Extract tables and structured data from PDFs into editable Excel sheets.',
    category: 'pdf',
    route: '/pdf-to-excel',
    icon: FileSpreadsheet,
    instructions: [
      'Upload a PDF document containing table structures.',
      'Choose extraction settings (auto-align columns based on coordinate matrices).',
      'Click "Convert to Excel" to download your editable .xlsx spreadsheet.'
    ],
    faqs: [
      { q: 'Does this support scanned documents?', a: 'It requires selectable text PDFs to construct cell values. Scanned PDFs will yield empty sheets unless run through OCR first.' }
    ]
  },
  {
    id: 'pdf-to-pptx',
    name: 'PDF to PowerPoint',
    description: 'Convert PDF pages into editable PowerPoint slides (.pptx).',
    category: 'pdf',
    route: '/pdf-to-pptx',
    icon: Presentation,
    instructions: [
      'Upload your PDF document to the slider workbench.',
      'Click "Convert to PowerPoint" to process and pack slides.',
      'Download the .pptx presentation file.'
    ],
    faqs: [
      { q: 'How are pages mapped in PowerPoint?', a: 'Each page of the PDF is converted to a slide-size background image, ensuring 100% exact reproduction of formatting, fonts, and designs.' }
    ]
  },
  {
    id: 'html-to-pdf',
    name: 'HTML to PDF',
    description: 'Convert HTML code, webpages, or uploaded HTML files into clean PDFs.',
    category: 'pdf',
    route: '/html-to-pdf',
    icon: Globe,
    instructions: [
      'Paste raw HTML code, upload an .html file, or paste a webpage URL.',
      'Customize output margins, background rendering, and layout scaling.',
      'Click "Convert to PDF" to generate and download.'
    ],
    faqs: [
      { q: 'Can I render external stylesheets or web pages?', a: 'Yes, if you enter a public URL, we fetch and render elements client-side, respecting stylesheets and inline images.' }
    ]
  },
  {
    id: 'pdf-to-pdfa',
    name: 'PDF to PDF/A',
    description: 'Convert standard PDFs into ISO-standardized PDF/A for long-term archiving.',
    category: 'pdf',
    route: '/pdf-to-pdfa',
    icon: FileArchive,
    instructions: [
      'Upload the PDF you wish to convert to PDF/A format.',
      'The tool will embed standard color profiles, strip non-archival elements, and enforce conformance.',
      'Download your PDF/A compliant document.'
    ],
    faqs: [
      { q: 'What is PDF/A?', a: 'PDF/A is a standardized version of PDF specialized for archiving, disabling features like javascript, encryption, and external references to ensure long-term reproducibility.' }
    ]
  },
  {
    id: 'add-watermark',
    name: 'Add Watermark',
    description: 'Overlay custom text or image watermarks on all pages of a PDF.',
    category: 'pdf',
    route: '/add-watermark',
    icon: Droplet,
    instructions: [
      'Upload the PDF file you wish to watermark.',
      'Configure text watermark (text, font size, opacity, angle, color) or upload a watermark image.',
      'Choose positioning (centered or tiled grid), and click "Apply Watermark".'
    ],
    faqs: [
      { q: 'Can I adjust watermark transparency?', a: 'Yes. An opacity slider allows you to set visibility (e.g. 15% opacity is standard for subtle watermarks).' }
    ]
  },
  {
    id: 'crop-pdf',
    name: 'Crop PDF',
    description: 'Crop PDF page margins visually to adjust layout boundaries.',
    category: 'pdf',
    route: '/crop-pdf',
    icon: Crop,
    instructions: [
      'Drop your PDF into the workbench resizer.',
      'Adjust the crop boxes on the page view, or set custom margin values.',
      'Click "Crop PDF" to crop all page bounding boxes and download.'
    ],
    faqs: [
      { q: 'Does cropping reduce file size?', a: 'It adjusts the display dimensions (cropBox) of the PDF, hiding the margins. Content remains inside but is cropped out of view.' }
    ]
  },
  {
    id: 'pdf-forms',
    name: 'Fill PDF Forms',
    description: 'Fill out interactive PDF forms, select checkboxes, and flatten form values.',
    category: 'pdf',
    route: '/pdf-forms',
    icon: FileEdit,
    instructions: [
      'Upload a PDF that contains interactive form fields.',
      'Click on any highlighted form input field, checkbox, or dropdown list to edit.',
      'Click "Flatten & Save" or "Save Interactive" to download the filled PDF.'
    ],
    faqs: [
      { q: 'What does "Flatten & Save" mean?', a: 'Flattening merges the form field values directly into the page content, turning inputs into static text so they cannot be edited again.' }
    ]
  },
  {
    id: 'sign-pdf',
    name: 'Sign PDF',
    description: 'Draw, type, or upload a digital signature and place it on your PDF.',
    category: 'pdf',
    route: '/sign-pdf',
    icon: FileSignature,
    instructions: [
      'Upload the PDF document you wish to sign.',
      'Create a signature (draw on canvas, type with cursive fonts, or upload image).',
      'Click on any page to stamp the signature, resize/reposition it, and click "Save Signed PDF".'
    ],
    faqs: [
      { q: 'Can I add multiple signatures?', a: 'Yes. You can stamp the signature multiple times on different pages or add new signature models.' }
    ]
  },
  {
    id: 'redact-pdf',
    name: 'Redact PDF',
    description: 'Overlay black redaction bars to permanently hide sensitive information.',
    category: 'pdf',
    route: '/redact-pdf',
    icon: EyeOff,
    instructions: [
      'Upload your PDF to the redact workbench.',
      'Click and drag on the pages to draw black redaction bounding boxes over sensitive details.',
      'Click "Apply Redaction" to burn the blocks into the document and download.'
    ],
    faqs: [
      { q: 'Does this permanently delete the hidden content?', a: 'Yes. The redaction draws solid shapes into the PDF stream, obscuring the content permanently.' }
    ]
  },
  {
    id: 'compare-pdf',
    name: 'Compare PDF',
    description: 'Compare two PDF documents side-by-side to detect adjustments.',
    category: 'pdf',
    route: '/compare-pdf',
    icon: Columns,
    instructions: [
      'Upload the original PDF (Left) and the modified PDF (Right).',
      'Scroll pages side-by-side to review changes.',
      'Differences in text or alignments will be visually highlighted.'
    ],
    faqs: [
      { q: 'Can it compare scanned pages?', a: 'Yes, it displays pages side-by-side. Text structure comparison works best on selectable text documents.' }
    ]
  },
  {
    id: 'ai-summarizer',
    name: 'AI Summarizer',
    description: 'Summarize key information from PDF documents using Gemini AI.',
    category: 'pdf',
    route: '/ai-summarizer',
    icon: Sparkles,
    instructions: [
      'Upload a text-based PDF document.',
      'Provide your Gemini API Key (saved securely in your browser session).',
      'Select a summary detail level (brief bullet points or detailed brief) and click "Summarize".'
    ],
    faqs: [
      { q: 'Is my API key sent to a server?', a: 'No. API queries are made directly from your browser to Google\'s Gemini endpoints. Your API key never passes through our server.' }
    ]
  },
  {
    id: 'pdf-to-markdown',
    name: 'PDF to Markdown',
    description: 'Translate PDF text layout and structure into clean Markdown formatting (.md).',
    category: 'pdf',
    route: '/pdf-to-markdown',
    icon: FileCode2,
    instructions: [
      'Upload your selectable text PDF document.',
      'Click "Convert to Markdown" to parse paragraphs, headings, and lists.',
      'Download your formatted .md text file.'
    ],
    faqs: [
      { q: 'Will images be converted?', a: 'Markdown is a text-based format. PDF text styling (bold, italic) and layout structures are parsed, but image binaries are omitted.' }
    ]
  },
  // IMAGE / (7))
  {
    id: 'compress-image',
    name: 'Image Compressor',
    description: 'Reduce image file size with real-time compression quality sliders.',
    category: 'image',
    route: '/compress-image',
    icon: Sliders,
    instructions: [
      'Drop your image (PNG, JPG, WebP) into the workspace.',
      'Adjust the quality slider and view live before/after file sizes.',
      'Click "Download Compressed Image" to save the optimized file.'
    ],
    faqs: [
      { q: 'Which formats support compression?', a: 'JPEG and WebP support direct quality adjustments. PNGs are optimized by palette reductions.' }
    ]
  },
  {
    id: 'resize-image',
    name: 'Image Resizer',
    description: 'Resize images by width and height pixels or percentages.',
    category: 'image',
    route: '/resize-image',
    icon: Maximize,
    instructions: [
      'Upload an image from your computer.',
      'Enter new pixel sizes or scale percentage. Toggle the chain link to lock aspect ratios.',
      'Click "Resize Image" to render canvas and download.'
    ],
    faqs: [
      { q: 'Will resizing stretch my image?', a: 'Make sure the "Maintain Aspect Ratio" box is checked to scale width and height proportionally.' }
    ]
  },
  {
    id: 'convert-image',
    name: 'Format Converter',
    description: 'Convert images between JPG, PNG, WebP, BMP, and GIF formats.',
    category: 'image',
    route: '/convert-image',
    icon: RefreshCw,
    instructions: [
      'Drop any image file (even iPhone HEIC files) onto the workbench.',
      'Choose your desired output format from the dropdown list.',
      'Click "Convert Image" to immediately download the file.'
    ],
    faqs: [
      { q: 'Can I convert transparent PNGs to JPG?', a: 'Yes. PNG transparency is converted to a white background color when saving as JPG.' }
    ]
  },
  {
    id: 'crop-image',
    name: 'Image Cropper',
    description: 'Crop images using standard aspect ratio shapes or freeform outlines.',
    category: 'image',
    route: '/crop-image',
    icon: Crop,
    instructions: [
      'Upload an image to crop.',
      'Select a preset ratio (e.g. 1:1, 16:9) or adjust the boundary boxes freely.',
      'Click "Download Crop" to save the cropped area.'
    ],
    faqs: [
      { q: 'What presets are available?', a: 'We support square (1:1), widescreen (16:9), portrait (4:3), and manual crop settings.' }
    ]
  },
  {
    id: 'passport-photo',
    name: 'Passport Photo Maker',
    description: 'Generate standard passport size grids on print-ready layout sheets.',
    category: 'image',
    route: '/passport-photo',
    icon: Contact,
    instructions: [
      'Upload your portrait photograph.',
      'Select the standard country preset dimensions (e.g. US 2x2 in, Schengen 35x45 mm).',
      'Adjust crop area to position your face, then click "Download Printable Sheet".'
    ],
    faqs: [
      { q: 'What is the printable sheet size?', a: 'We output standard 4"x6" photo paper grids by default, which can be printed cheaply at any local pharmacy or lab.' }
    ]
  },
  {
    id: 'grayscale-image',
    name: 'Grayscale Converter',
    description: 'Convert images to monochrome black and white with contrast tools.',
    category: 'image',
    route: '/grayscale-image',
    icon: Palette,
    instructions: [
      'Drop your color image onto the canvas grid.',
      'Adjust brightness and contrast sliders to optimize depth.',
      'Click "Apply Grayscale" to save the black and white output.'
    ],
    faqs: [
      { q: 'Does this destroy color data?', a: 'The output file is saved as a grayscale image. Your original file remains untouched on your device.' }
    ]
  },
  {
    id: 'signature-maker',
    name: 'Signature Maker',
    description: 'Draw a digital signature or type one using clean handwriting fonts.',
    category: 'image',
    route: '/signature-maker',
    icon: PenTool,
    instructions: [
      'Choose "Draw" mode to sketch with a mouse/touchpad OR "Type" mode to input text.',
      'Select ink colors, lines widths, or typography fonts.',
      'Click "Download Signature" to save a high-res transparent PNG.'
    ],
    faqs: [
      { q: 'Is the downloaded background transparent?', a: 'Yes, it is exported as a transparent PNG, allowing you to drop it directly onto PDFs or contracts.' }
    ]
  },
  {
    id: 'meme-generator',
    name: 'Meme Generator',
    description: 'Create custom memes by uploading images and overlaying styled captions.',
    category: 'image',
    route: '/meme-generator',
    icon: Laugh,
    instructions: [
      'Upload a base image or meme template.',
      'Type your desired Top and Bottom caption text.',
      'Adjust font styling, colors, and borders, then drag captions into position.',
      'Click "Download Meme" to export your high-resolution creation.'
    ],
    faqs: [
      { q: 'Can I add custom text colors?', a: 'Yes. You can customize fill colors, outlines, and font sizes dynamically in the sidebar panel.' }
    ]
  },
  {
    id: 'exif-stripper',
    name: 'EXIF Metadata Stripper',
    description: 'View and strip hidden EXIF metadata from photos to protect your privacy.',
    category: 'image',
    route: '/exif-stripper',
    icon: CameraOff,
    instructions: [
      'Upload any photograph (JPEG/PNG).',
      'Review parsed camera settings, capture date, and GPS coordinates.',
      'Click "Clean Metadata" to generate and download a privacy-protected image.'
    ],
    faqs: [
      { q: 'Is metadata stripping completed online?', a: 'No, all EXIF parsing and byte-stripping is handled client-side in browser memory.' }
    ]
  },
  {
    id: 'image-color-picker',
    name: 'Image Color Picker',
    description: 'Extract and copy precise Hex, RGB, and HSL colors from any uploaded image.',
    category: 'image',
    route: '/image-color-picker',
    icon: Pipette,
    instructions: [
      'Upload your image to the workspace.',
      'Hover over the image canvas to zoom in and preview color values.',
      'Click any pixel to copy the Hex color code instantly to your clipboard.'
    ],
    faqs: [
      { q: 'What color spaces are supported?', a: 'You can extract Hex codes, RGB tuples, and HSL formats.' }
    ]
  },
  {
    id: 'dpi-converter',
    name: 'Image DPI Converter',
    description: 'Change image DPI metadata without modifying visual pixel dimensions.',
    category: 'image',
    route: '/dpi-converter',
    icon: Settings,
    instructions: [
      'Upload your image file.',
      'Select a target print resolution (e.g. 72, 96, 150, 300 DPI).',
      'Click "Convert DPI" to rewrite the header metadata and download.'
    ],
    faqs: [
      { q: 'Why do I need to change DPI?', a: 'Many official portal uploads, passport applications, and printing labs require images to be set exactly at 300 DPI to guarantee resolution sizes.' }
    ]
  },
  {
    id: 'color-palette-extractor',
    name: 'Palette Extractor',
    description: 'Extract dominant color palettes and Hex codes from any uploaded image.',
    category: 'image',
    route: '/color-palette-extractor',
    icon: Palette,
    instructions: [
      'Drop your image into the workspace container.',
      'The tool will automatically sample pixel clusters to identify dominant colors.',
      'Click on any color block to copy its Hex color code.'
    ],
    faqs: [
      { q: 'How does the color palette extraction work?', a: 'We draw the image offscreen and group colors based on frequency and saturation thresholds client-side.' }
    ]
  },
  {
    id: 'image-base64',
    name: 'Image to Base64',
    description: 'Convert images to Base64 URI strings, or decode Base64 strings to downloadable images.',
    category: 'image',
    route: '/image-base64',
    icon: Binary,
    instructions: [
      'Drag and drop an image to generate its Base64 code string instantly.',
      'Or paste a Base64 image data URI string into the decoder block.',
      'Copy the output string, or click "Download Image" to save decoded pictures.'
    ],
    faqs: [
      { q: 'Are my codes secure?', a: 'Yes, all encoding and decoding operations happen locally in your browser.' }
    ]
  },

  // UTILITY / (4)
  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    description: 'Create custom QR codes for text, web links, Wi-Fi details, or vCards.',
    category: 'utility',
    route: '/qr-generator',
    icon: QrCode,
    instructions: [
      'Select your QR input type (URL, plain text, Wi-Fi details, or vCard profile).',
      'Input the credentials, and customize colors or margins.',
      'Click "Download QR Code" to save the high-res PNG or SVG.'
    ],
    faqs: [
      { q: 'Will this QR code expire?', a: 'No. It is a static QR code containing direct data, meaning it will function forever.' }
    ]
  },
  {
    id: 'word-counter',
    name: 'Word & Char Counter',
    description: 'Count words, characters, sentences, and paragraphs in real time.',
    category: 'utility',
    route: '/word-counter',
    icon: Type,
    instructions: [
      'Type or paste your text content directly into the text workspace.',
      'Check the real-time telemetry panels showing metrics, read-time, and word density.',
      'Click "Copy Stats" or "Clear Text" to manage your work.'
    ],
    faqs: [
      { q: 'Does the counter count spaces?', a: 'Yes. It provides character counts with spaces and character counts without spaces.' }
    ]
  },
  {
    id: 'password-generator',
    name: 'Password Generator',
    description: 'Create secure, random passwords locally using cryptographically secure algorithms.',
    category: 'utility',
    route: '/password-generator',
    icon: Key,
    instructions: [
      'Adjust length slider (8 to 64 characters).',
      'Check toggles for uppercase, lowercase, numbers, and symbols.',
      'Click "Generate Password" and copy the secure string to your clipboard.'
    ],
    faqs: [
      { q: 'How secure is this generator?', a: 'We use the browser\'s secure API (`crypto.getRandomValues`) to generate random indices, ensuring cryptographically secure entropy.' }
    ]
  },
  {
    id: 'case-converter',
    name: 'Text Case Converter',
    description: 'Convert text between uppercase, lowercase, title, sentence, camel, or snake case.',
    category: 'utility',
    route: '/case-converter',
    icon: Binary,
    instructions: [
      'Paste your source text in the text window.',
      'Click on any of the formatting utility buttons (e.g. UPPERCASE, camelCase).',
      'Click the copy button to save the updated text layout to your clipboard.'
    ],
    faqs: [
      { q: 'Does this handle custom punctuation?', a: 'Yes, sentence case and title case respect common punctuation marks and spacing rules.' }
    ]
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Format, validate, and minify JSON text files with collapsible tree views.',
    category: 'utility',
    route: '/json-formatter',
    icon: Braces,
    instructions: [
      'Paste your raw JSON content into the editor.',
      'Click "Format JSON" to beautify the layout OR "Minify JSON" to compress spacing.',
      'Review any inline syntax errors reported in the real-time status bar.'
    ],
    faqs: [
      { q: 'What happens to invalid JSON?', a: 'Our client-side parser validates JSON and displays clear syntax highlights pointing to the exact character or line error.' }
    ]
  },
  {
    id: 'diff-checker',
    name: 'Diff Checker',
    description: 'Compare two text blocks side-by-side to highlight differences and matching lines.',
    category: 'utility',
    route: '/diff-checker',
    icon: GitCompare,
    instructions: [
      'Input your original text block in the Left panel.',
      'Input the modified text block in the Right panel.',
      'Review highlighted additions (green) and deletions (red) in real-time.'
    ],
    faqs: [
      { q: 'Is it word-level or character-level?', a: 'We run a local difference engine highlighting exact line differences and word changes.' }
    ]
  },
  {
    id: 'csv-json-converter',
    name: 'CSV JSON Converter',
    description: 'Convert CSV files to clean JSON format, or format JSON objects back to CSV columns.',
    category: 'utility',
    route: '/csv-json-converter',
    icon: FileSpreadsheet,
    instructions: [
      'Upload a CSV spreadsheet OR paste JSON data arrays.',
      'Select conversion mode: "CSV to JSON" or "JSON to CSV".',
      'Review the parsed output, copy it, or download the converted file.'
    ],
    faqs: [
      { q: 'Does it support custom delimiters?', a: 'Yes. It automatically parses standard comma-separated, tab-separated, and semicolon-separated formatting values.' }
    ]
  },
  {
    id: 'barcode-tool',
    name: 'Barcode Tool',
    description: 'Generate customizable barcodes or scan barcodes using your webcam.',
    category: 'utility',
    route: '/barcode-tool',
    icon: ScanBarcode,
    instructions: [
      'Choose "Generate Barcode" and enter text values to create Code128, EAN, or UPC barcodes.',
      'Or choose "Scan Barcode" and point your webcam camera at any barcode line.',
      'Copy scanned values or download generated barcode images.'
    ],
    faqs: [
      { q: 'Which barcode standards are supported?', a: 'We support Code 128, EAN-13, UPC-A, and basic Code 39 formats client-side.' }
    ]
  },
  {
    id: 'markdown-editor',
    name: 'Markdown Editor',
    description: 'Write markdown syntax with a live split-screen styled HTML render view.',
    category: 'utility',
    route: '/markdown-editor',
    icon: FileCode,
    instructions: [
      'Write or paste Markdown syntax in the left panel.',
      'Preview real-time styled text headers, links, lists, and tables on the right side.',
      'Click "Export Markdown" or "Copy HTML" to save your results.'
    ],
    faqs: [
      { q: 'Can I include tables and code blocks?', a: 'Yes, our local parser supports standard GitHub Flavored Markdown (GFM) elements.' }
    ]
  },
  {
    id: 'text-to-speech',
    name: 'Speech & Text Helper',
    description: 'Convert text-to-speech voice reader or dictate voice into text notes.',
    category: 'utility',
    route: '/text-to-speech',
    icon: Mic,
    instructions: [
      'For Voice Reader: Paste text, choose a device voice, speed, and click Speak.',
      'For Voice Dictation: Click "Start Dictation" and speak into your microphone.',
      'Dictated text will build in the notepad, ready for you to copy.'
    ],
    faqs: [
      { q: 'Are my voice files sent to a server?', a: 'No, Web Speech synthesis and recognition APIs run completely locally in your browser engine.' }
    ]
  },
  {
    id: 'age-calculator',
    name: 'Age & Date Calculator',
    description: 'Calculate ages, date differences, and upcoming birthday countdowns.',
    category: 'utility',
    route: '/age-calculator',
    icon: Calendar,
    instructions: [
      'Select your birthdate to calculate exact age details.',
      'Review age telemetry broken down in years, months, weeks, days, and seconds.',
      'Use the Date Gap tab to measure durations between any two dates.'
    ],
    faqs: [
      { q: 'Does it account for leap years?', a: 'Yes, date calculations respect exact calendar metrics, leap years, and month lengths.' }
    ]
  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    description: 'Generate bulk cryptographically secure UUIDv4 identifiers instantly.',
    category: 'utility',
    route: '/uuid-generator',
    icon: Fingerprint,
    instructions: [
      'Enter the quantity of UUIDs to generate (up to 500).',
      'Toggle uppercase formats or hyphen removals.',
      'Click "Generate UUIDs" and copy the outputs to your clipboard.'
    ],
    faqs: [
      { q: 'Is it secure?', a: 'Yes, we use the standard Web Crypto API to generate high-entropy random GUIDs.' }
    ]
  }
];

