const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function diagnoseLibreOffice() {
  console.log('\n🔍 LibreOffice Diagnostic Report\n');
  console.log('='.repeat(60));

  let issuesFound = 0;

  // Check 1: soffice in PATH
  console.log('\n1️⃣  Checking if soffice is in PATH...');
  try {
    const result = execSync('where soffice', { encoding: 'utf-8', stdio: 'pipe' });
    console.log('   ✅ soffice found in PATH:');
    console.log(`   📍 ${result.trim()}\n`);
  } catch (error) {
    issuesFound++;
    console.log('   ❌ soffice NOT found in PATH\n');
    console.log('   🔧 FIX: Add C:\\Program Files\\LibreOffice\\program to system PATH\n');
  }

  // Check 2: Common installation paths
  console.log('2️⃣  Checking common installation paths...');
  const commonPaths = [
    'C:\\Program Files\\LibreOffice',
    'C:\\Program Files (x86)\\LibreOffice',
    'C:\\LibreOffice'
  ];

  let foundPath = null;
  let pathsFound = 0;

  commonPaths.forEach(p => {
    if (fs.existsSync(p)) {
      console.log(`   ✅ Found: ${p}`);
      pathsFound++;
      if (!foundPath) foundPath = p;
    }
  });

  if (pathsFound === 0) {
    issuesFound++;
    console.log('   ❌ LibreOffice not found in common paths');
    console.log('   🔧 FIX: Install LibreOffice from https://www.libreoffice.org/\n');
  } else {
    console.log();
  }

  // Check 3: Verify soffice executable
  if (foundPath) {
    console.log('3️⃣  Verifying soffice executable...');
    const sofficeExe = path.join(foundPath, 'program', 'soffice.exe');
    if (fs.existsSync(sofficeExe)) {
      console.log(`   ✅ soffice.exe found: ${sofficeExe}\n`);
    } else {
      issuesFound++;
      console.log(`   ❌ soffice.exe not found at: ${sofficeExe}\n`);
    }
  }

  // Check 4: Node modules
  console.log('4️⃣  Checking Node modules...');
  try {
    require('libreoffice-convert');
    console.log('   ✅ libreoffice-convert module is installed\n');
  } catch (error) {
    issuesFound++;
    console.log('   ❌ libreoffice-convert module not found');
    console.log('   🔧 FIX: npm install libreoffice-convert\n');
  }

  // Check 5: Environment PATH variable
  console.log('5️⃣  Checking NODE process PATH...');
  const hasLibreOfficeInPath = process.env.PATH.split(';').some(p => 
    p.toLowerCase().includes('libreoffice')
  );
  if (hasLibreOfficeInPath) {
    console.log('   ✅ LibreOffice is in NODE process PATH\n');
  } else {
    console.log('   ⚠️  LibreOffice may not be in NODE process PATH');
    console.log('   💡 Note: This might be OK if you\'re running PowerShell as admin\n');
  }

  // Summary
  console.log('='.repeat(60));
  if (issuesFound === 0) {
    console.log('\n✨ All checks passed! LibreOffice setup looks good.');
    console.log('   You can now test conversion with: node test-word-conversion.js\n');
    return true;
  } else {
    console.log(`\n⚠️  Found ${issuesFound} issue(s) that need fixing.\n`);
    console.log('📋 Quick Fix Steps:');
    console.log('   1. Download LibreOffice: https://www.libreoffice.org/download/');
    console.log('   2. Run installer with default settings');
    console.log('   3. Add PATH: C:\\Program Files\\LibreOffice\\program');
    console.log('   4. Restart PowerShell (run as Administrator)');
    console.log('   5. Run: npm install libreoffice-convert@latest');
    console.log('   6. Run this script again to verify\n');
    return false;
  }
}

// Run if executed directly
if (require.main === module) {
  const success = diagnoseLibreOffice();
  process.exit(success ? 0 : 1);
}

module.exports = { diagnoseLibreOffice };
