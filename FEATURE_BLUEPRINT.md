# KHB EVENTS — System User Guide & Operator Blueprint

> **Platform:** `sale.khbevents.com`  
> **Target Audience:** Event Directors, Marketing Managers, Sales Team & System Operators  
> **Version:** 2.4.0 (Production)  
> **Updated:** September 2026  

---

## 📌 Table of Contents

1. [Quick Start: Logging In & Navigation](#1-quick-start-logging-in--navigation)
2. [How to Create & Launch a New Landing Page](#2-how-to-create--launch-a-new-landing-page)
3. [How to Manage Inbound Leads in the CRM](#3-how-to-manage-inbound-leads-in-the-crm)
4. [How to Manage the Round-Robin Sales Team](#4-how-to-manage-the-round-robin-sales-team)
5. [How to Configure Telegram Alerts & System Settings](#5-how-to-configure-telegram-alerts--system-settings)
6. [Frontend Experience Guide for Visitors](#6-frontend-experience-guide-for-visitors)
7. [Operator "How Do I..." Cheat Sheet & Troubleshooting](#7-operator-how-do-i-cheat-sheet--troubleshooting)

---

## 1. Quick Start: Logging In & Navigation

### 1.1. Accessing the Admin Portal
- **Login URL:** [`https://sale.khbevents.com/admin/login`](https://sale.khbevents.com/admin/login) (or `/admin`)
- **Default Email:** `admin@khbevents.com`
- **Default Password:** `khbevents2026`  
  *(Can be updated anytime in Settings $\rightarrow$ Security)*

### 1.2. Main Navigation Overview
Once logged in, use the left sidebar to navigate:

| Section | Route | What You Do Here |
|---|---|---|
| **Dashboard** | `/admin` | Overview KPIs: Total leads, active campaigns, page views, and conversion rates. |
| **Landing Pages** | `/admin/pages` | View, create, duplicate, edit, preview, and archive campaign landing pages. |
| **Leads CRM** | `/admin/leads` | Process incoming inquiries, update pipeline stages, 1-click WhatsApp chat, add team notes, export to CSV. |
| **Round Robin Sales** | `/admin/round-robin` | Add/remove sales reps, set rotation weights, turn staff ON/OFF when on leave, view allocation logs. |
| **Settings** | `/admin/settings` | Company hotline, WhatsApp, Telegram bot tokens, manager notification Chat ID, admin password. |

---

## 2. How to Create & Launch a New Landing Page

You can create unlimited landing pages for business delegations, trade expos, concerts, or summits.

### Step 1: Open the Page Creator
1. Click **Landing Pages** in the left sidebar.
2. Click the **"+ New Page"** button in the top-right corner (or duplicate an existing page to save time).

### Step 2: Choose a Campaign Template
Select from 5 industry-specific presets:
- **B2B Trade Delegation (Default):** Built for business missions (like Vietnam or Korea). Includes multi-day itinerary, value stack, 1-on-1 business matching, and pass tiers.
- **Trade Expo & Exhibition:** Includes interactive booth tiers (Shell Scheme, Corner, Island Pavilion), floor specs, and exhibitor registration.
- **Concert & Music Festival:** Includes artist/DJ lineups, set times, VIP pit passes, and festival gallery.
- **Corporate Summit & Conference:** Includes keynote speakers, panel tracks, and corporate tables.
- **Custom Campaign:** Blank canvas with toggleable sections.

### Step 3: Fill in Core Information (`General` Tab)
- **Campaign Title:** Display name (e.g. `Korea B2B Business Delegation 2026 (Seoul)`).
- **URL Slug:** The web address (e.g. `korea-b2b-trip-2026` becomes `sale.khbevents.com/korea-b2b-trip-2026`).
- **Category:** e.g., `Trade Delegation`, `Expo`, `Concert`.
- **Badge:** Top pill label (e.g., `VIP Korea • Limited to 30 Seats`).
- **Status:** 
  - `Published`: Live and visible to the public and in the homepage campaign showcase.
  - `Draft`: Hidden from the homepage while editing.
  - `Archived`: Deactivated and returns a 404.

### Step 4: Configure Hero Banner & Dates (`Hero` & `Event` Tabs)
- **Hero Headline:** Catchy main headline in English or Khmer.
- **Hero Subheadline:** 2–3 sentences highlighting the return-on-investment and benefits.
- **CTA Button Text:** e.g., `Secure Your Pass ($750)` or `Reserve Seat Now`.
- **CTA Link:** Keep `#booking-form` so clicking scrolls smoothly to the lead form.
- **Hero Image:** Select from pre-loaded event photos or paste an image URL.
- **Event Dates & Duration:** e.g., `2026-11-25` and `4 Days / 3 Nights`.
- **Venue & Address:** Hotel or convention center name (e.g., `COEX & KINTEX, Seoul, South Korea`).

### Step 5: Set Up Urgency & Countdown Timer
1. Check **Enable Countdown Timer**.
2. **Total Seats vs. Claimed Seats:** e.g., Total `30`, Claimed `19` $\rightarrow$ system displays *"Only 11 seats remaining!"*.
3. **Early Bird Price:** e.g., `$750` (displayed with a highlighted badge).
4. **Regular Price:** e.g., `$799` (displayed as a struck-through comparison).
5. **Early Bird Deadline:** Date & time when the Early Bird discount expires.

### Step 6: Pricing Packages & Passes (`Packages` Tab)
Add 1 to 4 pass tiers (e.g., *Executive Delegate Pass*, *VIP Chairman Pass*, *Corporate Delegation*):
- **Pass Name & Price:** e.g., `Early Bird Pass` $\rightarrow$ `$750`.
- **Period / Unit:** e.g., `per delegate`.
- **Highlight Features:** Bullet points of inclusions (Return flights, 4-star hotel, expo pass, translator).
- **Popular Badge:** Toggle "Most Popular" to highlight the tier in gold.

### Step 7: Multi-Day Interactive Itinerary (`Itinerary` Tab)
Add daily schedules for delegates:
- **Day Number & Date:** e.g. Day 1 (Nov 25, 2026).
- **Day Title:** e.g. `Arrival & VIP Welcome Dinner in Seoul`.
- **Schedule Items:** Add time and activity (e.g. `09:30 - Departure from Phnom Penh`, `17:00 - Hotel Check-in`, `19:00 - Gala Dinner`).

### Step 8: Value Stack & Inclusions (`Value Stack` Tab)
List all items included with individual dollar values to show massive savings:
- E.g. *Round-Trip Flight ($450 value)*, *4-Star Hotel 3 Nights ($300 value)*, *3 Expo VIP Passes ($150 value)*, *Korean-Khmer Translator ($200 value)*.
- System automatically shows: **Total Value $1,100+ $\rightarrow$ You Pay Only $750**.

### Step 9: FAQs, Guarantee & Testimonials
- **FAQs:** Common traveler questions (visas, meals, airport transfers).
- **Guarantee:** 100% Risk-Free commitment (e.g. *No payment today until team consultation*).
- **Testimonials:** Real quotes from previous attendees or Oknha with 5-star ratings.

### Step 10: Khmer Language Version (`Khmer Translation` Tab)
Click the **Khmer Tab (ខ្មែរ)** in the editor to provide native Khmer translations:
- Khmer Headline, Subheadline, Itinerary, and Value Stack.
- When visitors toggle language or visit `?lang=kh`, the page renders with optimized Khmer typography (`Hanuman` / `Kantumruy Pro`).

### Step 11: Isolated Campaign Settings (`Isolated Settings` Tab)
*(Optional customization per campaign)*:
- **Custom Hotline Phone & WhatsApp:** Route inquiries to a specific department.
- **Custom Sales Coordinator:** Name and title shown on the page (e.g. *Chamnab Mey - Senior Trade Director*).
- **Campaign Tags:** Add tags automatically attached to leads (e.g. `b2b-korea, camping-gear`).
- **Access Password:** If private/secret, enter a PIN password required to view the page.

### Step 12: Save & Publish
Click **"Save Landing Page"** at the top right:
- Instant live link is generated: `https://sale.khbevents.com/<slug>`.
- The page immediately appears in the **Featured Campaigns** showcase on the homepage.

---

## 3. How to Manage Inbound Leads in the CRM

Navigate to [`/admin/leads`](https://sale.khbevents.com/admin/leads).

### 3.1. Understanding the Lead Pipeline
Incoming buyer inquiries flow through 6 stages:

```text
[ NEW ] ──> [ CONTACTED ] ──> [ PROPOSAL_SENT ] ──> [ NEGOTIATING ] ──> [ WON ] (Deposit Paid)
                                                                    └──> [ LOST ] (Declined)
```

| Status | Badge Color | What It Means & Required Action |
|---|---|---|
| **NEW** | 🟡 Solid Gold | **Fresh Inquiry!** Consultant must contact within **15 minutes**. |
| **CONTACTED** | 🔵 Blue | Spoke with client via phone or Telegram; qualifications verified. |
| **PROPOSAL_SENT** | 🟣 Purple | Sent official delegation itinerary, invoice, or sponsorship deck. |
| **NEGOTIATING** | 🟠 Orange | Discussing custom seats, corporate group discounts, or flight upgrades. |
| **WON** | 🟢 Emerald Green | **Closed Deal!** Deposit or full payment received. |
| **LOST** | ⚪ Gray | Client cancelled or not traveling this cohort. |

### 3.2. Filtering & Finding Leads
- **Filter by Status:** Click any status pill at the top (`ALL`, `NEW`, `WON`, etc.).
- **Filter by Campaign:** Dropdown filter to view only `Korea B2B Trip` or `Smart City Vietnam`.
- **Search Bar:** Instantly search by client name, company, phone number, or keywords in notes.

### 3.3. Reviewing Visitor Demographics & Location
Open any lead card to see edge-detected visitor intelligence:
- **Country Flag & Name:** 🇰🇭 Cambodia, 🇻🇳 Vietnam, 🇰🇷 South Korea, 🇺🇸 United States, 🇨🇳 China.
- **Detected City:** e.g., `Phnom Penh`, `Ho Chi Minh City`, `Siem Reap`.
- **Marketing Source (UTM):** Shows if the lead came from Facebook Ads, TikTok, Google, or direct referral.

### 3.4. Contacting the Client in 1-Click
Inside the lead drawer:
- **Click "WhatsApp Chat":** Automatically opens WhatsApp with a pre-filled professional greeting in Khmer or English.
- **Click "Call":** Dials the client's phone number directly.

### 3.5. Adding Team Notes & History
Keep team communication organized:
1. Scroll down to the **Notes** box inside the lead drawer.
2. Type an update (e.g., *"Called Oknha at 2:00 PM. Requested invoice for 2 VIP passes"*).
3. Click **Add Note**.
4. The note is timestamped and visible to all sales staff.

### 3.6. Deleting Spam / Test Leads
1. Click on the test lead.
2. Click the red **"Delete Lead"** button at the bottom.
3. Confirm deletion in the pop-up modal. The lead is permanently removed.

### 3.7. Exporting to CSV (Excel / Google Sheets)
Click the **"Export CSV"** button in the top-right toolbar:
- Downloads an immediate spreadsheet file containing all lead names, phone numbers, emails, companies, packages, UTM sources, and creation dates.

---

## 4. How to Manage the Round-Robin Sales Team

Navigate to [`/admin/round-robin`](https://sale.khbevents.com/admin/round-robin).

The Round-Robin engine ensures that inquiries and floating Telegram clicks are shared fairly and systematically among your sales representatives.

### 4.1. How Inbound Routing Works
1. When a client submits a form or clicks the floating **Telegram** button on any landing page:
2. The system checks the active sales roster.
3. The lead is assigned to the next eligible sales representative.
4. **Direct Visitor Redirection:** The visitor's Telegram app opens directly into a chat with that specific sales rep (`https://t.me/<staff_telegram>`).
5. **Simultaneous Bot Alert:** `@khb_sale_admin_bot` alerts both the assigned rep and the Event Director.

### 4.2. Adding a New Sales Representative
1. Go to `/admin/round-robin` and click **"+ Add Sales Rep"**.
2. Fill in:
   - **Full Name:** e.g., `Sokha Chen`.
   - **Job Title:** e.g., `Senior B2B Consultant`.
   - **Telegram Username:** Staff's username **WITHOUT** the `@` symbol (e.g., `sokhachen_khb`).
   - **Phone Number:** e.g., `+855 12 111 222`.
   - **Percentage Weight:** Allocation share (e.g., `20%`).
3. Click **Save**.

### 4.3. What to Do When a Staff Member Is on Leave (Active Toggle)
If a sales rep is sick, on holiday, or traveling:
1. Find their card in the roster.
2. Toggle their **Active Status** to **OFF** (gray).
3. Click **"Rebalance Weights"** so the remaining active reps automatically share 100% of leads.
4. When the staff member returns, toggle them back **ON**.

### 4.4. Testing & Simulating Sales Distribution
- **Simulate 100 Leads:** Click **"Simulate 100 Leads"** to preview how many leads each rep will receive based on current percentage weights.
- **Send Test Dispatch:** Click **"Send Test Dispatch"** to send a test notification through Telegram to verify that the bot is delivering alerts.

### 4.5. Viewing Routing Audit Logs
Scroll to the **Round Robin Logs** section to see:
- Exact date and time of every lead allocation.
- Which staff member received it.
- Whether it was triggered by a **Form Submission** or a **Floating Telegram Click**.
- Delivery confirmation status (`DELIVERED` or `DIRECT_ROUTED`).

---

## 5. How to Configure Telegram Alerts & System Settings

Navigate to [`/admin/settings`](https://sale.khbevents.com/admin/settings).

### 5.1. Company Profile & Hotlines
Update your global contact info:
- **Company Name:** `KHB EVENTS`
- **Official Hotline:** e.g., `+855 12 888 999`
- **WhatsApp Number:** International format without plus (e.g., `85512888999`)
- **Default Telegram Username:** `khb_sale_admin_bot`
- **Office Address:** `Diamond Island (Koh Pich), Phnom Penh, Cambodia`

### 5.2. Setting Up the Telegram Alert Bot
To receive real-time phone alerts whenever a buyer submits an inquiry:
1. Open the **Telegram Alerts** tab in Settings.
2. Toggle **Enable Telegram Alerts** to **ON**.
3. **Telegram Bot Token:** paste the token from @BotFather into the field. It is stored with the settings and is never written in documentation or code.
   *(Managed by `@khb_sale_admin_bot`)*
4. **Manager / Director Chat ID:** the numeric ID of the manager or sales group chat.
   *(Or any group chat ID where the team wants lead copies)*
5. Click **"Save Settings"**.

### 5.3. Changing Admin Password
1. Click the **Security** tab in Settings.
2. Enter your **New Password** (minimum 6 characters).
3. Re-enter in **Confirm Password**.
4. Click **"Update Password"**. Next time you log in, use the new password.

### 5.4. Appearance (Dark Mode / Light Mode)
Toggle the sun/moon icon in the sidebar or Settings to switch between:
- **Dark Mode (Default):** Premium obsidian black with emerald & gold accents.
- **Light Mode:** Crisp executive paper aesthetic.

---

## 6. Frontend Experience Guide for Visitors

### 6.1. Homepage Portal (`sale.khbevents.com`)
- **Hero Section:** KHB Events positioning and branding.
- **Featured Campaigns Showcase:** Live cards for all published landing pages (e.g. Vietnam and Korea trips).
- **Interactive Budget Calculator:** Clients choose event type, expected audience size (100–10,000+ guests), and equipment options (4K LED walls, concert sound, lighting) to calculate an instant estimated budget.
- **Lead Booking Form:** Direct flagship inquiry submission.
- **Floating Concierge:** Direct WhatsApp and Telegram contact buttons.

### 6.2. Campaign Landing Pages (`sale.khbevents.com/[slug]`)
- **Interactive Pass Selector:** Visitors click *"Select Pass"* on any tier; the page smoothly scrolls to the form and pre-fills their chosen package.
- **Scarcity Strip:** Live countdown and seats counter.
- **Day-by-Day Itinerary:** Interactive tabs where visitors view what happens on Day 1, Day 2, Day 3, and Day 4.
- **Floating Contact Routing:** When clicked, automatically connects the visitor to their designated sales rep.

### 6.3. Special URL Modes for Marketing
- **Mobile Webview App View:** Add `?view=app` (e.g. `sale.khbevents.com/korea-b2b-trip-2026?view=app`) for a native app layout with bottom action bars.
- **Minimal Fast Opt-In View:** Add `?view=optin` (e.g. `sale.khbevents.com/korea-b2b-trip-2026?view=optin`) for an ultra-fast opt-in page ideal for paid ads.
- **Khmer Language Forcing:** Add `?lang=kh` (e.g. `sale.khbevents.com/korea-b2b-trip-2026?lang=kh`) to load the page in Khmer by default.

---

## 7. Operator "How Do I..." Cheat Sheet & Troubleshooting

### Q1: How do I change the Early Bird price or extend the deadline?
1. Go to **Landing Pages** (`/admin/pages`).
2. Click **Edit** on the campaign.
3. In the **Event & Urgency** tab, update **Early Bird Price** and **Early Bird Deadline**.
4. Click **Save Landing Page**. The change is live immediately.

### Q2: How do I mark a campaign as "Sold Out"?
1. Edit the landing page.
2. Go to the **Isolated Settings** tab.
3. Toggle **"Mark as Sold Out"** to **ON**.
4. Enter your custom message (e.g., *"All 30 seats are booked! Join the waiting list for the next cohort."*).
5. Save. The booking button will automatically disable or switch to a waiting list.

### Q3: A sales rep is not receiving Telegram alerts. What should I check?
1. Make sure they have opened Telegram, searched for `@khb_sale_admin_bot`, and clicked **Start** (`/start`). A bot cannot message a user who hasn't clicked Start first.
2. Verify their **Telegram Username** in `/admin/round-robin` is typed accurately without `@` or spaces.
3. Check that their status is toggled **Active (ON)**.

### Q4: How do I create a new trip for a new country (e.g. Japan or Germany)?
1. Go to `/admin/pages` and click **"+ New Page"** (or click **Duplicate** on `/korea-b2b-trip-2026`).
2. Change the title, slug (`japan-b2b-trip-2026`), dates, venue, and itinerary.
3. Update the package pricing.
4. Click **Save**.
5. Test your new link at `https://sale.khbevents.com/japan-b2b-trip-2026`.

### Q5: How do I export all our leads for a sales meeting?
1. Go to `/admin/leads`.
2. (Optional) Filter by the campaign or status you want to discuss.
3. Click the **"Export CSV"** button.
4. Open the downloaded file in Microsoft Excel, Apple Numbers, or Google Sheets.

---

*This guide is maintained by the KHB EVENTS team. For technical escalations, contact `admin@khbevents.com`.*
