const muhammara = require('muhammara');
const fs = require('fs');
const path = require('path');

const run = () => {
    const inputPath = path.join(__dirname, 'debug-unlock-input.pdf');
    const encryptedPath = path.join(__dirname, 'debug-unlock-encrypted.pdf');
    const unlockedPath = path.join(__dirname, 'debug-unlock-decrypted.pdf');

    // 1. Create dummy PDF
    const writer = muhammara.createWriter(inputPath);
    const page = writer.createPage(0, 0, 595, 842);
    writer.writePage(page);
    writer.end();

    console.log('Created input PDF');

    // 2. Encrypt it
    muhammara.recrypt(inputPath, encryptedPath, {
        userPassword: 'password123',
        ownerPassword: 'password123',
        userProtectionFlag: 4
    });
    console.log('Encrypted PDF');

    // 3. Try to decrypt by copying pages
    try {
        console.log('Attempting decryption...');
        // Create a reader with password
        // Note: muhammara.createReader second arg can be read options including password
        // But for file path input, it might tricky? 
        // Docs say: createReader(stream) or createReader(path, {password: ...}) ?
        // Actually usually it is createReader(path, {password: '...'})

        const writer2 = muhammara.createWriter(unlockedPath);

        // We need to pass the reader to appendPDFPagesFromPDF? 
        // Or can we pass the path and options?
        // writer.appendPDFPagesFromPDF(pdfPath, {password: '...'}) is supported in some versions?

        // Let's try passing path and options object.
        writer2.appendPDFPagesFromPDF(encryptedPath, { password: 'password123' });

        writer2.end();
        console.log('Decrypted PDF successfully?');

        // Verify we can read verified path
        try {
            const reader = muhammara.createReader(unlockedPath);
            if (reader.isEncrypted()) {
                console.log('FAIL: Result is still encrypted');
            } else {
                console.log('SUCCESS: Result is NOT encrypted');
            }
        } catch (e) {
            console.error('FAIL: Could not open result', e);
        }

    } catch (e) {
        console.error('Decryption failed:', e);
    }

    // Cleanup
    // fs.unlinkSync(inputPath);
    // fs.unlinkSync(encryptedPath);
    // fs.unlinkSync(unlockedPath);
};

run();
