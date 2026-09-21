# 🚀 Deployment Guide for sale.khbevents.com on cPanel

This guide provides instructions for deploying the **KHB EVENTS Landing Page System & CRM Portal** to your cPanel hosting environment under the subdomain **`sale.khbevents.com`**.

---

## 📋 Server Information (KHB Events Infrastructure)

- **Domain:** `khbevents.com`
- **Subdomain:** `sale.khbevents.com`
- **Server IP:** `76.13.189.96`
- **cPanel User:** `khbevents`
- **DNS Manager:** Cloudflare
- **Node.js Engine:** Node.js v20.x or v22.x+ (Recommended)

---

## 🛠️ Step 1: Create the Subdomain in cPanel

1. Log into your cPanel (`https://khbevents.com:2083` or server IP).
2. Go to **Domains** $\rightarrow$ **Domains** (or **Subdomains**).
3. Click **Create A New Domain**:
   - **Domain:** `sale.khbevents.com`
   - **Document Root:** `/home/khbevents/sale.khbevents.com`
4. In Cloudflare DNS:
   - Add an **A Record** or **CNAME Record**:
     - **Name:** `sale`
     - **Target:** `76.13.189.96` (Proxied or DNS-only as preferred).

---

## ⚡ Step 2: Configure "Setup Node.js App" in cPanel

1. In cPanel, find **Setup Node.js App** (under Software).
2. Click **Create Application**:
   - **Node.js version:** Select `20.x` or latest available.
   - **Application mode:** `Production`
   - **Application root:** `sale.khbevents.com` (or `/home/khbevents/sale.khbevents.com`)
   - **Application URL:** `sale.khbevents.com`
   - **Application startup file:** `server.js`
3. Click **Create**.
4. cPanel will generate the virtual environment and show the terminal command to enter it.

---

## 📦 Step 3: Upload Files & Install

### Option A: Via Git / SSH (Fastest)
```bash
cd /home/khbevents/sale.khbevents.com
# Enter the Node.js virtual environment shown by cPanel, e.g.:
source /home/khbevents/nodevenv/sale.khbevents.com/20/bin/activate
npm install
npm run build
```

### Option B: Via Local Build & ZIP Upload
1. Build locally:
   ```bash
   npm run build
   ```
2. Compress and upload:
   - `.next/`
   - `public/`
   - `src/`
   - `data/`
   - `package.json`
   - `server.js`
   - `next.config.ts`
   - `postcss.config.mjs`
   - `tsconfig.json`
3. Extract in `/home/khbevents/sale.khbevents.com`.
4. In cPanel **Setup Node.js App**, click **Run NPM Install**, then click **Restart Application**.

---

## 🔑 Step 4: Admin Access & Credentials

Once deployed:

| Feature | URL | Description |
|---|---|---|
| **Public Landing Page** | `https://sale.khbevents.com/` | Flagship sales portal with instant cost estimator |
| **Campaign Pages** | `https://sale.khbevents.com/[slug]` | e.g. `/smart-city-tea-cafe`, `/corporate-gala-production` |
| **Admin CMS & CRM** | `https://sale.khbevents.com/admin` | Page builder, leads pipeline & Telegram settings |

- **Default Admin Email:** `admin@khbevents.com`
- **Default Password:** `khbevents2026`
*(You can change email and password anytime from Admin $\rightarrow$ Settings & Alerts)*

---

## 📲 Step 5: Configure Real-Time Telegram Notifications

1. Go to `https://sale.khbevents.com/admin/settings`.
2. Check **Enable Telegram Bot Notification Alerts**.
3. Paste your **Telegram Bot Token** and **Chat ID / Group ID**.
4. Click **Save All Settings**.
Whenever a client submits an event inquiry or delegate reservation, your sales team will receive an instant notification on Telegram!
