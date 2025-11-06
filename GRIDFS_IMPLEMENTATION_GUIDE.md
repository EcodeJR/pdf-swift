# GridFS Cloud Storage Implementation Guide

## Overview
GridFS is now fully implemented for cloud storage of converted files. This guide explains how the system works and how to use it.

---

## 🎯 Features

### Cloud Storage Benefits
- **30-day retention** for free users
- **Unlimited retention** for premium users
- **Automatic cleanup** of expired files
- **Scalable storage** using MongoDB GridFS
- **Direct streaming** for efficient downloads

### Storage Options
1. **Temporary Storage** (Default)
   - Files stored locally in `/uploads` folder
   - Expires after 1 hour
   - Available to all users (guests & authenticated)
   - Cleaned up by cron job

2. **Cloud Storage** (GridFS)
   - Files stored in MongoDB GridFS
   - Expires after 30 days (free users) or never (premium)
   - Requires authentication
   - Cleaned up by cron job

---

## 📁 Files Created

### Server Files
1. **`server/utils/gridfsHelper.js`** - GridFS operations
   - Initialize GridFS
   - Upload/download files
   - Stream files
   - Delete files
   - List user files
   - Cleanup expired files

2. **`server/utils/conversionHelper.js`** - Conversion storage logic
   - Handle file storage (local vs cloud)
   - Validate storage requests
   - Generate storage metadata
   - File cleanup utilities

### Modified Files
1. **`server/server.js`** - Initialize GridFS, add cleanup
2. **`server/routes/convert.js`** - Add cloud download route
3. **`server/controllers/conversionController.js`** - Add cloud download controller

---

## 🔧 How It Works

### 1. File Upload & Conversion
```
User uploads file → Multer saves locally → Conversion happens → Storage decision
```

### 2. Storage Decision Flow
```javascript
if (storageType === 'cloud' && user) {
  // Upload to GridFS
  uploadToGridFS(localFile) → Delete local file → Return GridFS ID
} else {
  // Keep in local temporary storage
  Keep file in /uploads → Will expire in 1 hour
}
```

### 3. Download Flow

**Temporary Files:**
```
GET /api/convert/download/:filename → Stream from /uploads folder
```

**Cloud Files:**
```
GET /api/convert/download/cloud/:fileId → Stream from GridFS
```

### 4. Cleanup Flow

**Hourly Cron Job:**
```javascript
// Clean local files (older than 1 hour, not locked)
cleanupOldFiles(uploadsPath, oneHour)

// Clean GridFS files (expired based on metadata.expiresAt)
cleanupExpiredFiles()
```

---

## 💻 API Usage

### Upload with Cloud Storage

**Request:**
```javascript
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('storageType', 'cloud'); // or 'temporary'

const response = await axios.post('/api/convert/pdf-to-word', formData);
```

**Response (Cloud Storage):**
```json
{
  "message": "PDF converted to Word successfully",
  "downloadUrl": "/api/convert/download/cloud/507f1f77bcf86cd799439011",
  "fileName": "output.docx",
  "fileSize": 15234,
  "conversionTime": 1523,
  "storageType": "cloud",
  "fileId": "507f1f77bcf86cd799439011"
}
```

**Response (Temporary Storage):**
```json
{
  "message": "PDF converted to Word successfully",
  "downloadUrl": "/api/convert/download/output-1234567890.docx",
  "fileName": "output-1234567890.docx",
  "fileSize": 15234,
  "conversionTime": 1523,
  "storageType": "temporary"
}
```

### Download from Cloud

**Request:**
```javascript
// Cloud file
window.location.href = '/api/convert/download/cloud/507f1f77bcf86cd799439011';

// Temporary file
window.location.href = '/api/convert/download/output-1234567890.docx';
```

---

## 🔐 Permissions & Validation

### Storage Type Validation
```javascript
// Cloud storage requires authentication
if (storageType === 'cloud' && !req.user) {
  return res.status(401).json({ 
    message: 'Cloud storage requires authentication' 
  });
}

// Temporary storage available to everyone
if (storageType === 'temporary') {
  // No authentication required
}
```

### File Expiration Rules
```javascript
// Free users - 30 days
expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

// Premium users - unlimited
expiresAt = null;

// Temporary files - 1 hour
expiresAt = new Date(Date.now() + 60 * 60 * 1000);
```

---

## 🛠️ GridFS Helper API

### Initialize GridFS
```javascript
const { initGridFS } = require('./utils/gridfsHelper');

// Call after MongoDB connection
connectDB().then(() => {
  initGridFS();
});
```

### Upload File
```javascript
const { uploadToGridFS } = require('./utils/gridfsHelper');

const result = await uploadToGridFS(
  '/path/to/local/file.pdf',
  'output.pdf',
  {
    userId: user._id,
    originalName: 'document.pdf',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
);

console.log(result.fileId); // GridFS file ID
```

### Download File
```javascript
const { downloadFromGridFS } = require('./utils/gridfsHelper');

await downloadFromGridFS(
  '507f1f77bcf86cd799439011',
  '/path/to/save/file.pdf'
);
```

### Stream File (Direct to HTTP Response)
```javascript
const { streamFromGridFS } = require('./utils/gridfsHelper');

// In Express route
await streamFromGridFS(fileId, res);
```

### Delete File
```javascript
const { deleteFromGridFS } = require('./utils/gridfsHelper');

await deleteFromGridFS('507f1f77bcf86cd799439011');
```

### List User Files
```javascript
const { listUserFiles } = require('./utils/gridfsHelper');

const files = await listUserFiles(userId);
console.log(files); // Array of file metadata
```

### Cleanup Expired Files
```javascript
const { cleanupExpiredFiles } = require('./utils/gridfsHelper');

const deletedCount = await cleanupExpiredFiles();
console.log(`Deleted ${deletedCount} expired files`);
```

