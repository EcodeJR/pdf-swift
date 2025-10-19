# Deployment Guide - PDF Toolkit

This guide walks you through deploying the PDF Toolkit application to production.

## Pre-Deployment Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] Stripe account setup with payment methods
- [ ] SendGrid account with verified sender email
- [ ] Domain name registered (optional but recommended)
- [ ] Google AdSense account approved (for ads)
- [ ] GitHub repository created for version control

## Step 1: Prepare MongoDB Atlas

1. **Create Production Database**
   ```
   - Go to mongodb.com/cloud/atlas
   - Click "Create New Cluster"
   - Choose free M0 tier or paid tier for better performance
   - Select region closest to your users
   - Click "Create Cluster"
   ```

2. **Configure Database Access**
   ```
   - Click "Database Access" in left sidebar
   - Click "Add New Database User"
   - Username: pdftools_admin
   - Password: Generate secure password (save it!)
   - Database User Privileges: Read and write to any database
   - Click "Add User"
   ```

3. **Configure Network Access**
   ```
   - Click "Network Access" in left sidebar
   - Click "Add IP Address"
   - For Render: Add 0.0.0.0/0 (allow from anywhere)
   - Or add specific Render IPs for security
   - Click "Confirm"
   ```

4. **Get Connection String**
   ```
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string:
     mongodb+srv://pdftools_admin:<password>@cluster0.xxxxx.mongodb.net/pdf-toolkit?retryWrites=true&w=majority
   - Replace <password> with your database password
   ```

## Step 2: Deploy Backend to Render

1. **Push Code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/pdf-toolkit.git
   git push -u origin main
   ```

2. **Create Render Account**
   - Go to render.com
   - Sign up with GitHub
   - Authorize Render to access your repositories

3. **Create New Web Service**
   ```
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Name: pdf-toolkit-api
   - Region: Choose closest to your users
   - Branch: main
   - Root Directory: server
   - Environment: Node
   - Build Command: npm install
   - Start Command: node server.js
   - Instance Type: Free (or Starter $7/mo for better performance)
   ```

4. **Add Environment Variables**
   ```
   PORT=5000
   NODE_ENV=production
   MONGO_URI=<your_mongodb_connection_string>
   JWT_SECRET=<generate_random_32_char_string>
   STRIPE_SECRET_KEY=<your_stripe_secret_key>
   STRIPE_WEBHOOK_SECRET=<will_add_after_webhook_setup>
   SENDGRID_API_KEY=<your_sendgrid_api_key>
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   CLIENT_URL=https://your-frontend-url.vercel.app
   MAX_FILE_SIZE_FREE=10485760
   MAX_FILE_SIZE_PREMIUM=52428800
   FREE_CONVERSIONS_PER_HOUR=3
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Note your backend URL: https://pdf-toolkit-api.onrender.com

## Step 3: Deploy Frontend to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Build Frontend**
   ```bash
   cd client
   npm run build
   ```

3. **Deploy to Vercel**
   ```bash
   vercel
   ```
   Follow prompts:
   - Setup and deploy: Yes
   - Which scope: Your account
   - Link to existing project: No
   - Project name: pdf-toolkit
   - Directory: ./ (client folder)
   - Override settings: No

