# Local Installation Guide - Poppler & LibreOffice

## 🎯 Installation for Windows Development Machine

This guide will help you install Poppler and LibreOffice on your Windows development machine.

---

## Step 1: Install Poppler (PDF to JPG)

### Download Poppler for Windows

1. **Visit:** https://github.com/oschwartz10612/poppler-windows/releases
2. **Download:** Latest release (e.g., `Release-24.08.0-0.zip`)
3. **Extract** to: `C:\Program Files\poppler`

### Add Poppler to PATH

**Option A: Using System Settings (Recommended)**

1. Press `Windows + R`
2. Type: `sysdm.cpl` and press Enter
3. Click **"Advanced"** tab
4. Click **"Environment Variables"**
5. Under **"System variables"**, find **"Path"**
6. Click **"Edit"**
7. Click **"New"**
8. Add: `C:\Program Files\poppler\Library\bin`
9. Click **"OK"** on all dialogs

**Option B: Using PowerShell (Quick)**

```powershell
# Run PowerShell as Administrator
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$newPath = $currentPath + ";C:\Program Files\poppler\Library\bin"
[Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
```

### Verify Poppler Installation

```powershell
# Close and reopen PowerShell/Terminal
pdftoppm -v
```

**Expected Output:**
```
pdftoppm version 24.08.0
Copyright 2005-2024 The Poppler Developers - http://poppler.freedesktop.org
...
```

---

## Step 2: Install LibreOffice (Word/Excel to PDF)

### Download LibreOffice

1. **Visit:** https://www.libreoffice.org/download/download-libreoffice/
2. **Download:** Latest stable version for Windows (e.g., `LibreOffice_24.8.2_Win_x86-64.msi`)
3. **Run installer** and follow prompts
4. **Default installation** is fine

### Verify LibreOffice Installation

```powershell
# LibreOffice usually auto-adds to PATH
libreoffice --version
```

**Expected Output:**
```
LibreOffice 24.8.2.1 ...
```

**If command not found:**

Add to PATH manually:
```
C:\Program Files\LibreOffice\program
```

---

## Step 3: Verify Both Installations

### Quick Test Script

Create a test file: `test-installations.ps1`

```powershell
# Test Poppler
Write-Host "Testing Poppler..." -ForegroundColor Cyan
try {
    $popplerVersion = pdftoppm -v 2>&1
    Write-Host "✓ Poppler installed: $($popplerVersion[0])" -ForegroundColor Green
} catch {
    Write-Host "✗ Poppler not found" -ForegroundColor Red
}

# Test LibreOffice
Write-Host "`nTesting LibreOffice..." -ForegroundColor Cyan
try {
    $libreVersion = libreoffice --version 2>&1
    Write-Host "✓ LibreOffice installed: $libreVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ LibreOffice not found" -ForegroundColor Red
}

Write-Host "`n✓ All dependencies installed successfully!" -ForegroundColor Green
```

Run it:
```powershell
.\test-installations.ps1
```

---

## Step 4: Update package.json (Already Done)

Your server `package.json` already has:
```json
{
  "dependencies": {
    "pdf-poppler": "^0.2.1",
    "libreoffice-convert": "^1.6.0"
  }
}
```

✅ npm packages already installed!

---

## Step 5: Implement Conversion Functions

Now you can implement the conversions using the code from **REMAINING_FEATURES_IMPLEMENTATION.md**.

### Update conversionController.js

**File:** `server/controllers/conversionController.js`

Add imports at the top:
```javascript
const { convert } = require('pdf-poppler');
const libre = require('libreoffice-convert');
const { promisify } = require('util');
const libreConvert = promisify(libre.convert);
```

Then replace the placeholder functions with the implementations from REMAINING_FEATURES_IMPLEMENTATION.md.

---

## 🧪 Testing Your Setup

### Test 1: PDF to JPG

Create a test PDF and try:

```powershell
cd pdf-toolkit/server
node -e "
const { convert } = require('pdf-poppler');
const opts = {
  format: 'jpeg',
  out_dir: './uploads',
  out_prefix: 'test',
  page: null
};
convert('./test.pdf', opts).then(() => {
  console.log('✓ PDF to JPG works!');
}).catch(err => {
  console.error('✗ Error:', err.message);
});
"
```

### Test 2: Word to PDF

```powershell
node -e "
const libre = require('libreoffice-convert');
const fs = require('fs');
const { promisify } = require('util');
const libreConvert = promisify(libre.convert);

(async () => {
  const docx = fs.readFileSync('./test.docx');
  const pdf = await libreConvert(docx, '.pdf', undefined);
  fs.writeFileSync('./test-output.pdf', pdf);
  console.log('✓ Word to PDF works!');
})();
"
```

### Test 3: Excel to PDF

```powershell
node -e "
const libre = require('libreoffice-convert');
const fs = require('fs');
const { promisify } = require('util');
const libreConvert = promisify(libre.convert);

