# LibreOffice Setup & Word/Excel to PDF Conversion Fix

## 🔴 Issue Summary

```
Word to PDF error: Error: Error calling soffice: Entity: line 1: parser error : Document is empty
Could not find platform independent libraries <prefix>
```

**Root Causes:**
1. LibreOffice is NOT installed on the system
2. LibreOffice path is not properly configured
3. `soffice` executable is not in system PATH
4. Node package `libreoffice-convert` cannot find LibreOffice

---

## ✅ Solution: Complete Installation & Setup

### Step 1: Install LibreOffice

#### Windows (PowerShell - Run as Administrator)

**Option A: Using Chocolatey (Easiest)**
```powershell
# If you have Chocolatey installed
choco install libreoffice -y
```

**Option B: Manual Installation**
1. Download LibreOffice from: https://www.libreoffice.org/download/
2. Choose version: **LibreOffice 7.x or later** (Windows)
3. Run the installer with default settings
4. **Important:** Select "Typical Installation" which includes Writer and Calc

**Default Installation Path:**
```
C:\Program Files\LibreOffice
```

### Step 2: Verify Installation

```powershell
# Check if soffice is accessible
where soffice
# or
Get-Command soffice
```

**Expected output:** Path to soffice.exe like:
```
C:\Program Files\LibreOffice\program\soffice.exe
```

### Step 3: Add LibreOffice to System PATH (If Needed)

If `soffice` is not found, add to PATH:

**Windows PowerShell (Admin):**
```powershell
# Temporarily (current session only)
$env:Path += ";C:\Program Files\LibreOffice\program"

# Permanently (System Environment Variable)
# 1. Open: Settings > System > About > Advanced system settings
# 2. Click "Environment Variables"
# 3. Under "System variables", click "Path" > Edit
# 4. Click "New" and add: C:\Program Files\LibreOffice\program
# 5. Click OK and restart PowerShell/VS Code

# Verify it worked
where soffice
```

### Step 4: Restart Services

```powershell
# Kill any lingering Node processes
taskkill /F /IM node.exe

# Restart your server
cd c:\Users\hp\Desktop\startups\pdf-swift\pdf-toolkit\server
npm start
```

---

## 🔧 Alternative Fix: Update LibreOffice Package

If LibreOffice is installed but still not found, update the Node package:

```powershell
cd c:\Users\hp\Desktop\startups\pdf-swift\pdf-toolkit\server

# Remove old package
npm uninstall libreoffice-convert

# Install latest version
npm install libreoffice-convert@latest
```

---

## 📝 Backend Error Handling Update

Update `conversionController.js` to provide better error messages:

```javascript
exports.wordToPdf = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file
    const docxBuffer = await fs.readFile(req.file.path);
    if (docxBuffer.length === 0) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ 
        message: 'Error: Uploaded file is empty. Please select a valid Word document.' 
      });
    }

    // Convert to PDF using LibreOffice
    let pdfBuffer;
    try {
      pdfBuffer = await libreConvert(docxBuffer, '.pdf', undefined);
    } catch (error) {
      console.error('LibreOffice conversion error:', error);
      
      // Check if error is due to LibreOffice not found
      if (error.message.includes('soffice') || error.message.includes('ENOENT')) {
        await fs.unlink(req.file.path);
        return res.status(503).json({ 
          message: 'LibreOffice service is unavailable. Please contact support.' 
        });
      }
      
      throw error;
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ 
        message: 'Conversion resulted in empty file. Please check your document.' 
      });
    }

    const outputFileName = req.file.filename.replace(/\.(docx|doc)$/i, '.pdf');
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
    
    // Cleanup on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({ 
      message: 'Error converting Word to PDF. Ensure: (1) File is a valid .docx document, (2) LibreOffice is installed, (3) File is not empty.', 
      error: error.message 
    });
  }
};
```

Also update `excelToPdf`:

```javascript
exports.excelToPdf = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file
    const xlsxBuffer = await fs.readFile(req.file.path);
    if (xlsxBuffer.length === 0) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ 
        message: 'Error: Uploaded file is empty. Please select a valid Excel spreadsheet.' 
      });
    }

    // Convert to PDF using LibreOffice
    let pdfBuffer;
    try {
      pdfBuffer = await libreConvert(xlsxBuffer, '.pdf', undefined);
    } catch (error) {
      console.error('LibreOffice conversion error:', error);
      
      if (error.message.includes('soffice') || error.message.includes('ENOENT')) {
        await fs.unlink(req.file.path);
        return res.status(503).json({ 
          message: 'LibreOffice service is unavailable. Please contact support.' 
        });
      }
      
      throw error;
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ 
        message: 'Conversion resulted in empty file. Please check your spreadsheet.' 
      });
    }

    const outputFileName = req.file.filename.replace(/\.(xlsx|xls)$/i, '.pdf');
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
    
    // Cleanup on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({ 
      message: 'Error converting Excel to PDF. Ensure: (1) File is a valid .xlsx spreadsheet, (2) LibreOffice is installed, (3) File is not empty.', 
      error: error.message 
    });
  }
};
```

---

## 🎯 Quick Diagnostic Script

Create a file: `server/utils/diagnoseLibreOffice.js`