4. **Add Environment Variables in Vercel**
   ```bash
   vercel env add REACT_APP_API_URL
   # Enter: https://pdf-toolkit-api.onrender.com/api

   vercel env add REACT_APP_STRIPE_PUBLIC_KEY
   # Enter: pk_live_your_key (or pk_test for testing)

   vercel env add REACT_APP_ADSENSE_PUBLISHER_ID
   # Enter: ca-pub-your_id

   vercel env add REACT_APP_ADSENSE_HEADER_SLOT
   # Enter: your_slot_id

   vercel env add REACT_APP_ADSENSE_VIDEO_SLOT
   # Enter: your_slot_id
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

6. **Note Your URL**
   - Frontend URL: https://pdf-toolkit.vercel.app

## Step 4: Configure Stripe Webhooks

1. **Go to Stripe Dashboard**
   - Navigate to Developers → Webhooks
   - Click "Add endpoint"

2. **Configure Webhook**
   ```
   Endpoint URL: https://pdf-toolkit-api.onrender.com/api/payment/webhook
   
   Events to listen for:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   ```

3. **Get Signing Secret**
   - Click on the webhook you just created
   - Copy "Signing secret" (starts with whsec_)
   - Add to Render environment variables as STRIPE_WEBHOOK_SECRET

4. **Update Backend**
   - Go to Render dashboard
   - Click your web service
   - Environment → Add environment variable
   - Key: STRIPE_WEBHOOK_SECRET
   - Value: whsec_your_signing_secret
   - Save and redeploy

## Step 5: Update Frontend with Backend URL

1. **Update CLIENT_URL in Render**
   ```
   - Go to Render dashboard
   - Click your web service
   - Environment → Edit CLIENT_URL
   - Value: https://pdf-toolkit.vercel.app
   - Save and redeploy
   ```

2. **Enable CORS**
   - Backend automatically configured to allow CLIENT_URL origin

## Step 6: Test Production Deployment

1. **Test Registration**
   - Visit https://pdf-toolkit.vercel.app/register
   - Create a new account
   - Verify email sent (if SendGrid configured)

2. **Test Conversion**
   - Login
   - Upload a small PDF
   - Convert to Word
   - Verify rate limiting works (3 conversions/hour)

3. **Test Payment**
   - Click "Upgrade to Premium"
   - Use Stripe test card: 4242 4242 4242 4242
   - Complete checkout
   - Verify premium status updated
   - Test unlimited conversions

4. **Test Webhooks**
   - Check Stripe dashboard → Webhooks
   - Verify webhook received and succeeded
   - Check backend logs in Render

## Step 7: Custom Domain (Optional)

### Configure Custom Domain

1. **Purchase Domain**
   - Namecheap, Google Domains, or GoDaddy
   - Suggested: pdftoolkit.io, pdfswift.io, etc.

2. **Setup Frontend Domain**
   ```
   Vercel:
   - Go to project → Settings → Domains
   - Add domain: pdftoolkit.io
   - Follow DNS configuration:
     Type: A
     Name: @
     Value: 76.76.21.21
     
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
   ```

3. **Setup Backend Subdomain**
   ```
   Render:
   - Go to service → Settings → Custom Domains
   - Add domain: api.pdftoolkit.io
   - Follow DNS configuration:
     Type: CNAME
     Name: api
     Value: pdf-toolkit-api.onrender.com
   ```

4. **Update Environment Variables**
   ```
   Render:
   - CLIENT_URL=https://pdftoolkit.io
   
   Vercel:
   - REACT_APP_API_URL=https://api.pdftoolkit.io/api
   ```

5. **Update Stripe Webhooks**
   - Change endpoint to: https://api.pdftoolkit.io/api/payment/webhook

6. **Wait for DNS Propagation**
   - Usually takes 1-24 hours
   - Check with: https://dnschecker.org

## Step 8: Configure Google AdSense

1. **Apply for AdSense**
   - Go to google.com/adsense
   - Sign up with Google account
   - Add your site: pdftoolkit.io

2. **Verify Site**
   - Add AdSense code to public/index.html (already included)
   - Wait for approval (1-3 days to 2 weeks)

3. **Create Ad Units**
   ```
   Once approved:
   - Create "Display ad" for header (728x90 or responsive)
   - Create "In-feed ad" for video ads
   - Get ad slot IDs
   - Add to Vercel environment variables
   ```

4. **Test Ads**
   - Ads may take 24-48 hours to appear
   - Use browser without ad blocker
   - Check AdSense dashboard for impressions

## Step 9: Monitoring and Maintenance

### Setup Monitoring

1. **Render Metrics**
   - Monitor CPU, memory, and response times
   - Set up alerts for downtime

2. **MongoDB Atlas Monitoring**
   - Monitor database size and performance
   - Set up alerts for storage limits

3. **Stripe Dashboard**
   - Monitor subscriptions and revenue
   - Check for failed payments

4. **Error Tracking (Optional)**
   - Setup Sentry.io for error tracking
   - Add to both frontend and backend

### Regular Maintenance

1. **Weekly Tasks**
   - Check error logs in Render
   - Monitor conversion statistics
   - Review user feedback

2. **Monthly Tasks**
   - Update npm dependencies
   - Review and optimize database queries
   - Check storage usage
   - Analyze revenue and costs

3. **Security**
   - Rotate JWT secret every 6 months
   - Update Stripe keys if compromised
   - Monitor for suspicious activity

## Step 10: Scaling (When Needed)

### Upgrade Render Plan
```
When hitting limits:
- Free tier: 750 hours/month, 512 MB RAM
- Starter ($7/mo): Unlimited hours, 512 MB RAM
- Standard ($25/mo): 2 GB RAM, faster
```

### Upgrade MongoDB
```
When storage > 512MB:
- M2 Shared: $9/mo, 2GB storage
- M10 Dedicated: $57/mo, 10GB storage
```

### CDN for Files (Optional)
```
Use AWS S3 or Cloudflare R2:
- Store converted files
- Reduce server load
- Faster downloads
```

## Troubleshooting

### Issue: Backend Not Responding
```bash
# Check Render logs
# Go to Render dashboard → Your service → Logs
# Look for errors

