# Quick Installation Guide - Remaining Features

## 🚀 Quick Start

### Step 1: Install System Dependencies

**Windows:**
```powershell
# Download and install manually:
# 1. Poppler: https://github.com/oschwartz10612/poppler-windows/releases
# 2. LibreOffice: https://www.libreoffice.org/download/

# Add to PATH (replace with your install paths):
$env:PATH += ";C:\Program Files\poppler\bin"
$env:PATH += ";C:\Program Files\LibreOffice\program"
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install -y poppler-utils libreoffice
```

**macOS:**
```bash
brew install poppler libreoffice
```

### Step 2: Install Server Packages

```bash
cd pdf-toolkit/server
npm install pdf-poppler libreoffice-convert
```

### Step 3: Install Client Packages

```bash
cd pdf-toolkit/client
npm install react-pdf
```

### Step 4: Verify Installation

```bash
# Check Poppler
pdftoppm -v

# Check LibreOffice
libreoffice --version

# Check npm packages
cd pdf-toolkit/server
npm list pdf-poppler libreoffice-convert

cd ../client
npm list react-pdf
```

---

## 📝 Implementation Checklist

### Server Implementation
- [ ] Add pdf-poppler to package.json
- [ ] Add libreoffice-convert to package.json
- [ ] Run `npm install`
- [ ] Update conversionController.js imports
- [ ] Implement pdfToJpg function
- [ ] Implement wordToPdf function
- [ ] Implement excelToPdf function
- [ ] Test each conversion

### Client Implementation
- [ ] Add react-pdf to package.json
- [ ] Run `npm install`
- [ ] Create PdfPreview.js component
- [ ] Add preview button to conversion tools
- [ ] Test preview functionality

### Testing
- [ ] Test PDF to JPG with single page
- [ ] Test PDF to JPG with multiple pages
- [ ] Test Word to PDF with .docx
- [ ] Test Word to PDF with .doc
- [ ] Test Excel to PDF with .xlsx
- [ ] Test Excel to PDF with .xls
- [ ] Test PDF preview navigation
- [ ] Test PDF preview zoom

### Documentation
- [ ] Update ISSUES_TO_FIX.md
- [ ] Create feature documentation
- [ ] Update README if needed

---

## ⚡ Quick Copy-Paste Commands

### Install Everything (Linux/Mac)
```bash
# System dependencies
sudo apt-get install -y poppler-utils libreoffice  # Linux
# brew install poppler libreoffice  # Mac

# Server packages
cd pdf-toolkit/server
npm install pdf-poppler libreoffice-convert

# Client packages
cd ../client
npm install react-pdf

# Verify
cd ../server
npm list pdf-poppler libreoffice-convert
cd ../client
npm list react-pdf
```

### Install Everything (Windows PowerShell)
```powershell
# Download and install Poppler and LibreOffice manually first!

# Server packages
cd pdf-toolkit\server
npm install pdf-poppler libreoffice-convert

# Client packages
cd ..\client
npm install react-pdf

# Verify
cd ..\server
npm list pdf-poppler libreoffice-convert
cd ..\client
npm list react-pdf
```

---

## 🔧 Troubleshooting

### Poppler Issues
**Error:** `spawn pdftoppm ENOENT`  
**Solution:** 
1. Install Poppler
2. Add to PATH
3. Restart terminal/IDE
4. Verify with `pdftoppm -v`

### LibreOffice Issues
**Error:** `LibreOffice not found`  
**Solution:**
1. Install LibreOffice
2. Add to PATH
3. Restart terminal/IDE
4. Verify with `libreoffice --version`

### PDF.js Worker Issues
**Error:** `Setting up fake worker failed`  
**Solution:** Check worker URL in PdfPreview.js:
```javascript
pdfjs.GlobalWorkerOptions.workerSrc = 
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
```

### npm Install Issues
**Error:** `ERESOLVE unable to resolve dependency tree`  
**Solution:**
```bash
npm install --legacy-peer-deps
```

---

## 📊 Expected Results

### After Installation
```
✅ Poppler installed and in PATH
✅ LibreOffice installed and in PATH
✅ pdf-poppler package installed
✅ libreoffice-convert package installed
✅ react-pdf package installed
✅ All dependencies resolved
```

### After Implementation
```
✅ PDF to JPG conversion working
✅ Word to PDF conversion working
✅ Excel to PDF conversion working
✅ PDF preview component working
✅ All tests passing
✅ Documentation updated
```

---

## 🎯 Next Steps After Installation

1. **Implement the conversions** - Follow REMAINING_FEATURES_IMPLEMENTATION.md
2. **Test thoroughly** - Use the testing checklist
3. **Update documentation** - Mark features as complete
4. **Deploy** - Push to production

---

## 💡 Tips

- Test with small files first
- Check server logs for errors
- Use Postman to test API endpoints
- Monitor memory usage with large files
- Consider adding file size limits

---

## 📞 Support

If you encounter issues:
1. Check system dependencies are installed
2. Verify PATH environment variables
3. Check npm package versions
4. Review server logs
5. Test with simple files first

---

**Ready to implement?** Follow REMAINING_FEATURES_IMPLEMENTATION.md for detailed code!
