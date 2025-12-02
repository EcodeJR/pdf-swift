# 🚀 Quick Start Guide - Enhanced PDF Swift Server

## ✅ Prerequisites Complete
- ✅ LibreOffice installed and configured
- ✅ Redis Labs cloud connected
- ✅ All dependencies installed

## 📝 Start the Server

### Step 1: Start the Worker Process
Open a terminal and run:
```bash
cd server
node worker.js
```

**Expected output:**
```
🚀 Starting worker process...
✅ Worker connected to Socket.io server
✅ OCR workers initialized
✅ Worker initialized and ready to process jobs
👂 Listening for jobs...
```

### Step 2: Start the Main Server
Open another terminal and run:
```bash
cd server
node server.js
```

**Expected output:**
```
✅ Connected to Redis Labs
✅ Server running on port 5000
✅ Environment: development
✅ Socket.io enabled for real-time updates
✅ GridFS ready for cloud storage
✅ LibreOffice ready: LibreOffice 7.x.x
✅ OCR workers initialized
✅ Redis client ready
🚀 Enhanced features: Job Queue | OCR | Advanced Rate Limiting
```

## 🧪 Test the Enhancements

### Test 1: Basic Conversion (Existing)
```bash
curl -X POST http://localhost:5000/api/convert/pdf-to-word -F "file=@test.pdf"
```

### Test 2: Job Queue
```bash
# Submit job
curl -X POST http://localhost:5000/api/jobs/submit \
  -F "file=@large.pdf" \
  -F "conversionType=pdf-to-word"

# Check status (use jobId from response)
curl http://localhost:5000/api/jobs/YOUR_JOB_ID/status

# Download result
curl http://localhost:5000/api/jobs/YOUR_JOB_ID/result --output result.docx
```

### Test 3: OCR
```bash
curl -X POST http://localhost:5000/api/ocr/extract-text \
  -F "file=@image-with-text.jpg"
```

### Test 4: Rate Limiting
```bash
# Make 4 requests quickly - 4th should be rate limited
for i in {1..4}; do
  curl -X POST http://localhost:5000/api/convert/pdf-to-word \
    -F "file=@test.pdf"
  echo ""
done
```

## 🎯 All Features Working

✅ **Job Queue** - Large files process in background
✅ **Rate Limiting** - VPN-proof with device fingerprinting  
✅ **OCR** - Text extraction from images/PDFs
✅ **LibreOffice** - Word/Excel to PDF conversions
✅ **Real-time Updates** - Socket.io progress tracking

## 🔧 Troubleshooting

### Worker not connecting?
- Make sure Socket.io URL is correct in worker.js
- Check that main server is running first

### Redis errors?
- Verify credentials in .env match Redis Labs
- Check internet connection

### LibreOffice errors?
- Path should be: `C:\Program Files\LibreOffice\program\soffice.exe`
- Verify LibreOffice is installed

## 📊 Monitor Logs

Watch for these success indicators:
- `✅ Connected to Redis Labs`
- `✅ LibreOffice ready`
- `✅ OCR workers initialized`
- `✅ Worker connected to Socket.io server`

## 🎊 You're Ready!

The backend is now fully operational with all enhancements:
- Job queue handles files up to 500MB
- Rate limiting survives VPN switches
- OCR extracts text from scanned documents
- All conversion tools working properly

**Next:** Test with the frontend React app!
