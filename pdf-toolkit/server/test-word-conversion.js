const fs = require('fs');
const path = require('path');
const { Document, Paragraph, TextRun, Packer } = require('docx');
const { promisify } = require('util');
const libre = require('libreoffice-convert');

const libreConvert = promisify(libre.convert);

async function testWordToPdfConversion() {
  console.log('\n🧪 Testing Word to PDF Conversion\n');
  console.log('='.repeat(60));

  const testDir = __dirname;
  const docxPath = path.join(testDir, 'test-document-temp.docx');
  const pdfPath = path.join(testDir, 'test-document-output.pdf');

  try {
    // Step 1: Create test document
    console.log('\n📝 Step 1: Creating test Word document...');
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Test Document',
                bold: true,
                size: 48,
              })
            ]
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun('This is a test document for Word to PDF conversion.')
            ]
          }),
          new Paragraph({
            children: [
              new TextRun('If you can see this text in the PDF, conversion is working correctly!')
            ]
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Created: ' + new Date().toLocaleString(),
                italic: true,
              })
            ]
          })
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(docxPath, buffer);
    console.log(`   ✅ Created DOCX file: ${path.basename(docxPath)}`);
    console.log(`   📊 DOCX size: ${(buffer.length / 1024).toFixed(2)} KB`);

    // Step 2: Convert to PDF
    console.log('\n🔄 Step 2: Converting to PDF (using LibreOffice)...');
    console.log('   ⏳ This may take a few seconds...');
    
    const pdfBuffer = await libreConvert(buffer, '.pdf', undefined);
    console.log(`   ✅ Conversion successful!`);
    console.log(`   📊 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

    // Step 3: Save PDF
    console.log('\n💾 Step 3: Saving PDF file...');
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log(`   ✅ Saved to: ${path.basename(pdfPath)}`);

    // Step 4: Validate
    console.log('\n✅ Step 4: Validating output...');
    if (!fs.existsSync(pdfPath)) {
      throw new Error('PDF file was not created');
    }
    const stats = fs.statSync(pdfPath);
    if (stats.size === 0) {
      throw new Error('PDF file is empty');
    }
    console.log(`   ✅ PDF file is valid`);
    console.log(`   📁 Location: ${pdfPath}`);

    // Cleanup
    console.log('\n🧹 Cleaning up test files...');
    fs.unlinkSync(docxPath);
    console.log(`   ✅ Removed temporary DOCX file`);

    // Success message
    console.log('\n' + '='.repeat(60));
    console.log('\n✨ SUCCESS! LibreOffice Word to PDF conversion is working!\n');
    console.log('📋 Test Results:');
    console.log(`   • Test DOCX created: ✅`);
    console.log(`   • Conversion executed: ✅`);
    console.log(`   • PDF generated: ${path.basename(pdfPath)} (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);
    console.log(`   • File validation: ✅`);
    console.log('\n💡 You can now:');
    console.log(`   1. Open the PDF file: ${pdfPath}`);
    console.log('   2. Verify the content was converted correctly');
    console.log('   3. Start the server: npm start');
    console.log('   4. Test Word to PDF conversion through the web interface\n');

    return true;

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('\n❌ ERROR: Conversion failed\n');
    console.log('📋 Error Details:');
    console.log(`   ${error.message}\n`);

    // Cleanup on error
    try {
      if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);
    } catch (e) {}

    console.log('🔧 Troubleshooting Steps:\n');
    
    if (error.message.includes('soffice')) {
      console.log('   Issue: LibreOffice (soffice) not found\n');
      console.log('   Fix:');
      console.log('   1. Download LibreOffice: https://www.libreoffice.org/download/');
      console.log('   2. Run the installer');
      console.log('   3. Add to PATH: C:\\Program Files\\LibreOffice\\program');
      console.log('   4. Restart PowerShell\n');
    } else if (error.message.includes('ENOENT')) {
      console.log('   Issue: File not found or LibreOffice path is incorrect\n');
      console.log('   Fix:');
      console.log('   1. Run diagnostic: node utils/diagnoseLibreOffice.js');
      console.log('   2. Verify LibreOffice is installed');
      console.log('   3. Check PATH settings\n');
    } else if (error.message.includes('Module')) {
      console.log('   Issue: libreoffice-convert module is not installed\n');
      console.log('   Fix: npm install libreoffice-convert@latest\n');
    } else {
      console.log('   Issue: LibreOffice conversion error\n');
      console.log('   Fix:');
      console.log('   1. Run diagnostic: node utils/diagnoseLibreOffice.js');
      console.log('   2. Verify LibreOffice installation');
      console.log('   3. Check if LibreOffice can open files manually\n');
    }

    console.log('📞 Need Help?\n');
    console.log('   Run: node utils/diagnoseLibreOffice.js');
    console.log('   Check: LIBREOFFICE_SETUP_FIX.md\n');

    return false;
  }
}

// Run if executed directly
if (require.main === module) {
  testWordToPdfConversion()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testWordToPdfConversion };
