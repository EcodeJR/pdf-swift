# PDF Toolkit - Full-Stack Web Application

A comprehensive PDF conversion and editing web application with dual storage options, freemium monetization, and Google AdSense integration.

## 🚀 Features

### Core PDF Tools
- ✅ PDF to Word (DOCX) - Extract and convert text
- ✅ PDF to Excel (XLSX) - Extract tables and data
- ✅ PDF to JPG - Convert pages to images (placeholder)
- ✅ Word to PDF - Convert DOCX to PDF (placeholder)
- ✅ Excel to PDF - Convert XLSX to PDF (placeholder)
- ✅ JPG/PNG to PDF - Convert images to PDF
- ✅ Compress PDF - Reduce file size
- ✅ Merge PDF - Combine multiple PDFs
- ✅ Split PDF - Extract specific pages
- ✅ Edit PDF - Add text and annotations (placeholder)

### User Features
- **Dual Storage System**:
  - Guest/Quick Mode: Files stored temporarily (1 hour) without login
  - Cloud Storage: Files stored for 30 days (requires login)
- **Authentication**: JWT-based with email/password
- **Rate Limiting**: 3 conversions/hour for free users
- **Premium Subscription**: $5/month via Flutterwave
  - Unlimited conversions
  - 50MB file size limit (vs 10MB free)
  - No ads
  - Unlimited cloud storage
  - Batch processing (up to 20 files)
  - Priority processing

### Monetization
- **Google AdSense**: Banner and video ads for free users
- **Flutterwave Payments**: Monthly subscriptions
- **Email Notifications**: SendGrid integration

## 📋 Tech Stack

### Frontend
- React.js
- React Router DOM v6
- Tailwind CSS
- Axios
- react-dropzone
- react-toastify
- react-icons
- Flutterwave hosted checkout

### Backend
- Node.js + Express.js
- MongoDB Atlas
- JWT Authentication
- Multer (file uploads)
- GridFS (cloud storage)
- PDF Libraries: pdf-lib, pdf-parse, pdfkit, docx, xlsx
- Image Processing: sharp
- Axios (Flutterwave API integration)
- SendGrid
- node-cron (cleanup jobs)

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- MongoDB Atlas account
- Flutterwave account
- SendGrid account (optional for emails)
- Google AdSense account (optional for ads)

### 1. Clone and Install

```bash
cd pdf-toolkit
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create `.env` file in `/server`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key_min_32_chars
FLW_PUBLIC_KEY=FLWPUBK_TEST_your_public_key
FLW_SECRET_KEY=FLWSECK_TEST_your_secret_key
FLW_ENCRYPTION_KEY=FLWSECK_TEST_your_encryption_key
FLW_WEBHOOK_HASH=your_flutterwave_webhook_hash
PREMIUM_AMOUNT=5
PREMIUM_CURRENCY=USD
SENDGRID_API_KEY=SG.your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
CLIENT_URL=http://localhost:3000
MAX_FILE_SIZE_FREE=10485760
MAX_FILE_SIZE_PREMIUM=52428800
FREE_CONVERSIONS_PER_HOUR=5
```

### 3. Frontend Setup

```bash
cd ../client
npm install
```

Create `.env` file in `/client`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FLW_PUBLIC_KEY=FLWPUBK_TEST_your_public_key
REACT_APP_ADSENSE_PUBLISHER_ID=ca-pub-your_adsense_id
REACT_APP_ADSENSE_HEADER_SLOT=your_slot_id
REACT_APP_ADSENSE_VIDEO_SLOT=your_slot_id
```

### 4. MongoDB Setup

1. Create MongoDB Atlas account at mongodb.com/cloud/atlas
2. Create a new cluster (free M0 tier)
3. Create database user
4. Whitelist IP: 0.0.0.0/0 (for development)
5. Get connection string and add to `MONGO_URI`

### 5. Flutterwave Setup

1. Create account at flutterwave.com
2. Get test/live keys from your Flutterwave dashboard
3. Set a webhook URL to: `http://localhost:5000/api/payment/webhook` (or your production API URL)
4. Copy your webhook hash/signing value to `FLW_WEBHOOK_HASH` in `.env`

### 6. SendGrid Setup (Optional)

1. Create account at sendgrid.com
2. Create API key
3. Verify sender email
4. Add API key to `.env`

### 7. Run Development Servers

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm start
```

Application will open at http://localhost:3000

## 🧪 Testing

### Test Accounts
Create a test account by registering at http://localhost:3000/register

### Test Flutterwave Payment
Use Flutterwave test mode credentials from your Flutterwave dashboard and complete checkout via the hosted payment page.

### Test Conversions
1. Upload a PDF file (max 10MB for free users)
2. Select storage type
3. Convert
4. Free users see video ad (15 second countdown)
5. Download file

## 📦 Deployment

### Frontend - Vercel

```bash
cd client
npm run build

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Add environment variables in Vercel dashboard.

