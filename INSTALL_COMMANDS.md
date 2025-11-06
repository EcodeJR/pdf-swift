# Installation Commands - PDF Swift

Quick reference for installing dependencies after security upgrades.

---

## 🚀 Quick Install (Recommended)

### Option 1: Clean Install

```bash
# Server
cd pdf-toolkit/server
rm -rf node_modules package-lock.json
npm install

# Client
cd pdf-toolkit/client
rm -rf node_modules package-lock.json
npm install
```

### Option 2: With Legacy Peer Deps (If Option 1 fails)

```bash
# Server
cd pdf-toolkit/server
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Client
cd pdf-toolkit/client
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

## 🔍 Verification Commands

### Check for Vulnerabilities

```bash
# Server
cd pdf-toolkit/server
npm audit

# Client
cd pdf-toolkit/client
npm audit
```

**Expected Result:** `found 0 vulnerabilities`

### Check Installed Versions

```bash
# Server
cd pdf-toolkit/server
npm list --depth=0

# Client
cd pdf-toolkit/client
npm list --depth=0
```

---

## 🧪 Test Commands

### Start Development Servers

```bash
# Terminal 1 - Start Backend
cd pdf-toolkit/server
npm run dev

# Terminal 2 - Start Frontend
cd pdf-toolkit/client
npm start
```

### Build for Production

```bash
# Build Frontend
cd pdf-toolkit/client
npm run build

# Start Production Server
cd pdf-toolkit/server
npm start
```

---

## 🔧 Troubleshooting Commands

### Clear npm Cache

```bash
npm cache clean --force
```

### Reinstall Specific Package

```bash
# Example: Reinstall axios
npm uninstall axios
npm install axios@^1.7.7
```

### Fix Peer Dependency Issues

```bash
npm install --legacy-peer-deps
```

### Update Package Lock

```bash
rm package-lock.json
npm install
```

---

## 📊 Audit Commands

### View Detailed Audit Report

```bash
npm audit --json > audit-report.json
```

### Auto-fix Vulnerabilities (Use with caution)

```bash
npm audit fix
```

### Force Fix (Breaking changes)

```bash
npm audit fix --force
```

**⚠️ Warning:** Don't use `npm audit fix --force` - we've already done manual upgrades!

---

## 🔄 Update Commands (Future)

### Check for Outdated Packages

```bash
npm outdated
```

### Update All Packages (Minor/Patch only)

```bash
npm update
```

### Update Specific Package

```bash
npm update axios
```

---

## 🐛 Debug Commands

### Verbose Install

```bash
npm install --verbose
```

### Check npm Configuration

```bash
npm config list
```

### Check Node/npm Versions

```bash
node --version
npm --version
```

**Required Versions:**
- Node.js: 16+ (Recommended: 18+)
- npm: 8+ (Recommended: 9+)

---

## 📝 Notes

1. Always run `npm audit` after installation
2. Use `--legacy-peer-deps` only if standard install fails
3. Delete `node_modules` and `package-lock.json` for clean install
4. Test thoroughly after installation
5. Don't use `npm audit fix --force` - manual upgrades already done

---

## ✅ Success Checklist

After installation, verify:

- [ ] `npm audit` shows 0 vulnerabilities
- [ ] Server starts: `npm run dev` (in server folder)
- [ ] Client starts: `npm start` (in client folder)
- [ ] No console errors
- [ ] MongoDB connects
- [ ] API calls work
- [ ] File uploads work
- [ ] All pages load

---

**Last Updated:** October 24, 2025  
**Package Versions:** See `package.json` files
