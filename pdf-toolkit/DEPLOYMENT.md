# Deployment Guide: PDF-Swift (Free Tier Support)

This guide walks you through deploying the PDF Toolkit application using **Docker**, **Render**, and **Vercel**. Using Docker ensures that LibreOffice dependencies work even on free hosting tiers.

---

## 1. Database Setup (MongoDB Atlas)
1. **Create Cluster**: Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 cluster.
2. **Network Access**: Add `0.0.0.0/0` in the "Network Access" tab.
3. **Connection String**: Copy your connection string (replace `<password>` with your database user password).

---

## 2. Backend Deployment (Render + Docker)
*We use Docker to bundle LibreOffice for free.*

1. **GitHub**: Push your `server` code (including the `Dockerfile`) to GitHub.
2. **Render**: Click "New" -> "Web Service".
3. **Environment**: Select **Docker**.
4. **Environment Variables**:
   - `MONGO_URI`: Your MongoDB connection string.
   - `JWT_SECRET`: A secure random string.
   - `NODE_ENV`: `production`.
   - `PORT`: `5000`.
   - `CLIENT_URL`: `https://pdf-swift.vercel.app` (Your frontend URL).

---

## 3. Frontend Deployment (Vercel)
1. **GitHub**: Push your `client` code to GitHub.
2. **Vercel**: Add "New Project" and select your repo.
3. **Root Directory**: `pdf-toolkit/client`.
4. **Environment Variables**:
   - `REACT_APP_API_URL`: `https://your-render-app.onrender.com/api`.

---

## 4. Performance & Scalability Analysis

| Component | Limitation | Fix |
| :--- | :--- | :--- |
| **Render Free Tier** | Hibernates after 15 mins inactivity. | Upgrade to "Starter" ($7/mo). |
| **Memory** | LibreOffice needs ~300MB+ RAM. | Use small files only on Free Tier. |
| **Storage** | Local disk is ephemeral. | Integrate **AWS S3** for permanent storage. |

---

## 5. Local Verification
Before pushing, ensure the Dockerfile builds:
`docker build -t pdf-toolkit-server ./server`
