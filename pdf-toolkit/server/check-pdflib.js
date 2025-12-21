const pdfLib = require('pdf-lib');
console.log('Has Permissions:', !!pdfLib.Permissions);
if (pdfLib.Permissions) console.log('Permissions keys:', Object.keys(pdfLib.Permissions));
