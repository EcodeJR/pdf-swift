# Installation Troubleshooting Guide

## 🚨 Common npm Installation Issues

### Issue 1: ERESOLVE - Peer Dependency Conflict

**Error:**
```
npm error ERESOLVE could not resolve
npm error peer multer@"^1.4.2" from multer-gridfs-storage@5.0.2
```

**Solution:**
Use `--legacy-peer-deps` flag:
```bash
npm install pdf-poppler libreoffice-convert --legacy-peer-deps
```

---

### Issue 2: ECONNRESET - Network Error

**Error:**
```
npm error network read ECONNRESET
```

**Solutions:**

**Option 1: Clean cache and retry**
```bash
npm cache clean --force
npm install react-pdf --legacy-peer-deps
```

**Option 2: Use different registry**
```bash
npm config set registry https://registry.npmjs.org/
npm install react-pdf --legacy-peer-deps
```

**Option 3: Increase timeout**
```bash
npm config set fetch-timeout 60000
npm install react-pdf --legacy-peer-deps
```

---

### Issue 3: EPERM - Permission Error (Windows)

**Error:**
```
npm warn cleanup Failed to remove some directories
Error: EPERM: operation not permitted
```

**Solutions:**

**Option 1: Run as Administrator**
- Right-click PowerShell/CMD
- Select "Run as Administrator"
- Navigate to project folder
- Run npm install

**Option 2: Close VS Code/IDEs**
- Close all editors that might be locking files
- Run npm install
- Reopen editor

**Option 3: Use --force**
```bash
npm install react-pdf --force
```

---

### Issue 4: EEXIST - Cache Corruption

**Error:**
```
npm error code EEXIST
npm error syscall rename
```

**Solution:**
```bash
# Clean cache completely
npm cache clean --force

# Verify cache
npm cache verify

# Try installation again
npm install --legacy-peer-deps
```

---

## 🔧 Complete Installation Steps (Windows)

### Step 1: Clean Everything
```powershell
# Server
cd pdf-toolkit\server
npm cache clean --force
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Client  
cd ..\client
npm cache clean --force
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
```

### Step 2: Install Server Packages
```powershell
cd ..\server

# Install existing packages first
npm install --legacy-peer-deps

# Then install new packages
npm install pdf-poppler libreoffice-convert --legacy-peer-deps
```

### Step 3: Install Client Packages
```powershell
cd ..\client

# Install existing packages first
npm install --legacy-peer-deps

# Then install new package
npm install react-pdf --legacy-peer-deps
```

---

## 🎯 Alternative: Manual Package Installation

If npm install keeps failing, you can add packages manually:

### Server (package.json)
```json
{
  "dependencies": {
    "pdf-poppler": "^0.2.1",
    "libreoffice-convert": "^1.6.0"
  }
}
```

Then run:
```bash
npm install --legacy-peer-deps
```

### Client (package.json)
```json
{
  "dependencies": {
    "react-pdf": "^7.7.0"
  }
}
```

Then run:
```bash
npm install --legacy-peer-deps
```

---

## 🌐 Network Issues

### Check npm Configuration
```bash
npm config list
npm config get registry
npm config get proxy
npm config get https-proxy
```

### Reset npm Configuration
```bash
npm config delete proxy
npm config delete https-proxy
npm config set registry https://registry.npmjs.org/
```

### Use Yarn Instead (Alternative)
```bash
# Install Yarn
npm install -g yarn

# Use Yarn for installation
cd pdf-toolkit/server
yarn add pdf-poppler libreoffice-convert

cd ../client
yarn add react-pdf
```

---

## 🔍 Verify Installation

### Check Installed Packages
```bash
# Server
cd pdf-toolkit/server
npm list pdf-poppler libreoffice-convert

# Client
cd ../client
npm list react-pdf
```

### Expected Output
```
pdf-toolkit-server@1.0.0
├── pdf-poppler@0.2.1
└── libreoffice-convert@1.6.0

pdf-toolkit-client@1.0.0
└── react-pdf@7.7.0
```

---

## 🚀 Quick Fix Commands

### If All Else Fails
```powershell
# Run as Administrator in PowerShell

# Server
cd C:\Users\hp\Desktop\startups\pdf-swift\pdf-toolkit\server
npm cache clean --force
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install --legacy-peer-deps
npm install pdf-poppler libreoffice-convert --legacy-peer-deps

# Client
cd ..\client
npm cache clean --force
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install --legacy-peer-deps
npm install react-pdf --legacy-peer-deps
```

---

## 📝 Notes

### Why --legacy-peer-deps?
- Bypasses strict peer dependency checking
- Allows installation even with version conflicts
- Safe for this project (packages are compatible)

### System Dependencies Still Required
Even after npm packages install successfully, you still need:
- **Poppler** - For PDF to JPG conversion
- **LibreOffice** - For Word/Excel to PDF conversion

### Installation Order Matters
1. Clean cache
2. Install existing packages
3. Install new packages
4. Verify installation

---

## ✅ Success Indicators

You'll know installation succeeded when:
```bash
npm list pdf-poppler libreoffice-convert react-pdf
```

Shows all packages without errors.

---

## 🆘 Still Having Issues?

### Option 1: Skip Problematic Packages
Implement features one at a time:
1. Start with GridFS (already done)
2. Add PDF preview (react-pdf only)
3. Add conversions later (pdf-poppler, libreoffice-convert)

### Option 2: Use Docker
Create a Docker container with all dependencies pre-installed.

### Option 3: Deploy to Linux Server
Linux has better package management for these dependencies.

---

## 📞 Common Solutions Summary

| Error | Solution |
|-------|----------|
| ERESOLVE | `--legacy-peer-deps` |
| ECONNRESET | Clean cache, retry |
| EPERM | Run as Admin, close editors |
| EEXIST | Clean cache, verify |
| Network timeout | Increase timeout, change registry |

---

**Last Updated:** October 30, 2025  
**Status:** Troubleshooting active installation issues
