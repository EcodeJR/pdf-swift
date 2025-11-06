# Testing Guide - New Conversion Features

## 🎉 Implementation Complete!

All conversion features have been successfully implemented:
- ✅ PDF to JPG conversion
- ✅ Word to PDF conversion
- ✅ Excel to PDF conversion
- ✅ PDF Preview component

---

## 📋 What Was Implemented

### Server-Side (conversionController.js)

**Added Imports:**
```javascript
const libre = require('libreoffice-convert');
const { promisify } = require('util');
const libreConvert = promisify(libre.convert);
```

**Implemented Functions:**
1. `exports.pdfToJpg` - Converts PDF to JPG images using pdf-poppler
2. `exports.wordToPdf` - Converts Word documents to PDF using LibreOffice
3. `exports.excelToPdf` - Converts Excel spreadsheets to PDF using LibreOffice

### Client-Side

**Created Component:**
- `client/src/components/PdfPreview.js` - Full-featured PDF preview with navigation and zoom

---

## 🧪 Testing Instructions

### Prerequisites

1. **Verify System Dependencies:**
```powershell
# Check Poppler
pdftoppm -v

# Check LibreOffice
libreoffice --version
```

Both should return version information. If not, refer to LOCAL_INSTALLATION_GUIDE.md.

2. **Start the Server:**
```bash
cd pdf-toolkit/server
npm run dev
```

3. **Start the Client (in another terminal):**
```bash
cd pdf-toolkit/client
npm start
```

---

## Test 1: PDF to JPG Conversion

### Using Postman/cURL

```bash
curl -X POST http://localhost:5000/api/convert/pdf-to-jpg \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/your/test.pdf"
```

### Expected Response:
```json
{
  "message": "PDF converted to 3 JPG image(s) successfully",
  "downloadUrl": "/api/convert/download/test-1.jpg",
  "fileName": "test-1.jpg",
  "fileSize": 245678,
  "pageCount": 3,
  "conversionTime": 2345,
  "allImages": [
    "/api/convert/download/test-1.jpg",
    "/api/convert/download/test-2.jpg",
    "/api/convert/download/test-3.jpg"
  ]
}
```

### Test Cases:
- [ ] Single-page PDF
- [ ] Multi-page PDF (3-5 pages)
- [ ] Large PDF (10+ pages)
- [ ] Invalid PDF (should return error)
- [ ] Empty file (should return error)

### What to Check:
- ✅ JPG files created in `server/uploads/`
- ✅ Original PDF deleted after conversion
- ✅ All pages converted
- ✅ Images are viewable
- ✅ Conversion tracked in database

---

## Test 2: Word to PDF Conversion

### Using Postman/cURL

```bash
curl -X POST http://localhost:5000/api/convert/word-to-pdf \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/your/test.docx"
```

### Expected Response:
```json
{
  "message": "Word document converted to PDF successfully",
  "downloadUrl": "/api/convert/download/test.pdf",
  "fileName": "test.pdf",
  "fileSize": 123456,
  "conversionTime": 3456
}
```

### Test Cases:
- [ ] .docx file (modern format)
- [ ] .doc file (legacy format)
- [ ] Document with images
- [ ] Document with tables
- [ ] Document with formatting (bold, italic, etc.)
- [ ] Invalid Word file (should return error)

### What to Check:
- ✅ PDF file created in `server/uploads/`
- ✅ Original DOCX deleted after conversion
- ✅ PDF is viewable
- ✅ Formatting preserved
- ✅ Images included (if any)
- ✅ Conversion tracked in database

---

## Test 3: Excel to PDF Conversion

### Using Postman/cURL

```bash
curl -X POST http://localhost:5000/api/convert/excel-to-pdf \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/your/test.xlsx"
```

### Expected Response:
```json
{
  "message": "Excel spreadsheet converted to PDF successfully",
  "downloadUrl": "/api/convert/download/test.pdf",
  "fileName": "test.pdf",
  "fileSize": 98765,
  "conversionTime": 2987
}
```