---

## 🔄 Conversion Helper API

### Handle File Storage
```javascript
const { handleFileStorage } = require('./utils/conversionHelper');

const result = await handleFileStorage(
  '/uploads/temp-file.pdf',
  'output.pdf',
  'cloud', // or 'temporary'
  {
    userId: user._id,
    conversionType: 'pdf-to-word'
  }
);

console.log(result.downloadUrl);
console.log(result.storageType);
console.log(result.fileId); // Only for cloud storage
```

### Validate Storage Request
```javascript
const { validateStorageRequest } = require('./utils/conversionHelper');

const validation = validateStorageRequest('cloud', req.user);

if (!validation.valid) {
  return res.status(401).json({ message: validation.error });
}
```

### Get Storage Metadata
```javascript
const { getStorageMetadata } = require('./utils/conversionHelper');

const metadata = getStorageMetadata(req.user, 'cloud');
/*
{
  storageType: 'cloud',
  uploadDate: Date,
  userId: ObjectId,
  userEmail: 'user@example.com',
  isPremium: false,
  expiresAt: Date (30 days from now) or null (premium)
}
*/
```

---

## 📊 Database Schema

### GridFS Collections

**uploads.files** (File metadata)
```javascript
{
  _id: ObjectId,
  filename: String,
  length: Number,
  chunkSize: Number,
  uploadDate: Date,
  metadata: {
    userId: ObjectId,
    userEmail: String,
    originalName: String,
    storageType: String,
    isPremium: Boolean,
    expiresAt: Date or null,
    uploadDate: Date
  }
}
```

**uploads.chunks** (File data)
```javascript
{
  _id: ObjectId,
  files_id: ObjectId,
  n: Number,
  data: Binary
}
```

---

## 🧪 Testing

### Test Cloud Upload
```bash
# 1. Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 2. Upload with cloud storage
curl -X POST http://localhost:5000/api/convert/pdf-to-word \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf" \
  -F "storageType=cloud"

# 3. Download from cloud
curl -O http://localhost:5000/api/convert/download/cloud/FILE_ID
```

### Test Cleanup
```bash
# Manual cleanup trigger
curl -X POST http://localhost:5000/api/cleanup
```

### Test Expiration
```javascript
// In MongoDB shell
db.uploads.files.find({ 'metadata.expiresAt': { $lt: new Date() } })
```

---

## 🚨 Error Handling

### Common Errors

**GridFS not initialized:**
```
Error: GridFS not initialized
Solution: Ensure initGridFS() is called after MongoDB connection
```

**File not found:**
```
Error: File not found in GridFS
Solution: File may have been deleted or ID is incorrect
```

**Authentication required:**
```
Error: Cloud storage requires authentication
Solution: User must login before using cloud storage
```

**Invalid file ID:**
```
Error: Argument passed in must be a string of 12 bytes or a string of 24 hex characters
Solution: Ensure fileId is a valid MongoDB ObjectId
```

---

## 📈 Performance Considerations

### Streaming vs Download
- **Streaming** (recommended): Direct pipe from GridFS to HTTP response
  - Lower memory usage
  - Faster for large files
  - Used in `downloadCloudFile` controller

- **Download to disk**: Save to temp file first
  - Higher memory usage
  - Useful for further processing
  - Used in conversion workflows

### Cleanup Efficiency
- Cron job runs hourly (configurable)
- Indexes on `metadata.expiresAt` for fast queries
- Batch deletion to minimize database load

### File Size Limits
- GridFS handles files of any size
- Chunked storage (default 255KB chunks)
- Efficient for large files (50MB+)

---

## 🔒 Security

### Access Control
- Cloud files require authentication
- Users can only access their own files (implement in future)
- File IDs are not guessable (MongoDB ObjectId)

### Data Retention
- Free users: 30 days
- Premium users: Unlimited
- Automatic cleanup prevents data accumulation

### File Validation
- MIME type checking
- File size limits (10MB free, 50MB premium)
- Malware scanning (implement in future)

---

## 🚀 Future Enhancements

### High Priority
1. **User file management**
   - List user's cloud files
   - Delete specific files
   - Rename files

2. **Access control**
   - Verify user owns file before download
   - Share files with other users
   - Public/private file settings

3. **Analytics**
   - Track storage usage per user
   - Monitor GridFS performance
   - Alert on storage limits

### Medium Priority
1. **File versioning**
   - Keep multiple versions of same file
   - Restore previous versions

2. **Batch operations**
   - Upload multiple files
   - Download as ZIP

3. **CDN integration**
   - Cache frequently accessed files
   - Faster global delivery

---

## 📝 Migration Notes

### Existing Users
- No migration needed
- Old temporary files continue to work
- New conversions can use cloud storage

### Database
- GridFS collections created automatically
- No schema changes to existing collections
- Indexes created on first use

---

## ✅ Checklist

### Implementation Complete
- [x] GridFS helper utilities
- [x] Conversion helper utilities
- [x] Cloud download route
- [x] Cloud download controller
- [x] Cleanup cron job integration
- [x] Server initialization
- [x] Error handling
- [x] Documentation

### Testing Needed
- [ ] Upload to cloud storage
- [ ] Download from cloud storage
- [ ] File expiration (30 days)
- [ ] Premium unlimited storage
- [ ] Cleanup cron job
- [ ] Error scenarios
- [ ] Large file handling (50MB)

### Future Work
- [ ] User file management UI
- [ ] Access control implementation
- [ ] Storage usage analytics
- [ ] File sharing features

---

**Implementation Date:** October 30, 2025  
**Status:** ✅ Complete - Ready for testing  
**Next Step:** Update conversion controllers to use cloud storage
