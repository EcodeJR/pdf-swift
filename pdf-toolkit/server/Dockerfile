# Use Node.js 18 slim as base
FROM node:18-slim

# Install system dependencies for PDF processing
# - libreoffice: for Word/Excel to PDF
# - poppler-utils: for PDF to Image (pdf-poppler)
# - ghostscript: for advanced PDF operations
RUN apt-get update && apt-get install -y \
    libreoffice \
    poppler-utils \
    ghostscript \
    fonts-liberation \
    libfontconfig1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install app dependencies
RUN npm install --production

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
