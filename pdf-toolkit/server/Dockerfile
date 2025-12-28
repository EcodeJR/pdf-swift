# Use Node.js 18 slim as base
FROM node:18-slim

# Install system dependencies for PDF processing and native module building
RUN apt-get update && apt-get install -y \
    libreoffice \
    poppler-utils \
    ghostscript \
    fonts-liberation \
    libfontconfig1 \
    python3 \
    make \
    g++ \
    build-essential \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install app dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Copy app source
COPY . .

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV LIBREOFFICE_PATH=/usr/bin/soffice

# Expose port
EXPOSE 5000

# Start the application
CMD [ "node", "server.js" ]
