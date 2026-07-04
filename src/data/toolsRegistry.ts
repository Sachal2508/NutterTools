import { 
  Merge, Scissors, Minimize2, FileText, FileCode, Image, FileImage, 
  RotateCw, Unlock, Lock, FolderArchive, Hash, Sliders, Maximize, 
  RefreshCw, Crop, Contact, Palette, PenTool, QrCode, Type, Key, Binary 
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
  // PDF / (12)
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
      'Click "Convert to Word" to parse and translate structural layouts.',
      'Download the editable .docx file to your computer.'
    ],
    faqs: [
      { q: 'Does this tool support scanned PDFs (OCR)?', a: 'No. This tool runs 100% in your browser and extracts selectable text. Scanned PDFs containing only images will convert to empty pages or images. Offline OCR is not supported.' },
      { q: 'Will the styling and layout remain exactly identical?', a: 'Complex multi-column layouts, custom fonts, or floating graphics may require adjustments in Word after conversion.' }
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
      'Preview the parsed outline structure in the browser.',
      'Click "Convert to PDF" to render and trigger your download.'
    ],
    faqs: [
      { q: 'Does this support older .doc formats?', a: 'No, it only supports modern XML-based Word files ending in .docx.' },
      { q: 'Are custom fonts supported?', a: 'Yes, it attempts to map standard system fonts. Standard layout conversion keeps styles intact.' }
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

  // IMAGE / (7)
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
  }
];
