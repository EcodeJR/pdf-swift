const muhammara = require('muhammara');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const runDebug = async () => {
    const inputPath = path.join(__dirname, 'debug-input.pdf');
    const outputPath = path.join(__dirname, 'debug-output.pdf');

    // Create a dummy PDF
    const doc = await PDFDocument.create();
    doc.addPage();
    const pdfBytes = await doc.save();
    fs.writeFileSync(inputPath, pdfBytes);

    console.log('Input PDF created.');

    // Try to encrypt with muhammara
    try {
        console.log('Encrypting...');
        muhammara.recrypt(inputPath, outputPath, {
            userPassword: 'password123',
            ownerPassword: 'password123',
            userProtectionFlag: 4,
            version: 2 // Try RC4 128-bit
        });
        console.log('Encryption finished.');
    } catch (e) {
        console.error('Encryption error:', e);
    }

    // Verify
    try {
        const protectedBytes = fs.readFileSync(outputPath);
        console.log('Output size:', protectedBytes.length);

        try {
            await PDFDocument.load(protectedBytes);
            console.error('FAIL: PDF loaded WITHOUT password!');
        } catch (e) {
            console.log('SUCCESS: PDF failed to load without password.');
        }

        try {
            await PDFDocument.load(protectedBytes, { password: 'password123' });
            console.log('SUCCESS: PDF loaded WITH password.');
        } catch (e) {
            console.error('FAIL: PDF failed to load WITH password:', e.message);
        }

    } catch (e) {
        console.error('Verification error:', e);
    }

    // Cleanup
    try {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
    } catch (e) { }
};

runDebug();