# Common fixes:
- Verify MONGO_URI is correct
- Check NODE_ENV=production
- Restart service
```

### Issue: CORS Errors
```bash
# Verify CLIENT_URL in backend
# Should match exact frontend URL (no trailing slash)
# Redeploy backend after changing
```

### Issue: Stripe Webhooks Failing
```bash
# Check webhook endpoint in Stripe dashboard
# Should be: https://your-backend.com/api/payment/webhook
# Verify STRIPE_WEBHOOK_SECRET is correct
# Check backend logs for webhook errors
```

### Issue: Files Not Uploading
```bash
# Check file size limits
# Verify multer configuration
# Check storage space on Render
# Consider using external storage (S3)
```

## Cost Breakdown

### Free Tier (First 6 Months)
- Render Free: $0
- Vercel Free: $0
- MongoDB Atlas Free: $0
- Stripe: 2.9% + $0.30 per transaction
- SendGrid Free: 100 emails/day
- **Total: ~$0/month + transaction fees**

### Recommended Production Setup
- Render Starter: $7/month
- Vercel Pro: $20/month (optional)
- MongoDB M2: $9/month
- Domain: $10-15/year
- SendGrid Essentials: $20/month (40k emails)
- **Total: ~$36-56/month**

### At Scale (1000+ users)
- Render Standard: $25/month
- Vercel Pro: $20/month
- MongoDB M10: $57/month
- CDN (Cloudflare): $20/month
- SendGrid Pro: $90/month
- **Total: ~$212/month**

## Success Metrics

### Monitor These KPIs
- Daily Active Users (DAU)
- Conversion Rate (free → premium): Target 1-2%
- Average Revenue Per User (ARPU): $5
- Churn Rate: < 5% monthly
- File Conversions Per Day
- API Response Time: < 500ms
- Uptime: > 99.5%

## Next Steps After Deployment

1. **Marketing**
   - Submit to Product Hunt
   - List on AlternativeTo.net
   - Create blog content for SEO
   - Social media presence

2. **SEO Optimization**
   - Add sitemap.xml
   - Optimize meta tags
   - Create blog articles
   - Build backlinks

3. **User Feedback**
   - Add feedback form
   - Monitor support emails
   - Implement feature requests
   - Fix reported bugs

4. **Feature Development**
   - Add OCR for scanned PDFs
   - Implement batch processing
   - Mobile app development
   - API for developers

---

## Support

If you encounter issues during deployment:
- Check Render logs
- Check MongoDB Atlas logs
- Review Stripe webhook logs
- Test locally first

For technical support:
- Email: devops@yourdomain.com
- Render Support: https://render.com/docs
- Vercel Support: https://vercel.com/support

---

**Deployment Complete! 🎉**

Your PDF Toolkit is now live and ready to serve users worldwide!

Monitor your application closely for the first few days to catch any issues early.
