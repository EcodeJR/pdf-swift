# Remaining Features Implementation Guide

## Overview
This guide provides complete implementation instructions for the remaining high-priority features.

---

## 1. PDF to JPG Conversion

### Package Required
Add to `server/package.json`:
```json
"pdf-poppler": "^0.2.1"
```

### Installation
```bash
cd pdf-toolkit/server
npm install pdf-poppler
```

**Note:** pdf-poppler requires Poppler to be installed on the system:
- **Windows:** Download from https://github.com/oschwartz10612/poppler-windows/releases
- **Linux:** `sudo apt-get install poppler-utils`
- **Mac:** `brew install poppler`

### Implementation

**File:** `server/controllers/conversionController.js`

Add import:
```javascript
const { convert } = require('pdf-poppler');
const fsSync = require('fs');
```

Replace the placeholder `exports.pdfToJpg`:
```javascript
exports.pdfToJpg = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const pdfPath = req.file.path;
    const outputDir = path.join(__dirname, '../uploads');
    const baseFileName = path.basename(req.file.filename, '.pdf');
    
    // PDF to image conversion options
    const opts = {
      format: 'jpeg',
      out_dir: outputDir,
      out_prefix: baseFileName,
      page: null // Convert all pages
    };

    // Convert PDF to images
    await convert(pdfPath, opts);

    // Find generated image files
    const files = await fs.readdir(outputDir);
    const imageFiles = files.filter(f => f.startsWith(baseFileName) && f.endsWith('.jpg'));

    if (imageFiles.length === 0) {
      throw new Error('No images generated from PDF');
    }

    const outputFileName = imageFiles[0];
    const outputPath = path.join(outputDir, outputFileName);
    const stats = await fs.stat(outputPath);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'pdf-to-jpg',
      req.file.originalname,
      outputFileName,
      stats.size,
      req.body.storageType || 'temporary'
    );

    // Clean up original PDF
    await fs.unlink(pdfPath);

    const conversionTime = Date.now() - startTime;

    res.json({
      message: `PDF converted to ${imageFiles.length} JPG image(s) successfully`,
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: stats.size,
      pageCount: imageFiles.length,
      conversionTime,
      allImages: imageFiles.map(f => `/api/convert/download/${f}`)
    });
  } catch (error) {
    console.error('PDF to JPG error:', error);
    res.status(500).json({ 
      message: 'Error converting PDF to JPG. Ensure Poppler is installed.', 
      error: error.message 
    });
  }
};
```

---

## 2. Word to PDF Conversion

### Package Required
Add to `server/package.json`:
```json
"libreoffice-convert": "^1.6.0"
```

### Installation
```bash
npm install libreoffice-convert
```

**Note:** Requires LibreOffice to be installed:
- **Windows:** Download from https://www.libreoffice.org/download/
- **Linux:** `sudo apt-get install libreoffice`
- **Mac:** `brew install libreoffice`

### Implementation

Add import:
```javascript
const libre = require('libreoffice-convert');
const { promisify } = require('util');
const libreConvert = promisify(libre.convert);
```

Replace `exports.wordToPdf`:
```javascript
exports.wordToPdf = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read the DOCX file
    const docxBuffer = await fs.readFile(req.file.path);
    
    // Convert to PDF using LibreOffice
    const pdfBuffer = await libreConvert(docxBuffer, '.pdf', undefined);
    
    const outputFileName = req.file.filename.replace(/\.(docx|doc)$/, '.pdf');
    const outputPath = path.join(__dirname, '../uploads', outputFileName);
    
    await fs.writeFile(outputPath, pdfBuffer);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'word-to-pdf',
      req.file.originalname,
      outputFileName,
      pdfBuffer.length,
      req.body.storageType || 'temporary'
    );

    // Clean up original file
    await fs.unlink(req.file.path);

    const conversionTime = Date.now() - startTime;

    res.json({
      message: 'Word document converted to PDF successfully',
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: pdfBuffer.length,
      conversionTime
    });
  } catch (error) {
    console.error('Word to PDF error:', error);
    res.status(500).json({ 
      message: 'Error converting Word to PDF. Ensure LibreOffice is installed.', 
      error: error.message 
    });
  }
};
```

---

## 3. Excel to PDF Conversion

### Uses Same Package as Word to PDF
Already added: `libreoffice-convert`

### Implementation

Replace `exports.excelToPdf`:
```javascript
exports.excelToPdf = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read the XLSX file
    const xlsxBuffer = await fs.readFile(req.file.path);
    
    // Convert to PDF using LibreOffice
    const pdfBuffer = await libreConvert(xlsxBuffer, '.pdf', undefined);
    
    const outputFileName = req.file.filename.replace(/\.(xlsx|xls)$/, '.pdf');
    const outputPath = path.join(__dirname, '../uploads', outputFileName);
    
    await fs.writeFile(outputPath, pdfBuffer);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'excel-to-pdf',
      req.file.originalname,
      outputFileName,
      pdfBuffer.length,
      req.body.storageType || 'temporary'
    );

    // Clean up original file
    await fs.unlink(req.file.path);

    const conversionTime = Date.now() - startTime;

    res.json({
      message: 'Excel spreadsheet converted to PDF successfully',
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: pdfBuffer.length,
      conversionTime
    });
  } catch (error) {
    console.error('Excel to PDF error:', error);
    res.status(500).json({ 
      message: 'Error converting Excel to PDF. Ensure LibreOffice is installed.', 
      error: error.message 
    });
  }
};
```