### Test Cases:
- [ ] .xlsx file (modern format)
- [ ] .xls file (legacy format)
- [ ] Spreadsheet with multiple sheets
- [ ] Spreadsheet with charts
- [ ] Spreadsheet with formulas
- [ ] Invalid Excel file (should return error)

### What to Check:
- ✅ PDF file created in `server/uploads/`
- ✅ Original XLSX deleted after conversion
- ✅ PDF is viewable
- ✅ Tables preserved
- ✅ Charts included (if any)
- ✅ Conversion tracked in database

---

## Test 4: PDF Preview Component

### Integration Test

To test the PDF preview, you'll need to integrate it into one of your conversion pages.

**Example: Add to PdfToWord.js**

```javascript
import PdfPreview from '../../components/PdfPreview';

// Add state
const [showPreview, setShowPreview] = useState(false);

// Add preview button (after file selection)
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

### Test Cases:
- [ ] Preview single-page PDF
- [ ] Preview multi-page PDF
- [ ] Navigate between pages (prev/next)
- [ ] Zoom in/out
- [ ] Close preview
- [ ] Invalid PDF (should show error)

### What to Check:
- ✅ PDF renders correctly
- ✅ Page navigation works
- ✅ Zoom controls work
- ✅ Close button works
- ✅ Loading state shows
- ✅ Error state shows for invalid PDFs

---

## 🔍 End-to-End Testing

### Scenario 1: Guest User PDF to JPG

1. Open browser to `http://localhost:3000`
2. Navigate to PDF to JPG tool
3. Upload a test PDF
4. Click "Convert to JPG"
5. Wait for conversion
6. Download the JPG
7. Verify JPG is correct

### Scenario 2: Authenticated User Word to PDF

1. Login to the application
2. Navigate to Word to PDF tool
3. Upload a test DOCX
4. Click "Convert to PDF"
5. Wait for conversion
6. Download the PDF
7. Verify PDF formatting

### Scenario 3: Premium User Excel to PDF

1. Login as premium user
2. Navigate to Excel to PDF tool
3. Upload a test XLSX
4. Select "Cloud Storage" option
5. Click "Convert to PDF"
6. Wait for conversion
7. Verify file stored in GridFS
8. Download from cloud

---

## 🐛 Common Issues & Solutions

### Issue 1: "pdftoppm not found"

**Error:**
```
Error: spawn pdftoppm ENOENT
```

**Solution:**
```powershell
# Verify Poppler is in PATH
pdftoppm -v

# If not found, add to PATH:
# C:\Program Files\poppler\Library\bin
```

### Issue 2: "LibreOffice conversion failed"

**Error:**
```
Error: LibreOffice conversion failed
```

**Solution:**
```powershell
# Verify LibreOffice is installed
libreoffice --version

# Restart the server after installing LibreOffice
```

### Issue 3: "PDF Preview not loading"

**Error:**
```
Error: Setting up fake worker failed
```

**Solution:**
Check the worker URL in PdfPreview.js:
```javascript
pdfjs.GlobalWorkerOptions.workerSrc = 
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
```

### Issue 4: "Conversion timeout"

**Error:**
```
Error: Conversion timeout
```

**Solution:**
Large files may take longer. This is normal for:
- PDFs with 50+ pages
- Word documents with many images
- Excel files with complex charts

---

## 📊 Performance Benchmarks

### Expected Conversion Times

**PDF to JPG:**
- 1-5 pages: 1-3 seconds
- 10-20 pages: 3-8 seconds
- 50+ pages: 10-30 seconds

**Word to PDF:**
- 1-10 pages: 2-5 seconds
- 20-50 pages: 5-15 seconds
- 100+ pages: 15-45 seconds