### Backend - Render

1. Connect GitHub repository
2. Create new Web Service
3. Settings:
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment: Node
4. Add environment variables
5. Deploy

### MongoDB Atlas
- Already hosted
- Update `MONGO_URI` with production connection string

### Flutterwave Webhooks
1. Add production webhook endpoint: `https://your-api.com/api/payment/webhook`
2. Enable charge/subscription webhook events in Flutterwave dashboard
3. Update `FLW_WEBHOOK_HASH`

### Custom Domain (Optional)
1. Purchase domain
2. Configure DNS:
   - Frontend: CNAME to Vercel
   - Backend: CNAME to Render
3. Update `CLIENT_URL` in backend `.env`

## 📊 File Structure

```
pdf-toolkit/
├── server/
│   ├── config/          # DB connection
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, rate limiting, upload
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── utils/           # Email, helpers
│   ├── uploads/         # Temporary files
│   ├── .env             # Environment variables
│   ├── server.js        # Entry point
│   └── package.json
│
├── client/
│   ├── public/
│   │   └── index.html   # HTML template
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # Auth context
│   │   ├── pages/       # Route pages
│   │   │   └── tools/   # Conversion tools
│   │   ├── services/    # API client
│   │   ├── App.js       # Main app
│   │   ├── index.js     # Entry point
│   │   └── index.css    # Tailwind styles
│   ├── .env             # Environment variables
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

## 🔑 Key Features Implementation

### Rate Limiting
- Guest users: IP-based (3/hour)
- Registered users: User-based (3/hour, resets hourly)
- Premium users: No limits

### File Storage
- **Temporary**: Local `/uploads` folder, deleted after 1 hour
- **Cloud**: MongoDB GridFS, stored 30 days (free) or unlimited (premium)

### Ad System
- Banner ads: Header and footer for free users
- Video ads: Mandatory 15-second ad before download
- Premium users: No ads anywhere

### Cleanup Job
- Runs every hour via node-cron
- Deletes files older than 1 hour
- Deletes expired GridFS files (30+ days for free users)

## 🐛 Troubleshooting

### MongoDB Connection Error
- Check MONGO_URI format
- Verify IP whitelist
- Confirm database user credentials

### File Upload Fails
- Check file size (10MB free, 50MB premium)
- Verify file type is accepted
- Check rate limits

### Flutterwave Webhook Not Working
- Verify `FLW_WEBHOOK_HASH`
- Check endpoint URL
- Confirm your server can read raw webhook body for signature validation

### Frontend Not Loading
- Clear browser cache
- Check API_URL in .env
- Verify backend is running

## 📝 Future Enhancements

### Phase 2 Features
- [ ] OCR for scanned PDFs
- [ ] PDF password protection/removal
- [ ] Rotate PDF pages
- [ ] Add watermarks

### Phase 3 Features
- [ ] Mobile app (React Native)
- [ ] Collaboration features
- [ ] Team accounts
- [ ] API for developers

### Phase 4 Features
- [ ] AI-powered PDF analysis
- [ ] Document translation
- [ ] Form filling automation

## 💰 Revenue Model

### Free Tier
- 3 conversions/hour
- Ads displayed
- Estimated: $60-150/month from 10k users (AdSense)

### Premium Tier
- $5/month subscription
- Target: 1-2% conversion rate
- Estimated: $500-1000/month from 100-200 subscribers

### Projected Revenue (Month 6)
- Total: $560-1150/month
- Goal: $500/month by month 3-4

## 📄 License

This project is proprietary. All rights reserved.

## 👥 Support

For issues or questions:
- GitHub Issues: [Create Issue](https://github.com/yourrepo/issues)
- Email: support@pdftoolkit.com (update with your email)

## 🎉 Credits

Built with ❤️ using:
- React.js
- Node.js
- MongoDB
- Flutterwave
- SendGrid
- Tailwind CSS
- pdf-lib and other open-source libraries

---

## 🚀 Quick Start Checklist

- [ ] Install Node.js 16+
- [ ] Create MongoDB Atlas database
- [ ] Get Flutterwave API keys
- [ ] Get SendGrid API key (optional)
- [ ] Clone repository
- [ ] Install backend dependencies
- [ ] Install frontend dependencies
- [ ] Configure environment variables
- [ ] Start backend server
- [ ] Start frontend server
- [ ] Test registration and login
- [ ] Test file conversion
- [ ] Test Flutterwave payment (test mode)
- [ ] Deploy to production
- [ ] Configure custom domain
- [ ] Setup production webhooks
- [ ] Enable Google AdSense

**Estimated Setup Time:** 2-3 hours
**Deployment Time:** 30-60 minutes

---

Happy converting! 🎯
