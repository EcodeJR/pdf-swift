const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { PDFDocument: PDFLib } = require('pdf-lib');
const pdfParse = require('pdf-parse');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const XLSX = require('xlsx');
const sharp = require('sharp');
const Conversion = require('../models/Conversion');

// Helper function to track conversion
const trackConversion = async (req, conversionType, originalFileName, outputFileName, fileSize, conversionTime, storageType, gridFsFileId = null) => {
  try {
    const conversion = new Conversion({
      userId: req.user?._id || null,
      ipAddress: req.ip || req.connection.remoteAddress,
      conversionType,
      originalFileName,
      outputFileName,
      fileSize,
      conversionTime,
      storageType,
      gridFsFileId,
      expiresAt: storageType === 'temporary' ? new Date(Date.now() + 60 * 60 * 1000) : null // 1 hour for temporary
    });
    
    await conversion.save();
  } catch (error) {
    console.error('Error tracking conversion:', error);
  }
};

// Helper function to send file response
const sendFileResponse = (res, filePath, fileName, mimeType) => {
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).json({ error: 'Error sending file' });
    }
    // Clean up temporary file
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
    });
  });
};

// PDF to Word conversion
const pdfToWord = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputFileName = req.file.originalname.replace('.pdf', '.docx');
    const outputPath = path.join('uploads', `converted_${Date.now()}_${outputFileName}`);

    // Read PDF
    const dataBuffer = fs.readFileSync(inputPath);
    const data = await pdfParse(dataBuffer);
    
    // Extract text and create Word document
    const text = data.text;
    const lines = text.split('\n').filter(line => line.trim());
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: lines.map(line => 
          new Paragraph({
            children: [new TextRun(line)]
          })
        )
      }]
    });

    // Generate Word document
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);

    const conversionTime = Date.now() - startTime;
    const fileSize = buffer.length;

    // Track conversion
    await trackConversion(req, 'pdf-to-word', req.file.originalname, outputFileName, fileSize, conversionTime, 'temporary');

    // Send file
    sendFileResponse(res, outputPath, outputFileName, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

  } catch (error) {
    console.error('PDF to Word error:', error);
    res.status(500).json({ error: 'Error converting PDF to Word' });
  }
};

// PDF to Excel conversion
const pdfToExcel = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputFileName = req.file.originalname.replace('.pdf', '.xlsx');
    const outputPath = path.join('uploads', `converted_${Date.now()}_${outputFileName}`);

    // Read PDF
    const dataBuffer = fs.readFileSync(inputPath);
    const data = await pdfParse(dataBuffer);
    
    // Extract text and try to parse as table data
    const text = data.text;
    const lines = text.split('\n').filter(line => line.trim());
    
    // Simple table extraction (this is basic - could be improved)
    const tableData = lines.map(line => {
      // Split by common delimiters
      const cells = line.split(/\s{2,}|\t|,|\|/).filter(cell => cell.trim());
      return cells;
    });

    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(tableData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Write to file
    XLSX.writeFile(wb, outputPath);

    const conversionTime = Date.now() - startTime;
    const stats = fs.statSync(outputPath);
    const fileSize = stats.size;

    // Track conversion
    await trackConversion(req, 'pdf-to-excel', req.file.originalname, outputFileName, fileSize, conversionTime, 'temporary');

    // Send file
    sendFileResponse(res, outputPath, outputFileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  } catch (error) {
    console.error('PDF to Excel error:', error);
    res.status(500).json({ error: 'Error converting PDF to Excel' });
  }
};

// PDF to JPG conversion (first page only for now)
const pdfToJpg = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputFileName = req.file.originalname.replace('.pdf', '.jpg');
    const outputPath = path.join('uploads', `converted_${Date.now()}_${outputFileName}`);

    // For now, return a placeholder message since PDF to image conversion
    // requires additional setup with pdf-poppler or canvas-based rendering
    res.json({ 
      message: 'PDF to image conversion requires additional setup. This feature will be available soon.',
      note: 'For now, you can use online tools or install pdf-poppler for this functionality'
    });

  } catch (error) {
    console.error('PDF to JPG error:', error);
    res.status(500).json({ error: 'Error converting PDF to JPG' });
  }
};

