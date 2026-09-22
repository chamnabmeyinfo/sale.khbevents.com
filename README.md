# KHB EVENTS - Landing Page System & CRM Portal

> **Official Sales & Landing Portal for KHB EVENTS Cambodia (`sale.khbevents.com`)**

A high-performance, conversion-optimized Landing Page System and Lead Management CRM built for **KHB EVENTS**, Cambodia's premier event management, 4K LED staging, concert production, and exhibition agency.

> 📖 **Architecture & Engineering Blueprint:**  
> For complete system architecture, dual-tier persistence sync, Telegram bot workflows, round-robin rules, and SOPs for future updates, read [FEATURE_BLUEPRINT.md](FEATURE_BLUEPRINT.md).

---

## 🌟 Key Highlights & Features

### 1. High-Converting Public Sales Portal (`/`)
- **Luxury KHB Branding:** Styled in Emerald Green, Champagne Gold, and deep obsidian black matching KHB Events' brand aesthetics.
- **Interactive Event Budget Calculator:** Visitors select event scale, audience count, and technical equipment (4K LED wall, line-array audio, moving lights, 3D stage build) to receive an instant production guideline and lock in custom estimates.
- **Visual Production Portfolio:** Showcase of real past mega-events (Diamond Island / Koh Pich, Koh Norea, K Mall, etc.).
- **Turnkey Production Pillar Grid:** Corporate galas, concerts/festivals, trade delegations, booth fabrication, 4K LED screens, and ticketing.
- **Instant Communication:** Floating WhatsApp and Telegram buttons with pre-filled message triggers.
- **Conversion-Optimized Lead Form:** Real-time client inquiries with automatic marketing UTM attribution tracking (`utm_source`, `utm_medium`, `utm_campaign`).

### 2. Dynamic Campaign Landing Pages (`/[slug]`)
- Host unlimited specialized landing pages under `sale.khbevents.com/[slug]`.
- Pre-seeded high-impact campaigns:
  - `/smart-city-tea-cafe`: Flagship Vietnam Smart City, Tea & Cafe B2B Business Delegation 2026.
- **Dedicated Business Type Templates:** Unique landing page templates for B2B Delegations, Trade Expos, Concerts/Festivals, Corporate Summits, and Custom Campaigns.
- Dynamic Countdown Timer for events with registration deadlines.
- Interactive Package Tier Cards with "Select Pass" triggers that prefill the inquiry form.
- Dedicated FAQ accordion and gallery.

### 3. Integrated Admin CMS & Leads CRM (`/admin`)
- **Overview Dashboard:** Total inquiries, new leads count, active pages, total tracked views, and overall conversion rate %.
- **Visual Landing Page Builder & CMS:**
  - Create, edit, clone, or archive landing pages in seconds.
  - Customize Hero banner, CTA text, venue info, highlights, package tiers, and FAQs.
  - Instant live preview and public link copy.
- **Leads & Inquiries CRM Pipeline:**
  - Manage lead status: `NEW` $\rightarrow$ `CONTACTED` $\rightarrow$ `PROPOSAL_SENT` $\rightarrow$ `NEGOTIATING` $\rightarrow$ `WON` $\rightarrow$ `LOST`.
  - Direct 1-click **WhatsApp Chat** and phone calls.
  - Detailed client view with special requests, custom parameters, and internal notes history.
  - **Export to CSV:** 1-Click CSV export for Excel and Google Sheets.
- **Settings & Real-Time Alerting:**
  - Company contact information (phone, WhatsApp number, Telegram, address).
  - Real-time **Telegram Webhook alerts** sent directly to the sales team's phone or group chat upon inquiry submission.
  - Admin credentials management.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16 (App Router with Turbopack)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4 + Lucide Icons
- **Data Persistence:** Portable, zero-dependency JSON database engine with atomic writes and schema validation (`data/db.json`).
- **Server Deployment:** Compatible with Node.js on cPanel Passenger, Docker, Vercel, or VPS.

---

## 🚀 Getting Started Locally

1. **Install Dependencies:**
   ```bash
   npm install --ignore-scripts
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## 🔐 Admin Credentials

- **URL:** `http://localhost:3000/admin` (or `https://sale.khbevents.com/admin`)
- **Default Email:** `admin@khbevents.com`
- **Default Password:** `khbevents2026`
*(Can be updated anytime in the Admin Settings panel)*

---

## 📁 Deployment to cPanel

See detailed instructions in [CPANEL_DEPLOYMENT.md](CPANEL_DEPLOYMENT.md).
