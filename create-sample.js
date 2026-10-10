const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createSamplePDF() {
  const pdfDoc = await PDFDocument.create();
  
  // Add 3 pages
  for (let i = 1; i <= 3; i++) {
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 24;
    
    page.drawText(`Page ${i}`, {
      x: 50,
      y: 700,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`This is sample text on page ${i}`, {
      x: 50,
      y: 600,
      size: 14,
      font,
      color: rgb(0.2, 0.2, 0.8),
    });
    
    // Draw a box
    page.drawRectangle({
      x: 100,
      y: 500,
      width: 200,
      height: 100,
      borderColor: rgb(1, 0, 0),
      borderWidth: 2,
    });
    
    page.drawText(`Sample content ${i * 10}`, {
      x: 120,
      y: 530,
      size: 12,
      font,
      color: rgb(1, 0, 0),
    });
  }
  
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(__dirname, 'test-assets', 'multi-page-sample.pdf');
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`PDF created at: ${outputPath}`);
}

createSamplePDF().catch(console.error);