```javascript
const { execSync } = require('child_process');
const path = require('path');

function diagnoseLibreOffice() {
  console.log('🔍 LibreOffice Diagnostic Report\n');

  // Check 1: soffice in PATH
  try {
    const result = execSync('where soffice', { encoding: 'utf-8' });
    console.log('✅ soffice found in PATH:');
    console.log(`   ${result.trim()}\n`);
  } catch (error) {
    console.log('❌ soffice NOT found in PATH');
    console.log('   Fix: Add C:\\Program Files\\LibreOffice\\program to PATH\n');
  }

  // Check 2: Common installation paths
  const fs = require('fs');
  const commonPaths = [
    'C:\\Program Files\\LibreOffice',
    'C:\\Program Files (x86)\\LibreOffice',
    'C:\\LibreOffice'
  ];

  console.log('📍 Checking common installation paths:');
  commonPaths.forEach(p => {
    if (fs.existsSync(p)) {
      console.log(`   ✅ Found: ${p}`);
    } else {
      console.log(`   ❌ Not found: ${p}`);
    }
  });
  console.log();

  // Check 3: Environment PATH
  console.log('🌍 Current PATH:');
  console.log(`   ${process.env.PATH.split(';').find(p => p.includes('LibreOffice')) || 'LibreOffice not in PATH'}\n`);

  // Check 4: Node modules
  try {
    const libre = require('libreoffice-convert');
    console.log('✅ libreoffice-convert module loaded successfully\n');
  } catch (error) {
    console.log('❌ libreoffice-convert module not found\n');
    console.log('   Fix: npm install libreoffice-convert\n');
  }

  console.log('📋 Steps to fix:');
  console.log('   1. Install LibreOffice from https://www.libreoffice.org/');
  console.log('   2. Add C:\\Program Files\\LibreOffice\\program to PATH');
  console.log('   3. Restart node server');
  console.log('   4. Run: node server/utils/diagnoseLibreOffice.js\n');
}

// Run if executed directly
if (require.main === module) {
  diagnoseLibreOffice();
}

module.exports = { diagnoseLibreOffice };
```

**Run it:**
```powershell
cd c:\Users\hp\Desktop\startups\pdf-swift\pdf-toolkit\server
node utils/diagnoseLibreOffice.js
```

---

## 🧪 Test After Installation

### Test 1: Create Test Document

Create `server/test-word-conversion.js`:

```javascript
const fs = require('fs');
const path = require('path');
const { Document, Paragraph, TextRun, Packer } = require('docx');
const { promisify } = require('util');
const libre = require('libreoffice-convert');
const libreConvert = promisify(libre.convert);

async function testConversion() {
  try {
    console.log('📝 Creating test Word document...');
    
    // Create a simple DOCX file
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: 'Test Document',
            heading: 'Heading1'
          }),
          new Paragraph({
            text: 'This is a test document for Word to PDF conversion.',
          }),
          new Paragraph({
            text: 'If you can see this in the PDF, conversion is working!'
          })
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const docxPath = path.join(__dirname, 'test-document.docx');
    fs.writeFileSync(docxPath, buffer);
    console.log(`✅ Created: ${docxPath}`);

    console.log('\n🔄 Converting to PDF...');
    const pdfBuffer = await libreConvert(buffer, '.pdf', undefined);
    
    const pdfPath = path.join(__dirname, 'test-document.pdf');
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log(`✅ Created: ${pdfPath}`);
    console.log(`📊 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

    // Cleanup
    fs.unlinkSync(docxPath);
    
    console.log('\n✨ SUCCESS! LibreOffice conversion is working!');
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Is LibreOffice installed? https://www.libreoffice.org/download/');
    console.log('   2. Is soffice in PATH? Run: where soffice');
    console.log('   3. Did you restart PowerShell after adding to PATH?');
    process.exit(1);
  }
}

testConversion();
```

**Run it:**
```powershell
cd c:\Users\hp\Desktop\startups\pdf-swift\pdf-toolkit\server
node test-word-conversion.js
```

---

## 📊 Troubleshooting Checklist

| Issue | Solution |
|-------|----------|
| `soffice not found` | Add `C:\Program Files\LibreOffice\program` to PATH |
| `Document is empty` | File is corrupted or 0 bytes - check upload handling |
| `parser error` | File is not a valid .docx - validate format |
| `Module not found` | Run `npm install libreoffice-convert` |
| Still failing after install | Restart Node server and clear npm cache: `npm cache clean --force` |

---

## 🚀 Complete Setup Commands (One Shot)

```powershell
# 1. Install LibreOffice using Chocolatey (if available)
choco install libreoffice -y

# 2. Add to PATH permanently (requires admin and restart)
# Manual: Settings > System > Advanced system settings > Environment Variables

# 3. Verify installation
where soffice

# 4. Go to server directory
cd c:\Users\hp\Desktop\startups\pdf-swift\pdf-toolkit\server

# 5. Clear cache and reinstall packages
npm cache clean --force
npm install

# 6. Run diagnostic
node utils/diagnoseLibreOffice.js

# 7. Test conversion
node test-word-conversion.js

# 8. Start server
npm start
```

---

## 📞 If Problem Persists

1. **Check LibreOffice version:**
   ```powershell
   soffice --version
   ```

2. **Check Node version compatibility:**
   ```powershell
   node --version
   npm --version
   ```

3. **View LibreOffice logs:**
   ```powershell
   # LibreOffice may create logs in:
   $env:TEMP\lu*
   # or
   Get-ChildItem $env:USERPROFILE\AppData\Roaming\LibreOffice\4\user\crash
   ```

4. **Try alternative: Use Online Conversion API**
   If local LibreOffice is problematic, consider using a cloud API like CloudConvert or PDF.co as fallback

---

## 📌 Summary

**The error occurs because:**
- LibreOffice is not installed on your Windows machine, OR
- LibreOffice is installed but not in system PATH, OR
- The `soffice` executable cannot be found by Node.js

**To fix:**
1. Install LibreOffice from https://www.libreoffice.org/
2. Add `C:\Program Files\LibreOffice\program` to your system PATH
3. Restart your development environment
4. Test with the provided diagnostic script

**Once fixed:**
- Word to PDF conversion will work
- Excel to PDF conversion will work  
- All document conversions using LibreOffice will function properly
