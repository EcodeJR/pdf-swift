const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const runTest = async () => {
    const doc = await PDFDocument.create();
    doc.addPage();

    // Encrypt with numeric permissions (e.g., 4 for Print)
    doc.encrypt({
        userPassword: 'password',
        ownerPassword: 'password',
        permissions: 4 // Print only
    });

    const pdfBytes = await doc.save();
    const outputPath = path.join(__dirname, 'test-pdflib-encrypt.pdf');
    fs.writeFileSync(outputPath, pdfBytes);
    console.log('Encrypted PDF saved.');

    // Verify
    try {
        await PDFDocument.load(pdfBytes, { password: 'password' });
        console.log('SUCCESS: Loaded with password.');
    } catch (e) {
        console.error('FAIL: Could not load with password:', e.message);
    }

    // Cleanup
    try { fs.unlinkSync(outputPath); } catch (e) { }
};

runTest();