**Excel to PDF:**
- 1-5 sheets: 2-5 seconds
- 10-20 sheets: 5-15 seconds
- 50+ sheets: 15-45 seconds

---

## ✅ Testing Checklist

### Server Tests
- [ ] PDF to JPG with single-page PDF
- [ ] PDF to JPG with multi-page PDF
- [ ] Word to PDF with .docx file
- [ ] Word to PDF with .doc file
- [ ] Excel to PDF with .xlsx file
- [ ] Excel to PDF with .xls file
- [ ] Error handling for invalid files
- [ ] Error handling for missing files
- [ ] File cleanup after conversion
- [ ] Conversion tracking in database

### Client Tests
- [ ] PDF preview loads correctly
- [ ] Page navigation works
- [ ] Zoom controls work
- [ ] Close button works
- [ ] Error handling for invalid PDFs
- [ ] Loading state displays
- [ ] Responsive design on mobile

### Integration Tests
- [ ] Guest user conversions
- [ ] Authenticated user conversions
- [ ] Premium user conversions
- [ ] Rate limiting works
- [ ] File size limits enforced
- [ ] Cloud storage option works
- [ ] Download links work
- [ ] Conversion history updates

---

## 🚀 Quick Test Script

Create a file `test-conversions.sh` (or `.ps1` for Windows):

```bash
#!/bin/bash

echo "Testing PDF to JPG..."
curl -X POST http://localhost:5000/api/convert/pdf-to-jpg \
  -F "file=@test-files/sample.pdf" \
  -o test-results/pdf-to-jpg.json

echo "Testing Word to PDF..."
curl -X POST http://localhost:5000/api/convert/word-to-pdf \
  -F "file=@test-files/sample.docx" \
  -o test-results/word-to-pdf.json

echo "Testing Excel to PDF..."
curl -X POST http://localhost:5000/api/convert/excel-to-pdf \
  -F "file=@test-files/sample.xlsx" \
  -o test-results/excel-to-pdf.json

echo "All tests complete! Check test-results/ folder"
```

---

## 📝 Test Files

Create a `test-files/` directory with:
- `sample.pdf` - Multi-page PDF for testing
- `sample.docx` - Word document with formatting
- `sample.doc` - Legacy Word document
- `sample.xlsx` - Excel spreadsheet with data
- `sample.xls` - Legacy Excel file
- `invalid.pdf` - Corrupted PDF for error testing

---

## 🎯 Success Criteria

All features are working correctly when:

1. ✅ All API endpoints return 200 status
2. ✅ Converted files are created successfully
3. ✅ Original files are cleaned up
4. ✅ Conversions are tracked in database
5. ✅ Download links work
6. ✅ PDF preview component renders
7. ✅ Error handling works properly
8. ✅ No console errors
9. ✅ Performance is acceptable
10. ✅ All test cases pass

---

## 🎉 Next Steps After Testing

Once all tests pass:

1. **Update ISSUES_TO_FIX.md**
   - Mark PDF to JPG as ✅ FIXED
   - Mark Word to PDF as ✅ FIXED
   - Mark Excel to PDF as ✅ FIXED
   - Mark PDF Preview as ✅ FIXED

2. **Deploy to Production**
   - Install Poppler and LibreOffice on production server
   - Deploy updated code
   - Run smoke tests

3. **Monitor Performance**
   - Track conversion times
   - Monitor error rates
   - Check server resources

4. **User Feedback**
   - Collect user feedback
   - Fix any issues
   - Optimize as needed

---

## 📞 Support

If you encounter any issues during testing:

1. Check server logs: `pdf-toolkit/server/logs/`
2. Check browser console for client errors
3. Verify system dependencies are installed
4. Review error messages carefully
5. Check INSTALLATION_TROUBLESHOOTING.md

---

**Status:** Ready for testing! 🚀  
**Estimated Testing Time:** 30-60 minutes  
**All features implemented and ready to test!**
