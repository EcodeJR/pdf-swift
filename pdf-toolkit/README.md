# PDF Toolkit - Full-Stack Web Application

A comprehensive PDF conversion and editing web application with dual storage options, freemium monetization model, and video ad integration. Built with React.js frontend and Node.js/Express backend.

## 🚀 Features

### Core PDF Tools
- **PDF to Word** - Convert PDF documents to editable DOCX files
- **PDF to Excel** - Extract tables and data from PDFs to Excel format
- **PDF to JPG** - Convert PDF pages to high-quality images
- **Word to PDF** - Convert Word documents to PDF format
- **Excel to PDF** - Convert Excel spreadsheets to PDF
- **JPG to PDF** - Convert images to PDF documents
- **Compress PDF** - Reduce PDF file size while maintaining quality
- **Merge PDF** - Combine multiple PDFs into one document
- **Split PDF** - Extract specific pages from PDF documents
- **Edit PDF** - Add text, annotations, and signatures to PDFs

### Dual Storage System
- **Guest Mode**: Files stored temporarily (1 hour) with video ads
- **Cloud Storage**: Login required, files stored for 30 days (unlimited for premium)

### User Authentication
- JWT-based authentication
- Email/password registration and login
- Password reset functionality
- Security alerts for new device logins

### Premium Features ($5/month)
- Unlimited conversions
- Larger file sizes (up to 50MB)
- No ads
- Cloud storage
- Priority processing

## 🛠 Tech Stack

### Frontend
- **React.js** - UI framework
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Styling framework
- **React Context API** - State management
- **Axios** - HTTP client
- **React Dropzone** - File upload handling
- **React Toastify** - Notifications
- **React Icons** - Icon library
- **Stripe React Elements** - Payment processing

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **pdf-lib** - PDF manipulation
- **pdf-parse** - PDF text extraction
- **docx** - Word document creation
- **xlsx** - Excel file handling
- **Sharp** - Image processing
- **Stripe** - Payment processing
- **SendGrid** - Email service
- **node-cron** - Task scheduling

## 📁 Project Structure

```
pdf-toolkit/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React Context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── App.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   ├── uploads/           # Temporary file storage
│   └── server.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Stripe account
- SendGrid account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pdf-toolkit
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**

   **Backend (.env in server folder):**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/pdf-toolkit
   JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   CLIENT_URL=http://localhost:3000
   MAX_FILE_SIZE_FREE=10485760
   MAX_FILE_SIZE_PREMIUM=52428800
   FREE_CONVERSIONS_PER_HOUR=3
   ```

   **Frontend (.env in client folder):**
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
   REACT_APP_ADSENSE_PUBLISHER_ID=ca-pub-xxxxxxxxxxxxxxxxxxxxx
   REACT_APP_ADSENSE_HEADER_SLOT=xxxxxxxxxxxxxxxxxxxxx
   REACT_APP_ADSENSE_VIDEO_SLOT=xxxxxxxxxxxxxxxxxxxxx
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend development server**
   ```bash
   cd client
   npm start
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## 🔧 Configuration

### MongoDB Setup
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address
5. Get the connection string and update MONGO_URI

### Stripe Setup
1. Create a Stripe account
2. Get API keys from the dashboard
3. Set up webhook endpoints
4. Update environment variables

### SendGrid Setup
1. Create a SendGrid account
2. Generate an API key
3. Verify sender email
4. Update environment variables

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Conversions
- `POST /api/convert/pdf-to-word` - Convert PDF to Word
- `POST /api/convert/pdf-to-excel` - Convert PDF to Excel
- `POST /api/convert/pdf-to-jpg` - Convert PDF to JPG
- `POST /api/convert/word-to-pdf` - Convert Word to PDF
- `POST /api/convert/excel-to-pdf` - Convert Excel to PDF
- `POST /api/convert/jpg-to-pdf` - Convert JPG to PDF
- `POST /api/convert/compress-pdf` - Compress PDF
- `POST /api/convert/merge-pdf` - Merge PDFs
- `POST /api/convert/split-pdf` - Split PDF
- `POST /api/convert/edit-pdf` - Edit PDF

### Payments
- `POST /api/payment/create-checkout-session` - Create Stripe checkout
- `POST /api/payment/webhook` - Stripe webhook handler
- `POST /api/payment/cancel-subscription` - Cancel subscription
- `GET /api/payment/subscription-status` - Get subscription status

## 🎯 Key Features Implementation

### Rate Limiting
- Free users: 3 conversions per hour
- Premium users: Unlimited conversions
- IP-based limiting for guest users

### File Storage
- Temporary storage: 1-hour expiry for guest users
- Cloud storage: 30-day retention for free users
- Unlimited storage for premium users

### Security
- JWT authentication
- Password hashing with bcryptjs
- File type validation
- File size limits
- CORS protection
- Helmet security headers

### Email Notifications
- Welcome emails
- Security alerts
- Password reset emails
- Subscription confirmations

## 🚀 Deployment

### Frontend (Vercel)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `build`
4. Add environment variables

### Backend (Render)
1. Connect GitHub repository
2. Set build command: `npm install`
3. Set start command: `node server.js`
4. Add environment variables

## 📈 Revenue Model

### Free Tier
- 3 conversions per hour
- 10MB file size limit
- Video ads required
- 1-hour temporary storage

### Premium Tier ($5/month)
- Unlimited conversions
- 50MB file size limit
- No ads
- Cloud storage
- Priority processing

### Ad Revenue
- Google AdSense integration
- Video ads for free users
- Banner ads on all pages

## 🔮 Future Enhancements

- Mobile app development
- OCR for scanned PDFs
- Batch processing
- Collaboration features
- API rate limiting improvements
- Advanced PDF editing tools

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support, email support@pdftoolkit.com or create an issue in the repository.

---

**Built with ❤️ by the PDF Toolkit Team**