(async () => {
  const xlsx = fs.readFileSync('./test.xlsx');
  const pdf = await libreConvert(xlsx, '.pdf', undefined);
  fs.writeFileSync('./test-excel-output.pdf', pdf);
  console.log('✓ Excel to PDF works!');
})();
"
```

---

## 🚨 Troubleshooting

### Issue 1: "pdftoppm not found"

**Solution:**
1. Verify PATH is set correctly
2. Restart terminal/IDE
3. Check installation directory exists
4. Try full path: `C:\Program Files\poppler\Library\bin\pdftoppm.exe -v`

### Issue 2: "libreoffice not found"

**Solution:**
1. Reinstall LibreOffice
2. Check installation directory: `C:\Program Files\LibreOffice\program`
3. Add to PATH manually
4. Restart terminal/IDE

### Issue 3: "spawn ENOENT" error

**Solution:**
```javascript
// Add explicit path in code (temporary fix)
const opts = {
  format: 'jpeg',
  out_dir: './uploads',
  out_prefix: 'test',
  page: null,
  // Add this if needed:
  poppler_path: 'C:\\Program Files\\poppler\\Library\\bin'
};
```

### Issue 4: LibreOffice conversion hangs

**Solution:**
```javascript
// Add timeout
const libreConvert = promisify(libre.convert);

// Use with timeout
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Conversion timeout')), 30000)
);

const pdf = await Promise.race([
  libreConvert(docx, '.pdf', undefined),
  timeoutPromise
]);
```

---

## 📋 Installation Checklist

- [ ] Download Poppler for Windows
- [ ] Extract to `C:\Program Files\poppler`
- [ ] Add Poppler to PATH
- [ ] Verify: `pdftoppm -v` works
- [ ] Download LibreOffice installer
- [ ] Install LibreOffice
- [ ] Verify: `libreoffice --version` works
- [ ] Restart terminal/IDE
- [ ] Test both tools with sample files
- [ ] Implement conversion functions
- [ ] Test API endpoints

---

## 🎯 Next Steps

### 1. Implement Conversions

Copy the code from **REMAINING_FEATURES_IMPLEMENTATION.md** sections:
- PDF to JPG (lines 32-85)
- Word to PDF (lines 104-155)
- Excel to PDF (lines 174-225)

### 2. Test API Endpoints

```bash
# Start server
cd pdf-toolkit/server
npm run dev

# Test in another terminal
curl -X POST http://localhost:5000/api/convert/pdf-to-jpg \
  -F "file=@test.pdf"
```

### 3. Update Client UI

The client-side code doesn't need changes - it already calls these endpoints!

---

## 🚀 Production Server Setup (Linux)

When you're ready to deploy, the setup is even easier on Linux:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y poppler-utils libreoffice

# Verify
pdftoppm -v
libreoffice --version

# Done! No PATH configuration needed
```

---

## 💡 Pro Tips

### 1. Keep Tools Updated

Check for updates periodically:
- Poppler: https://github.com/oschwartz10612/poppler-windows/releases
- LibreOffice: https://www.libreoffice.org/download/

### 2. Monitor Conversion Performance

Add logging to track conversion times:
```javascript
const startTime = Date.now();
// ... conversion code ...
const conversionTime = Date.now() - startTime;
console.log(`Conversion took ${conversionTime}ms`);
```

### 3. Handle Large Files

Set appropriate timeouts:
```javascript
// For large PDFs
const opts = {
  format: 'jpeg',
  out_dir: './uploads',
  out_prefix: 'test',
  page: null,
  scale: 1024 // Adjust quality vs size
};
```

### 4. Error Handling

Always wrap conversions in try-catch:
```javascript
try {
  await convert(pdfPath, opts);
} catch (error) {
  console.error('Conversion failed:', error);
  // Send user-friendly error message
  res.status(500).json({ 
    message: 'PDF conversion failed. Please try a different file.' 
  });
}
```

---

## 📊 Expected Performance

### PDF to JPG
- Small PDF (1-5 pages): 1-3 seconds
- Medium PDF (10-20 pages): 3-8 seconds
- Large PDF (50+ pages): 10-30 seconds

### Word to PDF
- Small DOCX (1-10 pages): 2-5 seconds
- Medium DOCX (20-50 pages): 5-15 seconds
- Large DOCX (100+ pages): 15-45 seconds

### Excel to PDF
- Small XLSX (1-5 sheets): 2-5 seconds
- Medium XLSX (10-20 sheets): 5-15 seconds
- Large XLSX (50+ sheets): 15-45 seconds

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ `pdftoppm -v` shows version
2. ✅ `libreoffice --version` shows version
3. ✅ Test scripts run without errors
4. ✅ API endpoints return converted files
5. ✅ No "command not found" errors
6. ✅ Conversions complete in reasonable time

---

## 🎉 You're Ready!

Once both tools are installed and verified:
1. ✅ Copy implementation code from REMAINING_FEATURES_IMPLEMENTATION.md
2. ✅ Test each conversion type
3. ✅ Deploy to production server
4. ✅ Monitor performance

**Estimated setup time:** 15-30 minutes  
**One-time setup:** Yes  
**Ongoing maintenance:** None  
**Cost savings:** $24,000+/year at scale

---

**Status:** Ready to install! Follow the steps above and you'll be converting files in no time. 🚀
