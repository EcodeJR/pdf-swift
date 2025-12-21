const muhammara = require('muhammara');
const fs = require('fs');
const path = require('path');

const run = () => {
    const inputPath = path.join(__dirname, 'repro-input.pdf');
    const encryptedPath = path.join(__dirname, 'repro-encrypted.pdf');
    const unlockedPath = path.join(__dirname, 'repro-unlocked.pdf');
    const unlockedPath2 = path.join(__dirname, 'repro-unlocked-2.pdf');

    // 1. Create dummy PDF
    try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(encryptedPath)) fs.unlinkSync(encryptedPath);
        if (fs.existsSync(unlockedPath)) fs.unlinkSync(unlockedPath);
        if (fs.existsSync(unlockedPath2)) fs.unlinkSync(unlockedPath2);

        const writer = muhammara.createWriter(inputPath);
        const page = writer.createPage(0, 0, 595, 842);
        writer.writePage(page);
        writer.end();
        console.log('Created input PDF');
    } catch (e) {
        console.error('Setup failed', e);
        return;
    }

    // 2. Encrypt it with restrictive permissions
    try {
        muhammara.recrypt(inputPath, encryptedPath, {
            userPassword: 'password123',
            ownerPassword: 'owner123', // Separate owner password
            userProtectionFlag: 0 // No permissions
        });
        console.log('Encrypted PDF');
    } catch (e) {
        console.error('Encryption failed', e);
        return;
    }

    // 3. Try to decrypt with CORRECT password
    try {
        console.log('Attempting decryption with CORRECT password...');
        const writer = muhammara.createWriter(unlockedPath);
        writer.appendPDFPagesFromPDF(encryptedPath, { password: 'password123' });
        writer.end();
        console.log('SUCCESS: Decrypted with correct password');
    } catch (e) {
        console.error('FAIL: Decryption with correct password failed:', e.message);
    }

    // 4. Try to decrypt with INCORRECT password
    try {
        console.log('Attempting decryption with INCORRECT password...');
        const writer = muhammara.createWriter(unlockedPath2);
        writer.appendPDFPagesFromPDF(encryptedPath, { password: 'wrong' });
        writer.end();
        console.log('FAIL: Decrypted with incorrect password (should have failed)');
    } catch (e) {
        console.log('SUCCESS: Decryption with incorrect password correctly failed:', e.message);
    }
};

run();