// Compress PDF
const compressPdf = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputFileName = `compressed_${req.file.originalname}`;
    const outputPath = path.join('uploads', `converted_${Date.now()}_${outputFileName}`);

    // Read PDF
    const pdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFLib.load(pdfBytes);
    
    // Save with compression options
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });

    fs.writeFileSync(outputPath, compressedBytes);

    const conversionTime = Date.now() - startTime;
    const originalSize = fs.statSync(inputPath).size;
    const compressedSize = compressedBytes.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

    // Track conversion
    await trackConversion(req, 'compress-pdf', req.file.originalname, outputFileName, compressedSize, conversionTime, 'temporary');

    // Send file with compression stats
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
    res.setHeader('X-Compression-Ratio', compressionRatio);
    res.setHeader('X-Original-Size', originalSize);
    res.setHeader('X-Compressed-Size', compressedSize);
    
    res.sendFile(outputPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ error: 'Error sending file' });
      }
      // Clean up files
      fs.unlink(inputPath, () => {});
      fs.unlink(outputPath, () => {});
    });

  } catch (error) {
    console.error('Compress PDF error:', error);
    res.status(500).json({ error: 'Error compressing PDF' });
  }
};

// Merge PDFs
const mergePdf = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (req.files.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 files allowed for merging' });
    }

    const outputFileName = `merged_${Date.now()}.pdf`;
    const outputPath = path.join('uploads', outputFileName);

    // Create new PDF document
    const mergedPdf = await PDFLib.create();

    // Process each uploaded PDF
    for (const file of req.files) {
      try {
        const pdfBytes = fs.readFileSync(file.path);
        const pdf = await PDFLib.load(pdfBytes);
        const pageIndices = pdf.getPageIndices();
        
        // Copy all pages from this PDF
        const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
        copiedPages.forEach(page => mergedPdf.addPage(page));
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        // Continue with other files
      }
    }

    // Save merged PDF
    const mergedBytes = await mergedPdf.save();
    fs.writeFileSync(outputPath, mergedBytes);

    const conversionTime = Date.now() - startTime;
    const fileSize = mergedBytes.length;

    // Track conversion
    await trackConversion(req, 'merge-pdf', `${req.files.length} files`, outputFileName, fileSize, conversionTime, 'temporary');

    // Clean up input files
    req.files.forEach(file => {
      fs.unlink(file.path, () => {});
    });

    // Send file
    sendFileResponse(res, outputPath, outputFileName, 'application/pdf');

  } catch (error) {
    console.error('Merge PDF error:', error);
    res.status(500).json({ error: 'Error merging PDFs' });
  }
};

// Split PDF
const splitPdf = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { pageRange } = req.body;
    if (!pageRange) {
      return res.status(400).json({ error: 'Page range is required (e.g., "1-3" or "1,3,5")' });
    }

    const inputPath = req.file.path;
    const outputFileName = `split_${req.file.originalname}`;
    const outputPath = path.join('uploads', `converted_${Date.now()}_${outputFileName}`);

    // Parse page range
    let pageNumbers = [];
    if (pageRange.includes('-')) {
      // Range format: "1-3"
      const [start, end] = pageRange.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i - 1); // Convert to 0-based index
      }
    } else if (pageRange.includes(',')) {
      // Comma-separated: "1,3,5"
      pageNumbers = pageRange.split(',').map(num => parseInt(num.trim()) - 1);
    } else {
      // Single page
      pageNumbers = [parseInt(pageRange) - 1];
    }

    // Read PDF
    const pdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFLib.load(pdfBytes);
    
    // Create new PDF with selected pages
    const splitPdf = await PDFLib.create();
    const copiedPages = await splitPdf.copyPages(pdfDoc, pageNumbers);
    copiedPages.forEach(page => splitPdf.addPage(page));

    // Save split PDF
    const splitBytes = await splitPdf.save();
    fs.writeFileSync(outputPath, splitBytes);

    const conversionTime = Date.now() - startTime;
    const fileSize = splitBytes.length;

    // Track conversion
    await trackConversion(req, 'split-pdf', req.file.originalname, outputFileName, fileSize, conversionTime, 'temporary');

    // Send file
    sendFileResponse(res, outputPath, outputFileName, 'application/pdf');

  } catch (error) {
    console.error('Split PDF error:', error);
    res.status(500).json({ error: 'Error splitting PDF' });
  }
};

// Placeholder functions for other conversions
const wordToPdf = async (req, res) => {
  res.json({ message: 'Word to PDF conversion coming soon!' });
};

const excelToPdf = async (req, res) => {
  res.json({ message: 'Excel to PDF conversion coming soon!' });
};

const jpgToPdf = async (req, res) => {
  res.json({ message: 'JPG to PDF conversion coming soon!' });
};

const editPdf = async (req, res) => {
  res.json({ message: 'PDF editing coming soon!' });
};

module.exports = {
  pdfToWord,
  pdfToExcel,
  pdfToJpg,
  wordToPdf,
  excelToPdf,
  jpgToPdf,
  compressPdf,
  mergePdf,
  splitPdf,
  editPdf
};