---

## 4. PDF Preview Component

### Package Required (Client)
Add to `client/package.json`:
```json
"react-pdf": "^7.7.0"
```

### Installation
```bash
cd pdf-toolkit/client
npm install react-pdf
```

### Create Preview Component

**File:** `client/src/components/PdfPreview.js`

```javascript
import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PdfPreview = ({ file, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">PDF Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          <div className="flex justify-center">
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="text-center py-8">Loading PDF...</div>}
              error={<div className="text-center py-8 text-red-600">Failed to load PDF</div>}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300"
            >
              Previous
            </button>
            <span className="text-sm">
              Page {pageNumber} of {numPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300"
            >
              Next
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={zoomOut}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              -
            </button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <button
              onClick={zoomIn}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfPreview;
```

### Usage in Conversion Tools

Example in `PdfToWord.js`:

```javascript
import PdfPreview from '../../components/PdfPreview';

// Add state
const [showPreview, setShowPreview] = useState(false);

// Add preview button
{selectedFiles.length > 0 && (
  <button
    onClick={() => setShowPreview(true)}
    className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
  >
    Preview PDF
  </button>
)}

// Add preview modal
{showPreview && (
  <PdfPreview
    file={selectedFiles[0]}
    onClose={() => setShowPreview(false)}
  />
)}
```

---

## 5. Installation Steps

### Server Packages
```bash
cd pdf-toolkit/server

# Install all new packages
npm install pdf-poppler libreoffice-convert

# Verify installation
npm list pdf-poppler libreoffice-convert
```

### Client Packages
```bash
cd pdf-toolkit/client

# Install PDF preview
npm install react-pdf

# Verify installation
npm list react-pdf
```

### System Dependencies

**Windows:**
1. Install Poppler: https://github.com/oschwartz10612/poppler-windows/releases
2. Install LibreOffice: https://www.libreoffice.org/download/
3. Add to PATH environment variable

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install poppler-utils libreoffice
```

**macOS:**
```bash
brew install poppler libreoffice
```

---

## 6. Testing Checklist

### PDF to JPG
- [ ] Upload single-page PDF
- [ ] Upload multi-page PDF
- [ ] Verify all pages converted
- [ ] Check image quality
- [ ] Test with large PDFs

### Word to PDF
- [ ] Upload .docx file
- [ ] Upload .doc file
- [ ] Verify formatting preserved
- [ ] Test with images in document
- [ ] Test with complex formatting

### Excel to PDF
- [ ] Upload .xlsx file
- [ ] Upload .xls file
- [ ] Verify tables preserved
- [ ] Test with charts
- [ ] Test with multiple sheets

### PDF Preview
- [ ] Preview single-page PDF
- [ ] Preview multi-page PDF
- [ ] Test navigation (prev/next)
- [ ] Test zoom in/out
- [ ] Test on mobile

---

## 7. Error Handling

### Common Errors

**Poppler not found:**
```
Error: spawn pdftoppm ENOENT
Solution: Install Poppler and add to PATH
```

**LibreOffice not found:**
```
Error: LibreOffice not found
Solution: Install LibreOffice and ensure it's in PATH
```

**PDF.js worker error:**
```
Error: Setting up fake worker failed
Solution: Check worker URL in PdfPreview component
```

---

## 8. Update ISSUES_TO_FIX.md

After implementation, mark as complete:

```markdown
- ✅ FIXED - Missing Implementations:
    - PDF to JPG: Implemented with pdf-poppler
    - Word to PDF: Implemented with libreoffice-convert
    - Excel to PDF: Implemented with libreoffice-convert
    - PDF Preview: Implemented with react-pdf
```

---

## 9. Performance Considerations

### PDF to JPG
- Large PDFs may take time to convert
- Consider adding page limit for free users
- Implement progress tracking

### Word/Excel to PDF
- LibreOffice conversion can be slow
- Consider queue system for large files
- Add timeout handling

### PDF Preview
- Large PDFs may be slow to load
- Consider lazy loading pages
- Implement caching

---

## 10. Next Steps

1. Install system dependencies (Poppler, LibreOffice)
2. Install npm packages
3. Implement conversion functions
4. Create PDF preview component
5. Test all features
6. Update documentation
7. Deploy to production

---

**Implementation Priority:**
1. PDF to JPG (most requested)
2. Word to PDF (common use case)
3. Excel to PDF (business users)
4. PDF Preview (UX enhancement)

**Estimated Time:**
- PDF to JPG: 30 minutes
- Word to PDF: 20 minutes
- Excel to PDF: 15 minutes
- PDF Preview: 45 minutes
- Testing: 1 hour
- **Total: ~3 hours**

---

**Status:** Ready for implementation  
**Dependencies:** Poppler, LibreOffice  
**Complexity:** Medium  
**Impact:** High (completes all major conversion features)
