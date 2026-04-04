# Odoo POS Cafe — Complete System Context Document
> Version 1.0 | Hackathon Reference Document | All features, flows, data, and logic in one place

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Goals & Scope](#2-goals--scope)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Tech Stack](#4-tech-stack)
5. [Database Schema — All Tables](#5-database-schema--all-tables)
6. [Page-by-Page Data & Functionality](#6-page-by-page-data--functionality)
   - 6.1 Login & Signup
   - 6.2 Home — POS Terminal Cards
   - 6.3 POS Settings
   - 6.4 Products List
   - 6.5 Product Detail / Create
   - 6.6 Categories
   - 6.7 Floors & Tables
   - 6.8 Orders List (Backend)
   - 6.9 Order Detail (Backend)
   - 6.10 Payments List (Backend)
   - 6.11 Customers List
   - 6.12 Customer Detail
   - 6.13 Reporting & Dashboard
   - 6.14 POS Terminal — Floor View
   - 6.15 POS Terminal — Register (Order Screen)
   - 6.16 POS Terminal — Payment Screen
   - 6.17 Kitchen Display System (KDS)
   - 6.18 Customer Facing Display
   - 6.19 Mobile Self-Ordering (6 Screens)
7. [API Endpoints — Complete List](#7-api-endpoints--complete-list)
8. [Real-Time Architecture (Socket.io)](#8-real-time-architecture-socketio)
9. [Business Logic & Rules](#9-business-logic--rules)
10. [End-to-End Flow](#10-end-to-end-flow)
11. [Security Requirements](#11-security-requirements)

---

## 1. Project Overview

**Project Name:** Odoo POS Cafe
**Type:** Full-stack Restaurant Point of Sale (POS) System
**Context:** Hackathon project built with production-level thinking

Odoo POS Cafe is a complete restaurant management system that handles the entire lifecycle of a dining experience — from a customer sitting at a table, through ordering, kitchen preparation, and payment, to management reporting. It is not just a billing tool; it is a coordinated system where a cashier, kitchen staff, and customer all interact through their own dedicated screens simultaneously.

The system has two major surfaces:

**Backend (Configuration & Admin Area):** A web-based admin panel where managers set up and configure everything — products, categories, payment methods, floors, tables, and POS terminals. It also houses order history, payment records, customer data, and reporting dashboards.

**Frontend (POS Terminal):** A cashier-facing interface inside the browser that operates in a session. The cashier opens a session, selects tables from a floor plan view, adds products to orders, sends them to the kitchen, and processes payments through multiple methods.

Beyond these two, the system extends into three specialized peripheral screens:

**Kitchen Display System (KDS):** A screen visible to kitchen staff showing incoming orders in real time, with stage-based workflow management (To Cook → Preparing → Completed).

**Customer Facing Display:** A counter-mounted screen the customer can see while the cashier is working. It shows the live order being built, the UPI QR code when payment is initiated, and a thank-you message on completion.

**Mobile Self-Ordering:** An optional module where each restaurant table has a unique QR code. Customers scan it with their phone, browse the menu in their browser, customize their order with variants and add-ons, and submit — which goes directly to the Kitchen Display.

---

## 2. Goals & Scope

### Primary Goals
- A cashier can open a POS session and start taking table-based orders
- Orders can be paid using Cash, Digital/Card, or UPI QR code
- Order details are pushed to the kitchen screen in real time
- Kitchen staff can manage order stages on their own screen
- A customer-facing display shows live order status and payment info
- A reporting dashboard shows sales, session data, and product performance

### Secondary (Optional) Goals
- Self/Online ordering via table QR code on customer's mobile browser
- Order tracking for mobile customers (live status from KDS)
- Basic booking/appointment resource linkage on tables

### Out of Scope (for hackathon)
- External payment gateway integration (UPI is manual confirmation, not API)
- Inventory management / stock tracking
- Multi-branch advanced analytics
- Native mobile apps (everything is browser-based)

---

## 3. User Roles & Permissions

### Admin / Manager
- Full access to backend configuration (products, categories, floors, tables, POS settings)
- Can create new POS terminals
- Can view all orders, payments, and customer records
- Can access reporting dashboard with all filters
- Can open and close POS sessions
- Can archive and delete Draft orders

### Cashier (Staff)
- Can open a POS session and access the terminal frontend
- Can create and manage orders within their session
- Can send orders to Kitchen Display
- Can process payments (Cash, Digital, UPI)
- Can assign customers to orders
- Cannot access backend configuration settings
- Cannot delete or archive orders from the backend

### Kitchen Staff
- Read-only access to Kitchen Display System
- Can advance order ticket stages (To Cook → Preparing → Completed)
- Can mark individual items as prepared (strikethrough)
- Cannot access POS terminal, backend, or reporting

### Customer (Self-Ordering)
- Unauthenticated — identified only by table token in URL
- Can browse menu and place orders via mobile browser
- Can track their own order status
- Cannot see other tables' orders or any backend data

---

## 4. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js | Server runtime |
| Backend Framework | Express.js | REST API server |
| Authentication | JWT (access + refresh tokens) | Stateless auth with rotation |
| Database | Supabase (PostgreSQL) | Primary data store |
| Realtime (backend → displays) | Socket.io | KDS and Customer Display live updates |
| Realtime (mobile tracking) | Supabase Realtime | Order status subscription for mobile |
| Frontend | React.js | All browser UIs |
| Styling | Tailwind CSS | Utility-first styling |
| QR Code (server) | `qrcode` npm package | Generate UPI and table QR codes |
| QR Code (client) | `qrcode.react` | Render QR in browser |
| PDF Export | `pdfkit` npm package | Reports and QR code PDF generation |
| Excel Export | `exceljs` npm package | XLS report export |
| File/Image Storage | Supabase Storage | Splash screen images for self-ordering |
| Containerization | Docker + Docker Compose | Deployment |
| Environment Config | `.env` files | All secrets and config values |

---

## 5. Database Schema — All Tables

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | Auto-generated |
| name | VARCHAR | Display name |
| email | VARCHAR UNIQUE | Login identifier |
| password_hash | VARCHAR | bcrypt hashed |
| role | ENUM('admin','cashier','kitchen') | Access control |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

### `refresh_tokens`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | |
| token | TEXT | Hashed refresh token |
| expires_at | TIMESTAMP | |
| revoked | BOOLEAN | Default false |

### `pos_config`
The anchor table — almost every other table links back here.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | VARCHAR | e.g. "Odoo Cafe" |
| cash_enabled | BOOLEAN | Default false |
| digital_enabled | BOOLEAN | Default false |
| upi_enabled | BOOLEAN | Default false |
| upi_id | VARCHAR | e.g. "123@ybl.com" |
| self_ordering_enabled | BOOLEAN | Default false |
| self_ordering_mode | ENUM('online','qr_menu') | null if disabled |
| bg_color | VARCHAR | Hex color for mobile splash |
| created_by | UUID FK → users | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `pos_config_images`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| pos_config_id | UUID FK → pos_config | |
| storage_url | TEXT | Supabase Storage URL |
| order | INTEGER | Display order |

### `pos_sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| pos_config_id | UUID FK → pos_config | |
| opened_by | UUID FK → users | |
| opened_at | TIMESTAMP | |
| closed_at | TIMESTAMP | null if active |
| closing_sale_total | DECIMAL(10,2) | Computed on close |
| status | ENUM('active','closed') | |

### `floors`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| pos_config_id | UUID FK → pos_config | |
| name | VARCHAR | e.g. "Ground Floor" |
| created_at | TIMESTAMP | |

### `tables`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| floor_id | UUID FK → floors | |
| table_number | VARCHAR | e.g. "1", "6", "12A" |
| seats | INTEGER | Seating capacity |
| active | BOOLEAN | If false, hidden from POS floor view |
| appointment_resource | VARCHAR | Optional external resource link |
| qr_token | VARCHAR UNIQUE | Auto-generated short slug on creation |
| created_at | TIMESTAMP | |

### `categories`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | VARCHAR | e.g. "Drinks", "Quick Bites" |
| color | VARCHAR | Hex color auto-assigned from pool |
| pos_config_id | UUID FK → pos_config | |
| created_at | TIMESTAMP | |

### `tax_rates`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| label | VARCHAR | e.g. "5%", "18%", "28%" |
| rate | DECIMAL(5,2) | e.g. 5.00, 18.00, 28.00 |

> Note: Tax rates are seeded at system init (5%, 18%, 28%). Not user-editable.

### `products`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| pos_config_id | UUID FK → pos_config | |
| name | VARCHAR | |
| description | TEXT | |
| price | DECIMAL(10,2) | Base price |
| tax_rate_id | UUID FK → tax_rates | |
| uom | ENUM('kg','unit','liter') | Unit of measure |
| category_id | UUID FK → categories | |
| active | BOOLEAN | Soft delete flag |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `product_variants`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| product_id | UUID FK → products | |
| attribute_name | VARCHAR | e.g. "Pack" |
| value | VARCHAR | e.g. "6 items", "12 items" |
| unit | ENUM('kg','unit','liter') | Optional |
| extra_price | DECIMAL(10,2) | Added on top of base price |

### `customers`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | VARCHAR | |
| email | VARCHAR | |
| phone | VARCHAR | |
| street1 | VARCHAR | |
| street2 | VARCHAR | |
| city | VARCHAR | |
| state | VARCHAR | Free text with autocomplete |
| country | VARCHAR | |
| created_at | TIMESTAMP | |

### `orders`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| order_number | VARCHAR UNIQUE | Auto-generated e.g. "ORD-2205" |
| pos_session_id | UUID FK → pos_sessions | |
| pos_config_id | UUID FK → pos_config | |
| table_id | UUID FK → tables | null for mobile orders |
| customer_id | UUID FK → customers | Optional |
| status | ENUM('draft','paid','archived') | |
| notes | TEXT | Order-level notes |
| source | ENUM('pos','mobile') | How order was created |
| self_order_token | VARCHAR | Set if source = mobile |
| subtotal | DECIMAL(10,2) | Pre-tax total, computed |
| tax_total | DECIMAL(10,2) | Tax amount, computed |
| total | DECIMAL(10,2) | Final total incl. tax |
| is_invoice | BOOLEAN | Default false |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `order_lines`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| order_id | UUID FK → orders | |
| product_id | UUID FK → products | |
| product_name | VARCHAR | Snapshot at time of order |
| unit_price | DECIMAL(10,2) | Snapshot at time of order |
| tax_rate | DECIMAL(5,2) | Snapshot at time of order |
| uom | VARCHAR | Snapshot at time of order |
| qty | INTEGER | |
| discount | DECIMAL(5,2) | Percentage, default 0 |
| notes | TEXT | Line-item note (e.g. "Less Sugar") |
| subtotal | DECIMAL(10,2) | unit_price × qty before tax |
| total | DECIMAL(10,2) | subtotal + tax − discount |

### `order_line_variants`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| order_line_id | UUID FK → order_lines | |
| variant_id | UUID FK → product_variants | |
| attribute_name | VARCHAR | Snapshot |
| value | VARCHAR | Snapshot |
| extra_price | DECIMAL(10,2) | Snapshot |

### `payments`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| order_id | UUID FK → orders | |
| payment_method | ENUM('cash','digital','upi') | |
| amount | DECIMAL(10,2) | |
| paid_at | TIMESTAMP | |

### `kitchen_tickets`
This is the most cross-referenced real-time table in the system.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| order_id | UUID FK → orders | 1:1 with order |
| order_number | VARCHAR | Denormalized for quick display |
| pos_config_id | UUID FK → pos_config | For room namespacing |
| stage | ENUM('to_cook','preparing','completed') | Default 'to_cook' |
| sent_at | TIMESTAMP | When cashier clicked Send |
| updated_at | TIMESTAMP | Last stage change |

### `kitchen_ticket_items`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| kitchen_ticket_id | UUID FK → kitchen_tickets | |
| order_line_id | UUID FK → order_lines | |
| product_name | VARCHAR | Snapshot |
| qty | INTEGER | |
| prepared | BOOLEAN | Default false — strikethrough state |

### `self_order_tokens`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| table_id | UUID FK → tables | |
| pos_config_id | UUID FK → pos_config | |
| token | VARCHAR UNIQUE | Short URL slug e.g. "asdfgh" |
| active | BOOLEAN | |
| created_at | TIMESTAMP | |

---

## 6. Page-by-Page Data & Functionality

---

### 6.1 Login & Signup Page

**URL:** `/login`
**Access:** Public (no auth required)
**Layout:** Single centered card with two panels toggled — Login and Signup. No sidebar, no top nav.

#### Login Panel
**Data Inputs:**
- `Email/Username` — text input, required
- `Password` — password input with visibility toggle (eye icon), required

**On Submit:**
- POST `/auth/login` with `{ email, password }`
- Server validates credentials, issues JWT access token (short-lived, e.g. 15 min) and refresh token (long-lived, e.g. 7 days)
- Access token stored in memory (React state / context)
- Refresh token stored in httpOnly cookie
- On success → redirect to `/` (home / POS card list)
- On failure → show inline error "Invalid credentials"

#### Signup Panel
**Data Inputs:**
- `Name` — text input, required
- `Email/Username` — text input, required, must be unique
- `Password` — password input with visibility toggle, required, min 8 characters

**On Submit:**
- POST `/auth/signup` with `{ name, email, password }`
- Server hashes password with bcrypt, creates user record with role='admin' (first user) or role='cashier' (subsequent)
- Auto-login after signup (same token flow as login)
- On duplicate email → show "Email already registered"

**Toggle behavior:** "Sign Up here" link switches to signup panel. "Login" link switches back. No page reload — pure state toggle.

**DB Tables:** `users` (read on login, write on signup), `refresh_tokens` (write)

**API Endpoints:**
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

---

### 6.2 Home — POS Terminal Cards

**URL:** `/`
**Access:** Authenticated users
**Layout:** Top navigation bar + grid of POS terminal cards

#### Top Navigation
Links: `Orders`, `Products`, `Reporting`
Each link has a dropdown with sub-items:
- Orders → Orders, Payment, Customer
- Products → Products, Category
- Reporting → Dashboard

#### POS Terminal Card (one per pos_config record)
**Data Displayed per card:**
- POS name (e.g. "Odoo Cafe")
- `Last open` date (from most recent pos_session.opened_at)
- `Last sell` amount (from most recent pos_session.closing_sale_total)

**Card Actions:**
- `Open Session` button — validates no active session exists for this config, then POST `/pos-sessions` to create new session, redirect to POS terminal frontend at `/pos/:sessionId`
- 3-dot (kebab) menu with three options:
  - `Setting` → redirect to `/pos-config/:id/settings`
  - `Kitchen Display` → open `/kitchen-display/:configId` (typically in new tab)
  - `Customer Display` → open `/customer-display/:configId` (typically in new tab)

**+ New button (page header):**
Opens a modal popup with:
- `Name` field (text input, required)
- `Save` button → POST `/pos-config` → creates new pos_config record → card appears in grid
- `Discard` button → closes modal

**DB Tables:** `pos_config` (read list, write on new), `pos_sessions` (read last session per config, write on Open Session)

**API Endpoints:**
- `GET /pos-config` — list all terminals
- `POST /pos-config` — create new terminal
- `POST /pos-sessions` — open session

---

### 6.3 POS Settings Page

**URL:** `/pos-config/:id/settings`
**Access:** Admin only
**Layout:** Settings form with header showing POS name and + New button

#### Header
- Current POS name shown as heading
- `+ New` button → same modal as home page (creates new POS config)

#### Payment Method Section
Three toggleable payment types — each is a checkbox:

**Cash:**
- Checkbox `[✓] Cash`
- If enabled → Cash button appears at checkout
- No additional fields

**Digital (Bank, Card):**
- Checkbox `[✓] Digital (Bank, Card)`
- If enabled → Digital button appears at checkout
- No additional fields

**QR Payment (UPI):**
- Checkbox `[✓] QR Payment (UPI)`
- If enabled → UPI button appears at checkout AND reveals:
  - `UPI ID` text field (e.g. "123@ybl.com")
  - UPI ID is used to dynamically generate QR code at payment time
  - A preview QR image generated from the entered UPI ID is shown live

#### Self Ordering Section
- Master toggle checkbox `[✓] Self Ordering`
- If disabled → entire section below is hidden
- If enabled → reveals:
  - Mode dropdown: `Online ordering` | `QR Menu`
    - Online ordering: customers can browse AND place orders
    - QR Menu: customers can only browse (no ordering)
  - `Background` color picker (hex color for mobile splash screen bg)
  - Multi-image upload (thumbnails shown after upload, stored in Supabase Storage)
  - If mode = Online ordering: shows `Preview Webpage →` link and `Download QR code →` link
  - If mode = QR Menu: same two links but payment options are hidden

**Save/Discard:** Standard form save — PUT `/pos-config/:id` on save, reload data on discard.

**QR PDF Generation:**
- `Download QR code →` generates a PDF grid of all table QR codes
- Each QR code in the PDF encodes the URL: `[domain]/s/[table.qr_token]`
- QR codes are labeled with table number
- Server generates this PDF on demand via GET `/pos-config/:id/qr-pdf`

**DB Tables:** `pos_config` (read/write), `payment_methods` effectively stored in pos_config columns, `tables` (read for QR generation), `self_order_tokens` (read/write)

**API Endpoints:**
- `GET /pos-config/:id`
- `PUT /pos-config/:id`
- `GET /pos-config/:id/qr-pdf`
- `POST /storage/upload` (Supabase Storage for images)

---

### 6.4 Products List View

**URL:** `/products`
**Access:** Admin / Cashier (read), Admin (write)
**Layout:** Top search bar + action bar + data table

#### Table Columns (left to right)
1. Checkbox (for multi-select)
2. Product Name
3. Sale Price (formatted as currency)
4. Tax (e.g. "18%")
5. UOM (e.g. "Unit", "KG", "Liter")
6. Category (displayed as colored pill badge — color comes from category.color)

#### Search & Filter
- Search bar at top right — filters by product name (client-side or server-side)
- Category filter dropdown (optional)

#### Multi-Select Actions
- When one or more checkboxes are selected, an `Action` dropdown appears in the top bar showing "x N Selected"
- Action options:
  - `Archived` — soft delete (sets product.active = false). Available for any selected product.
  - `Delete` — hard delete. Permanent. Should show confirmation dialog.

#### Navigation
- Clicking any row → navigate to `/products/:id` (product detail page)
- `New` button top right → navigate to `/products/new` (blank product detail)

**DB Tables:** `products` (read), `categories` (read — for badge color), `tax_rates` (read — for display)

**API Endpoints:**
- `GET /products?search=&category_id=&page=&limit=`
- `PATCH /products/bulk-archive` body: `{ ids: [...] }`
- `DELETE /products/bulk-delete` body: `{ ids: [...] }`

---

### 6.5 Product Detail / Create View

**URL:** `/products/:id` or `/products/new`
**Access:** Admin
**Layout:** Page header with product name input + two tabs + Save/Discard buttons

#### Page Header
- Product name text input (large, prominent) — this is the primary identifier
- `Save` button (top right)
- `Discard` button (top right)

#### Tab 1: General Info
All fields in this tab:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Category | Dropdown | Yes | Populated from categories table |
| Product Description | Textarea | No | Free text |
| Prices | Number input | Yes | Base price in local currency |
| Tax | Dropdown | Yes | Options: 5%, 18%, 28% (from tax_rates table) |
| UOM | Dropdown | Yes | Options: KG, Unit, Liter |

#### Tab 2: Variants (Varint)
A dynamic table of variant rows. Each row represents one variant option:

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Attributes | Text input | Yes | e.g. "Pack", "Size" |
| Value | Text input | Yes | e.g. "6 items", "Large" |
| Unit | Dropdown | No | KG, Unit, Liter |
| Extra Prices | Number input | No | Added to base price when selected |
| (trash icon) | Button | — | Deletes this variant row |

- `New` link at bottom of table → adds a new empty row
- All variant rows are saved together with the product on Save

**On Save:**
- If new product → POST `/products` with body containing product fields + array of variants
- If existing → PUT `/products/:id` with same structure
- Variants are upserted: new rows inserted, existing rows updated, deleted rows removed

**DB Tables:** `products` (read/write), `categories` (read — dropdown), `product_variants` (read/write), `tax_rates` (read — dropdown)

**API Endpoints:**
- `GET /products/:id` (returns product + variants array)
- `POST /products`
- `PUT /products/:id`
- `DELETE /products/:id/variants/:variantId`

---

### 6.6 Categories Page

**URL:** `/categories`
**Access:** Admin
**Layout:** Simple list/card view

#### Data Displayed per Category
- Category name
- Colored pill badge (using category.color)
- Product count (number of active products in this category)

#### Operations
- `New` button → inline form or modal: enter name, color auto-assigned from a predefined pool (cycling through: blue, teal, coral, pink, amber, green, purple, red, gray)
- Click category name to edit inline
- Delete icon — removes category. If products exist under this category, show warning: "X products use this category. Reassign or delete them first."

**DB Tables:** `categories` (read/write), `products` (read — for count)

**API Endpoints:**
- `GET /categories`
- `POST /categories`
- `PUT /categories/:id`
- `DELETE /categories/:id`

---

### 6.7 Floors & Tables Management

**URL:** `/floors`
**Access:** Admin
**Layout:** Accordion or tab view — one section per floor, tables listed within

#### Floor Operations
- Create a floor: name input → POST `/floors`
- Rename a floor: inline edit
- Delete a floor: removes all tables too (with confirmation)

#### Table Operations (within each floor)
Each table row/card shows:
- Table number
- Seats count
- Active toggle switch
- Appointment resource (optional text field)
- QR token (read-only display, auto-generated)

Table CRUD:
- Add table button → inline form: table number, seats, active (default true)
- On creation → `qr_token` is auto-generated server-side as a short UUID slug (6-8 chars)
- `self_order_tokens` record is also created linking this table to its pos_config
- Edit table inline
- Delete table (with confirmation — will orphan orders if any exist)

#### QR Code Features
- Per-table: small QR code preview icon that shows the QR when hovered/clicked
- `Download QR PDF` button (floor-level) → generates a printable PDF with a grid of QR codes, one per table in that floor, each labeled with table number
- QR encodes: `https://[domain]/s/[table.qr_token]`

**DB Tables:** `floors` (read/write), `tables` (read/write), `self_order_tokens` (write on table create)

**API Endpoints:**
- `GET /floors` (returns floors with nested tables array)
- `POST /floors`
- `PUT /floors/:id`
- `DELETE /floors/:id`
- `POST /floors/:floorId/tables`
- `PUT /tables/:id`
- `DELETE /tables/:id`
- `GET /floors/:floorId/qr-pdf`

---

### 6.8 Orders List View (Backend)

**URL:** `/orders`
**Access:** Admin (full), Cashier (read own session's orders)
**Layout:** Filter bar + data table with multi-select

#### Table Columns
1. Checkbox
2. Order No (e.g. "ORD-2205")
3. Session (name of the pos_session this order belongs to)
4. Date (formatted datetime)
5. Total (final amount with tax, formatted as currency)
6. Customer (customer name, or blank if none assigned)
7. Status — colored badge: `Draft` (amber) or `Paid` (green)

#### Filters
- Search: by order number or customer name
- Status filter: All / Draft / Paid
- Session filter: dropdown of all sessions
- Date range filter: from/to date pickers

#### Multi-Select Actions
When rows are selected:
- Action dropdown shows "x N Selected"
- `Archived` — sets order.status = 'archived'. **Only available for Draft orders. Paid orders cannot be archived.**
- `Delete` — permanently deletes. **Only available for Draft orders. Paid orders cannot be deleted.**
- If user selects a mix of Draft and Paid, the action applies only to Draft ones, with a notice.

#### Navigation
- Row click → `/orders/:id` (order detail page)

**DB Tables:** `orders` (read/write), `pos_sessions` (read — session name), `customers` (read — customer name)

**API Endpoints:**
- `GET /orders?status=&session_id=&date_from=&date_to=&search=&page=`
- `PATCH /orders/bulk-archive` body: `{ ids: [...] }`
- `DELETE /orders/bulk-delete` body: `{ ids: [...] }`

---

### 6.9 Order Detail View (Backend)

**URL:** `/orders/:id`
**Access:** Admin, Cashier (own session orders)
**Layout:** Header + status toggle + two tabs + order summary

#### Header Data
- Order number (large heading)
- Date & time
- Session name (linked)
- Customer name (linked to customer record, if assigned)

#### Status Toggle
Two buttons side by side: `Draft` and `Paid`
- The active status button is highlighted
- Admin can manually toggle between states (for corrections)
- This writes `orders.status` directly

#### Tab 1: Product (Line Items Table)
Columns:
1. Product (linked to `/products/:id`)
2. QTY
3. Amount (unit price)
4. Tax (percentage)
5. UOM
6. Sub-Total (pre-tax line total: qty × unit_price)
7. Total (post-tax line total)

#### Tab 2: Extra Info
- Order-level notes
- Source (POS manual / Mobile self-order)
- Session details
- Any additional metadata

#### Order Summary Section (below table)
- `Total w/t Tax` — sum of all subtotals (pre-tax)
- `Tax` — total tax amount
- `Final Total` — grand total including tax

**DB Tables:** `orders` (read/write), `order_lines` (read), `products` (read — for name/UOM link), `payments` (read — show linked payments), `customers` (read)

**API Endpoints:**
- `GET /orders/:id` (returns order + order_lines + payments)
- `PATCH /orders/:id/status` body: `{ status: 'draft'|'paid' }`

---

### 6.10 Payments List View (Backend)

**URL:** `/payments`
**Access:** Admin
**Layout:** Grouped collapsible list

#### Grouping
Payments are grouped by payment method. Default view shows collapsed group headers:
- `> Cash` (Total: $X | N transactions)
- `> Digital` (Total: $X | N transactions)
- `> UPI` (Total: $X | N transactions)

Clicking a group header expands it to show individual transactions:
- Payment method
- Date & time
- Amount
- Order number (linked to order detail)

#### Filters
- Date range (from / to)
- Session filter

#### Export
- `Export PDF` button → generates PDF of current filtered view
- `Export XLS` button → generates Excel file of current filtered view

**DB Tables:** `payments` (read), `payment_methods` (via order.payment_method enum), `orders` (read — for order number link)

**API Endpoints:**
- `GET /payments?grouped=true&session_id=&date_from=&date_to=`
- `GET /payments/export?format=pdf|xls&session_id=&date_from=&date_to=`

---

### 6.11 Customers List View

**URL:** `/customers`
**Access:** Admin, Cashier (read)
**Layout:** Search bar + New button + data table

#### Table Columns
1. Name
2. Contact (email and phone stacked in one cell)
3. Total Sales (sum of all paid order totals for this customer, formatted as currency)

#### Actions
- `New` button → navigate to `/customers/new`
- Search bar → filter by name, email, or phone
- Row click → navigate to `/customers/:id`

**DB Tables:** `customers` (read), `orders` (read — aggregated sum for Total Sales, filtered by status='paid')

**API Endpoints:**
- `GET /customers?search=&page=`

---

### 6.12 Customer Detail / Create View

**URL:** `/customers/:id` or `/customers/new`
**Access:** Admin (full), Cashier (create only — from POS register Customer modal)
**Layout:** Form with two sections — Contact and Address

#### Contact Section
| Field | Type | Required |
|-------|------|----------|
| Name | Text input | Yes |
| Email | Email input | No |
| Phone | Tel input | No |

#### Address Section
| Field | Type | Notes |
|-------|------|-------|
| Street line 1 (St. 1) | Text input | |
| Street line 2 (St. 2) | Text input | |
| City | Text input | |
| State | Dropdown with autocomplete | All Indian states pre-loaded, autocomplete on type |
| Country | Dropdown | Country list |

**Actions:**
- `Save` → POST (new) or PUT (existing)
- `Discard` → back to list without saving
- Order history section below the form shows past orders for this customer

**DB Tables:** `customers` (read/write), `orders` (read — for order history section)

**API Endpoints:**
- `GET /customers/:id`
- `POST /customers`
- `PUT /customers/:id`

---

### 6.13 Reporting & Dashboard

**URL:** `/reporting/dashboard`
**Access:** Admin
**Layout:** Global filter bar + KPI cards row + two charts + three data tables

#### Global Filter Bar
Applied filters shown as removable tags (each has an X to remove):
- `Location/Branch` — dropdown selector (restaurant name / branch)
- `Duration` — dropdown: Today | Weekly | Monthly | 365 Days | Custom (custom shows date range picker)
- `Responsible` — staff/user filter (dropdown of users)
- `Sessions` — specific session filter
- `Product` — filter by specific product

When any filter changes, ALL widgets (KPI cards, charts, tables) re-query with the new filter parameters.

#### KPI Cards (3 cards in a row)
Each card shows:
- Metric name (label)
- Current period value
- Percentage change vs previous equivalent period
- Arrow indicator: green ↑ if positive, red ↓ if negative

| Card | Metric | Computation |
|------|--------|-------------|
| Total Orders | Count of orders in period | orders WHERE status='paid' AND date IN period |
| Revenue | Sum of order totals in period | SUM(orders.total) WHERE status='paid' |
| Average Order Value | Revenue ÷ Total Orders | Computed from above two |

#### Charts

**Sales Trend — Line Graph:**
- X axis: time (days if Today/Weekly, weeks if Monthly, months if 365 Days)
- Y axis: revenue in currency
- Each point represents revenue for that time bucket
- Title dynamically updates based on duration selection

**Top Selling Category — Pie Chart:**
- One slice per category
- Value: total revenue per category in selected period
- Legend shows category name and percentage (e.g. Pizza 45%, Burger 30%)

#### Data Tables

**Top Orders:**
- Highest-value individual paid orders in the period
- Columns: Order No | Date | Customer | Total

**Top Products:**
- Columns: Product | Qty Sold | Revenue

**Top Categories:**
- Columns: Category | Revenue

#### Export
- PDF export button and XLS export button appear near each table
- Export respects currently active filters

**DB Tables:** `orders` (aggregation), `order_lines` (aggregation), `payments` (aggregation), `products` (read — filter), `categories` (read — pie chart), `pos_sessions` (read — filter), `users` (read — responsible filter)

**API Endpoints:**
- `GET /reports/kpi?period=&date_from=&date_to=&session_id=&user_id=&product_id=`
- `GET /reports/sales-trend?period=&date_from=&date_to=`
- `GET /reports/category-breakdown?period=`
- `GET /reports/top-orders?period=&limit=`
- `GET /reports/top-products?period=&limit=`
- `GET /reports/top-categories?period=&limit=`
- `GET /reports/export?format=pdf|xls&type=orders|products|categories&[filters]`

---

### 6.14 POS Terminal — Floor View

**URL:** `/pos/:sessionId` (default view on session open)
**Access:** Cashier (within active session)
**Layout:** Full-screen POS UI — top bar + table grid

#### Top Navigation Bar
Left section: `Table` tab (active) | `Register` tab | `Orders` tab
Right section: Hamburger menu (≡) with dropdown:
- `Reload Data` — re-fetches all products, categories, and POS config from backend without closing session
- `Go to Back-end` — opens backend config in a new tab or navigates away
- `Close Register` — shows confirmation dialog → calls `POST /pos-sessions/:id/close` → redirects to `/` (home)

#### Floor View Content
- Grid of table cards, one per active table in the floor(s) configured for this POS config
- Each card shows: Table number (large)
- Card states:
  - Free: default styling
  - Occupied: has at least one Draft order linked to this table in the current session — different background color
- Clicking a free table → creates context for that table → navigates to Register screen with that table selected
- Clicking an occupied table → navigates to Register screen and loads existing Draft order for that table

**Data fetched on session open (Reload Data):**
- All active tables for this POS config (via floors → tables)
- All products (with categories, prices, tax, variants)
- POS config details (enabled payment methods, UPI ID)
- Active orders for current session (to determine occupied tables)

**DB Tables:** `tables` (read — active only), `floors` (read), `orders` (read — draft orders for this session to mark occupied), `pos_sessions` (read + write on close)

**API Endpoints:**
- `GET /pos/:configId/tables` (all active tables with floor info)
- `GET /pos/:configId/data` (products + config in one call — for Reload Data)
- `POST /pos-sessions/:id/close`

---

### 6.15 POS Terminal — Register (Order Screen)

**URL:** `/pos/:sessionId/register?table=:tableId`
**Access:** Cashier (within active session)
**Layout:** Split layout — left panel (products) + right panel (cart) + numpad below cart

#### Header
- Shows selected table number (e.g. "Table 6")
- Back arrow to floor view

#### Left Panel — Product Selection

**Category Filter Bar:**
- Pills/buttons for each category: `All` | `Quick Bites` | `Drinks` | `Dessert` (etc.)
- Default: All selected (shows all products)
- Clicking a category filters the product grid to only that category's products

**Search Bar:**
- Text input "Search product..."
- Filters product grid in real time by product name

**Product Grid:**
- Card per product showing: Product name + Price
- Clicking a product card → adds 1 unit to cart (or increments qty if already in cart)

#### Right Panel — Cart / Order Summary

**Line Items:**
Each line shows:
- Product name
- Quantity
- Unit price
- Line total
- Notes (if any, shown in smaller text below)
- Selected line item is highlighted

**Order Total:**
- Running total shown at bottom of cart

#### Numpad & Control Panel (below cart)
Number keys 0-9, +/- toggle, × (backspace/clear)

Action keys:
| Key | Behavior |
|-----|----------|
| `Qty` | Set the quantity of the currently selected line item |
| `Prices` | Override the unit price of selected line item |
| `Disc` | Apply a discount — enter % or flat amount |
| `Notes` | Type a text note for the selected line item (e.g. "Less Sugar") |
| `Customer` | Opens a modal to search existing customers or create a new one |

#### Bottom Action Buttons
- `Send Qty: N` — sends current order to Kitchen Display. The number (N) shows how many items are being sent. Triggers:
  1. POST `/orders/:id/send-to-kitchen`
  2. Server creates/updates `kitchen_tickets` record
  3. Server emits Socket.io event `new_ticket` or `update_ticket` to the room `pos_config_[configId]`
  4. Customer Display also receives cart update via Socket.io
- `Payment` — navigates to payment screen with current order loaded

**Order Creation Logic:**
- Order record is created in `orders` table when the first product is added to cart (not before)
- Subsequent product additions update the existing Draft order
- If user navigates back to floor view without adding products, no order record is created

**Socket.io Events Emitted from Register:**
- `cart_update` → sent to Customer Display room on every cart change (add/remove product, qty change)
- `send_to_kitchen` → sent when Send button clicked

**DB Tables:** `products` (read), `categories` (read), `orders` (read/write), `order_lines` (read/write), `kitchen_tickets` (write), `customers` (read — search modal)

**API Endpoints:**
- `GET /pos/:configId/products` (all active products with variants)
- `POST /orders` (create new order)
- `PUT /orders/:id` (update order — add/remove lines, apply discount)
- `POST /orders/:id/send-to-kitchen`
- `GET /customers?search=` (for customer assign modal)
- `POST /customers` (create customer from modal)

---

### 6.16 POS Terminal — Payment Screen

**URL:** `/pos/:sessionId/payment?order=:orderId`
**Access:** Cashier (within active session)
**Layout:** Full-screen payment UI

#### Payment Screen Layout

**Header:**
- "Payment" title
- Total amount due shown prominently in green (e.g. `$580.00`)

**Applied Payments List:**
- Shows payment entries already added (for split payment scenarios)
- Each entry: payment method icon | amount | X button to remove
- Example: `Cash  $12,000.00  [×]` and `Card  $1,659.42  [×]`
- Remaining amount updates dynamically as payments are applied

**Payment Method Buttons:**
Only shows buttons for payment methods that are enabled in pos_config:
- `Cash` button
- `Digital (Bank, Card)` button
- `UPI` button

**Clicking Cash:**
- Numpad appears to enter cash amount tendered
- Change calculated automatically: `change = cash_tendered − order_total`

**Clicking Digital:**
- Numpad appears to enter digital amount
- No external gateway — manual confirmation assumed

**Clicking UPI:**
- Opens UPI QR modal (see below)
- Simultaneously emits Socket.io event `show_upi_qr` to Customer Display room → Customer Display switches to State 2 (QR shown to customer)

**UPI QR Modal:**
- Title: "UPI QR"
- Displays: dynamically generated QR code image (generated from pos_config.upi_id + order total amount)
- Displays: Amount (`$580`)
- `Confirmed` button → records UPI payment, closes modal, remaining = 0
- `Cancel` button → closes modal, no payment recorded

**Other Options:**
- Checkbox `[ ] Is Invoice` — marks order as invoice (sets orders.is_invoice = true)

**Validate Button:**
- Enabled only when applied payment total ≥ order total
- On click:
  1. POST `/orders/:id/validate`
  2. Server creates payment records in `payments` table (one per applied method)
  3. Server sets `orders.status = 'paid'`
  4. Server emits Socket.io event `payment_complete` to Customer Display room → Customer Display switches to State 3 (thank you)
  5. Frontend shows Confirmation Screen

**Confirmation Screen:**
- Overlays the payment screen
- Shows: "Amount Paid $580"
- Buttons: `Email Receipt` | `Continue`
- `Email Receipt` → sends email to customer's email address (if customer assigned and has email) — stub/no-op for hackathon
- `Continue` → navigates back to floor view
- Clicking anywhere on the overlay → same as Continue (back to floor view)

**DB Tables:** `orders` (read + write status), `payments` (write), `pos_config` (read — UPI ID, enabled methods)

**API Endpoints:**
- `GET /pos/:configId/upi-qr?amount=` → returns QR code as base64 image or URL
- `POST /orders/:id/validate` body: `{ payments: [{ method, amount }, ...], is_invoice: bool }`

---

### 6.17 Kitchen Display System (KDS)

**URL:** `/kitchen-display/:configId`
**Access:** Kitchen Staff (read + stage updates), Admin
**Layout:** Full-screen KDS — top filter bar + sidebar + ticket grid

#### Top Bar
- Hamburger menu (minimal — maybe just POS name and session info)
- Stage filter tabs with counts:
  - `All` (total tickets)
  - `To Cook [7]` (newly received, not yet started)
  - `Preparing [3]` (in progress)
  - `Completed [2]` (done and ready)
- Search bar: "Search..." — searches by product name or order number
- Pagination indicator: `1-3 <>` — shows N tickets per page, navigate with arrows

#### Sidebar Filters
- `Clear Filter [×]` button — removes all active sidebar filters
- `Product` section: list of product names present in current visible tickets — click to filter
- `Category` section: list of category names present in current visible tickets — click to filter
- Note: sidebar filters are dynamic — only products/categories that appear in at least one visible ticket are shown

#### Ticket Cards (Main Grid)
Each order gets one ticket card:

**Ticket Header:**
- Order number (e.g. `#2205`) — this is the same as the order_number field in orders table

**Ticket Body:**
- List of items: `3 × Burger`, `2 × Pizza`, `1 × Coffee`
- Items that have been individually marked as prepared appear with strikethrough: ~~`3 × Water`~~

**Ticket Interactions:**
- Clicking the whole card (not a specific item) → advances the ticket to the next stage:
  - to_cook → preparing
  - preparing → completed
  - completed → stays (or could cycle back — define clearly in impl)
- Clicking a specific item within the ticket → toggles `kitchen_ticket_items.prepared` flag → renders strikethrough on that item
- Both actions are persisted to DB and broadcast via Socket.io to all KDS clients in the same room

#### Real-Time Behavior
- KDS subscribes to Socket.io room `pos_config_[configId]`
- Events received:
  - `new_ticket` → new ticket card appears at top of "To Cook" column
  - `update_ticket` → ticket card updates in place (stage change from another KDS screen)
  - `item_prepared` → individual item strikethrough updates

**DB Tables:** `kitchen_tickets` (read/write), `kitchen_ticket_items` (read/write), `order_lines` (read — item names), `orders` (read — order number), `products` (read — for sidebar filter)

**API Endpoints:**
- `GET /kitchen-tickets?config_id=&stage=&search=&page=&limit=`
- `PATCH /kitchen-tickets/:id/stage` body: `{ stage: 'preparing'|'completed' }`
- `PATCH /kitchen-tickets/:id/items/:itemId/prepared` body: `{ prepared: true|false }`

---

### 6.18 Customer Facing Display

**URL:** `/customer-display/:configId`
**Access:** Public (no auth — opened on a dedicated counter screen)
**Layout:** Full-screen two-pane layout — left static | right dynamic

#### Left Pane (Always Visible, Never Changes)
- Store logo (from pos_config settings or default)
- "Welcome to [Store Name]" (store name from pos_config.name)
- "Powered by Odoo" tagline

#### Right Pane — Three Dynamic States

**State 1: Ordering (default)**
Active when: cashier is on the register screen adding products

Displays a live cart table:
| Column | Description |
|--------|-------------|
| Item | Product name |
| Qty | Quantity |
| Price | Unit price |
| Sub-Total | Qty × Price |
| Tax | Tax amount for this line |
| Total | Sub-total + Tax |

Grand total row at bottom.

**State 2: UPI Payment**
Active when: cashier clicks UPI button on payment screen

Displays:
- Large QR code (same QR as shown to cashier)
- Amount to pay
- "Scan to Pay" instruction text

**State 3: Payment Complete (Success)**
Active when: cashier validates and completes payment

Displays:
- "Thank you for shopping with us."
- "See you again!"
- Auto-resets to State 1 (empty cart) after ~5 seconds

#### Real-Time Mechanism
- Page connects to Socket.io room `pos_config_[configId]` on load
- Events that trigger state changes:
  - `cart_update` → updates State 1 cart data in real time
  - `show_upi_qr` (with QR data + amount) → switches to State 2
  - `payment_complete` → switches to State 3, then auto-resets
- No user interaction possible on this screen — display only

**DB Tables:** `pos_config` (read — store name, logo), `orders` (read — via socket payload, not direct DB call)

**No additional API endpoints** — all data arrives via Socket.io events from the cashier's actions.

---

### 6.19 Mobile Self-Ordering (6 Screens)

**URL Base:** `/s/:token`
**Access:** Public — no authentication, identified by table QR token
**Tech:** Responsive React pages, mobile-optimized

#### Token Resolution (First Load)
- `GET /s/:token` → server looks up `self_order_tokens` where `token = :token`
- Returns: table_id, table_number, pos_config_id, pos_config settings (mode, bg_color, images)
- If token not found or inactive → show error page
- If `pos_config.self_ordering_mode = 'qr_menu'` → show menu only, hide all ordering/cart functionality

---

#### Screen 1: Splash / Home
**Data Consumed:**
- pos_config.bg_color (background)
- pos_config_images (carousel/background images)
- Store logo

**UI Elements:**
- Full-screen background (image or color)
- Auto-scrolling splash animation
- Store logo centered
- `Order Here` button

**Action:** Tap "Order Here" → navigate to Screen 2 (Product Menu)

---

#### Screen 2: Product Menu
**Data Consumed:**
- `GET /s/:token/menu` → returns all active products with categories, prices, variants

**UI Elements:**
- Top bar: Back button | Search bar
- Scrollable category pills (Quick Bites, Drinks, Dessert)
- Product grid: cards with product name + price
- Bottom bar (persistent): total QTY | Total $ amount | `Next` button

**Actions:**
- Tap product card → navigate to Screen 3 (Customization) for that product
- Tap category pill → filter grid
- Search bar → filter by name
- Bottom `Next` → navigate to Screen 4 (Cart) if cart is not empty

---

#### Screen 3: Product Customization
**Data Consumed:**
- Product name, price, image
- Product variants (from `product_variants` table)
- Add-ons if defined

**UI Elements:**
- Back button | Product image | Product name | Base price
- Variants section (exclusive selection — radio buttons):
  - Each variant shows: attribute name, value, extra price (e.g. "+$2")
  - Only one variant selectable at a time per attribute group
- Add-ons section (multi-select — checkboxes):
  - e.g. `[ ] Extra Cheese`, `[ ] Extra Sauce`, `[ ] Wheat bun`
- Quantity adjuster: `−` | count | `+`
- Running total price shown dynamically
- `Next` button (bottom)

**Action:** Tap Next → adds item with selected variants/add-ons to cart state → navigate to Screen 2 (continue browsing) or Screen 4 (if Next from cart bottom bar)

---

#### Screen 4: Cart / Payment Summary
**Data Consumed:**
- Cart state (in React state — all items added so far)
- Each item: product name, applied variants, notes, qty, line total

**UI Elements:**
- Header: Back button | "Payment" title
- Line items list:
  - Product name
  - Variant selection shown (e.g. "Cheese Burger")
  - Notes if any (e.g. "Note: sauce")
  - Qty adjuster `− N +`
  - Line total price
- Grand total in bottom bar
- `Confirmed` button

**Action — Confirmed:**
- POST `/s/:token/order` with cart payload:
  ```json
  {
    "items": [
      {
        "product_id": "...",
        "qty": 2,
        "notes": "Less sugar",
        "variants": ["variant_id_1"],
        "addons": ["variant_id_2"]
      }
    ]
  }
  ```
- Server creates `orders` record (source='mobile', self_order_token=token)
- Server creates `order_lines` records
- Server creates `order_line_variants` records
- Server creates `kitchen_tickets` record (stage='to_cook') automatically
- Server emits Socket.io `new_ticket` event to KDS room
- Server returns `{ order_id, order_number }`
- Navigate to Screen 5

---

#### Screen 5: Order Confirmation
**Data Consumed:**
- order_number (from server response)
- order total (from cart state)

**UI Elements:**
- Large green checkmark icon
- Order number (e.g. `#2205`)
- "Order Confirmed" text
- Total Amount (e.g. `$350`)
- `Track My Order` button

**Action:** Tap "Track My Order" → navigate to Screen 6 with order_id

---

#### Screen 6: Order History & Tracking
**URL:** `/s/:token/track/:orderId`

**Data Consumed:**
- `GET /s/:token/orders/:orderId/status` → returns current kitchen_ticket.stage
- Supabase Realtime subscription on `kitchen_tickets` table WHERE `order_id = :orderId`

**UI Elements:**
- Header: "Order History" title | Back button
- Order entry: Order number (e.g. `#1205`)
- Status pill (live updating):
  - `To Cook` — pink/rose background
  - `Preparing` — purple background
  - `Completed` — orange/amber background

**Real-Time Behavior:**
- Page subscribes to Supabase Realtime on the `kitchen_tickets` table for this specific order
- When kitchen staff advances the stage on KDS → this page automatically updates the status pill without any user action

**DB Tables:** `self_order_tokens` (read — token resolution), `products` (read — menu), `categories` (read — filter pills), `product_variants` (read — customization), `orders` (write — on confirm), `order_lines` (write), `order_line_variants` (write), `kitchen_tickets` (write on order creation, read for tracking), `kitchen_ticket_items` (write)

**API Endpoints:**
- `GET /s/:token` (resolve token)
- `GET /s/:token/menu` (products + categories)
- `POST /s/:token/order` (submit order)
- `GET /s/:token/orders/:orderId/status` (current status)

---

## 7. API Endpoints — Complete List

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | Login, get tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Revoke refresh token |

### POS Config
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pos-config` | List all POS terminals |
| POST | `/pos-config` | Create new terminal |
| GET | `/pos-config/:id` | Get single config |
| PUT | `/pos-config/:id` | Update config |
| GET | `/pos-config/:id/qr-pdf` | Download QR PDF |

### POS Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/pos-sessions` | Open new session |
| POST | `/pos-sessions/:id/close` | Close session |
| GET | `/pos-sessions/:id` | Get session info |

### Floors & Tables
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/floors` | List floors with tables |
| POST | `/floors` | Create floor |
| PUT | `/floors/:id` | Update floor |
| DELETE | `/floors/:id` | Delete floor |
| POST | `/floors/:id/tables` | Add table to floor |
| GET | `/floors/:id/qr-pdf` | Download floor QR PDF |
| PUT | `/tables/:id` | Update table |
| DELETE | `/tables/:id` | Delete table |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List products (with filters) |
| POST | `/products` | Create product |
| GET | `/products/:id` | Get product with variants |
| PUT | `/products/:id` | Update product |
| PATCH | `/products/bulk-archive` | Archive multiple |
| DELETE | `/products/bulk-delete` | Delete multiple |
| DELETE | `/products/:id/variants/:vid` | Delete single variant |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | List categories |
| POST | `/categories` | Create category |
| PUT | `/categories/:id` | Update category |
| DELETE | `/categories/:id` | Delete category |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | List customers (searchable) |
| POST | `/customers` | Create customer |
| GET | `/customers/:id` | Get customer detail |
| PUT | `/customers/:id` | Update customer |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | List orders (filterable) |
| POST | `/orders` | Create new order |
| GET | `/orders/:id` | Get order with lines |
| PUT | `/orders/:id` | Update order lines |
| PATCH | `/orders/:id/status` | Change status |
| POST | `/orders/:id/send-to-kitchen` | Send to KDS |
| POST | `/orders/:id/validate` | Complete payment |
| PATCH | `/orders/bulk-archive` | Archive Draft orders |
| DELETE | `/orders/bulk-delete` | Delete Draft orders |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payments` | List payments (grouped) |
| GET | `/payments/export` | Export PDF or XLS |

### POS Terminal Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pos/:configId/data` | All products + config (Reload Data) |
| GET | `/pos/:configId/tables` | Active tables for this config |
| GET | `/pos/:configId/upi-qr` | Generate UPI QR code image |

### Kitchen Display
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/kitchen-tickets` | List tickets (filterable) |
| PATCH | `/kitchen-tickets/:id/stage` | Advance stage |
| PATCH | `/kitchen-tickets/:id/items/:iid/prepared` | Toggle item prepared |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/kpi` | KPI metrics |
| GET | `/reports/sales-trend` | Sales over time data |
| GET | `/reports/category-breakdown` | Pie chart data |
| GET | `/reports/top-orders` | Highest value orders |
| GET | `/reports/top-products` | Best selling products |
| GET | `/reports/top-categories` | Best performing categories |
| GET | `/reports/export` | PDF or XLS export |

### Mobile Self-Ordering
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/s/:token` | Resolve token → table + config |
| GET | `/s/:token/menu` | Products + categories |
| POST | `/s/:token/order` | Submit mobile order |
| GET | `/s/:token/orders/:orderId/status` | Get order status |

---

## 8. Real-Time Architecture (Socket.io)

### Room Structure
Every real-time event is scoped to a Socket.io room named `pos_config_[configId]`. This ensures events from one POS terminal do not leak to another.

### Who Connects to What Room

| Client | Room | Role |
|--------|------|------|
| POS Register (cashier) | `pos_config_[configId]` | Emitter |
| POS Payment Screen | `pos_config_[configId]` | Emitter |
| Kitchen Display | `pos_config_[configId]` | Listener + Emitter |
| Customer Display | `pos_config_[configId]` | Listener only |

### Events

| Event Name | Direction | Payload | Trigger |
|------------|-----------|---------|---------|
| `cart_update` | Register → Customer Display | `{ order_lines, subtotal, tax, total }` | Any cart change |
| `send_to_kitchen` | Register → KDS | `{ ticket }` | Cashier clicks Send |
| `new_ticket` | Server → KDS | `{ kitchen_ticket with items }` | POST /orders/:id/send-to-kitchen |
| `update_ticket` | KDS → All KDS clients | `{ ticket_id, stage }` | Stage change |
| `item_prepared` | KDS → All KDS clients | `{ ticket_id, item_id, prepared }` | Item strikethrough |
| `show_upi_qr` | Payment → Customer Display | `{ qr_image_base64, amount }` | Cashier clicks UPI |
| `payment_complete` | Server → Customer Display | `{ order_id }` | POST /orders/:id/validate |

### Mobile Order Tracking — Supabase Realtime
Mobile Screen 6 uses Supabase Realtime (not Socket.io) to subscribe to changes in the `kitchen_tickets` table. When kitchen staff changes a ticket's stage, Supabase broadcasts a Postgres change event, which the mobile browser receives and uses to update the status pill.

```javascript
// Mobile tracking subscription
supabase
  .channel('order-tracking')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'kitchen_tickets',
    filter: `order_id=eq.${orderId}`
  }, (payload) => {
    setStage(payload.new.stage);
  })
  .subscribe();
```

---

## 9. Business Logic & Rules

### Order Lifecycle
```
(empty) → Draft → Paid → [Archived]
                 ↑
          (Mobile orders start here too)
```
- Draft: order is being built, not yet paid
- Paid: payment validated, immutable
- Archived: soft-hidden, not deleted, only from Draft
- Only Draft orders can be: Archived, Deleted, or have lines modified
- Paid orders are read-only

### Payment Rules
- An order can have multiple payment entries (split payment)
- Sum of all payment entries must equal or exceed order total before Validate is enabled
- UPI payment requires manual `Confirmed` click — no external API verification
- Cash payment calculates change automatically (`cash_tendered − total`)
- Each payment entry creates one row in `payments` table
- `payments` table records which method was used and exact amount

### Session Rules
- Only one active session allowed per `pos_config` at a time
- Attempting to open a session when one exists → show error/warning
- Closing a session: sets `closed_at`, computes `closing_sale_total` (sum of all Paid orders in session)
- After session close, all POS terminal access requires opening a new session

### Tax Computation
- Tax is computed per order line: `tax_amount = (unit_price × qty × tax_rate) / 100`
- Discount applied before tax: `taxable_amount = unit_price × qty × (1 − discount/100)`
- Order totals: `subtotal = sum(taxable_amounts)`, `tax = sum(tax_amounts)`, `total = subtotal + tax`
- All price/tax values are snapshots stored in `order_lines` at time of order creation (product price changes don't affect existing orders)

### QR Token Rules
- One token per table, generated on table creation
- Tokens are short slugs (6-8 chars) using URL-safe characters
- Tokens are globally unique (across all tables, all configs)
- A token resolves to exactly one table and one pos_config
- If self_ordering_enabled is false → token URL shows "Ordering unavailable" page

### Kitchen Ticket Rules
- One kitchen ticket per order (1:1 relationship)
- Ticket is created when cashier clicks Send, OR when mobile order is submitted
- Stage progression is one-way: to_cook → preparing → completed (no reversal in normal flow)
- Item-level "prepared" flag is independent of ticket stage (can mark items before advancing stage)
- Ticket number = order number (for coordination between cashier and kitchen)

### Category Color Assignment
When a new category is created without specifying a color, the server cycles through a predefined color pool:
`['#378ADD', '#1D9E75', '#D85A30', '#D4537E', '#EF9F27', '#639922', '#7F77DD', '#E24B4A', '#888780']`
Colors are assigned in order, cycling back to start when exhausted.

---

## 10. End-to-End Flow

### Standard POS Flow (Cashier → Kitchen → Payment)

```
1. Admin logs in
2. Admin configures: products, categories, payment methods, floors, tables
3. Admin opens POS session from terminal card ("Open Session")
4. Cashier sees floor view with all active tables
5. Cashier selects Table 6 (navigates to Register)
6. Cashier clicks product cards (Burger, Pizza, Coffee) → added to cart
7. Cashier optionally: adds notes, sets qty via numpad, assigns customer
8. Cashier clicks "Send" → order appears on KDS as "To Cook" ticket
9. Kitchen staff sees ticket on KDS, starts preparing
10. Kitchen staff clicks ticket → moves to "Preparing"
11. Kitchen staff clicks individual items to mark prepared (strikethrough)
12. Kitchen staff clicks ticket again → moves to "Completed"
13. Cashier clicks "Payment" → payment screen loads with total
14. Cashier clicks "Cash" → enters amount → clicks "Validate"
15. Order status → Paid, Payment records created
16. Confirmation screen appears → cashier clicks Continue
17. Returns to floor view. Table 6 is now Free.
```

### UPI Payment Flow (Special)
```
13b. Cashier clicks "UPI" on payment screen
14b. UPI QR modal opens with QR + amount
     Simultaneously: Customer Display switches to QR state
15b. Customer scans QR on their phone and pays
16b. Cashier clicks "Confirmed" in the modal
17b. Validate button becomes enabled → cashier clicks Validate
18b. Customer Display switches to "Thank you" state
19b. Confirmation screen → Continue → floor view
```

### Mobile Self-Ordering Flow
```
1. Customer at Table 3 scans QR code from table card
2. Phone browser opens: domain.com/s/[token]
3. Splash screen loads (branded with store colors/images)
4. Customer taps "Order Here"
5. Product menu loads — customer browses by category
6. Customer taps "Burger" → customization screen
7. Customer selects "Chicken Burger" variant, checks "Extra Cheese"
8. Customer taps Next → back to menu, continues browsing
9. Customer opens cart (bottom bar) → reviews items → taps "Confirmed"
10. Server creates order (source='mobile'), auto-creates kitchen ticket
11. KDS receives new ticket via Socket.io → appears as "To Cook"
12. Customer sees confirmation screen with order #2205
13. Customer taps "Track My Order"
14. Tracking screen shows "To Cook" → updates live as kitchen advances stages
```

---

## 11. Security Requirements

### Authentication
- All backend API routes (except `/auth/*` and `/s/:token/*`) require valid JWT access token in `Authorization: Bearer [token]` header
- Refresh tokens stored as httpOnly cookies, never accessible to JavaScript
- Access tokens short-lived (15 minutes), refresh tokens long-lived (7 days) with rotation
- Refresh token rotation: each use invalidates the current token and issues a new one

### Authorization (Role-Based Access Control)
- Middleware checks `user.role` against required role for each route
- Admin routes: `/pos-config`, `/floors`, `/categories`, `/reports/*` — Admin only
- Cashier routes: `/orders` (own session), `/pos/:sessionId/*` — Cashier + Admin
- Kitchen routes: `/kitchen-tickets` — Kitchen + Admin (read + stage updates only)
- Mobile routes: `/s/:token/*` — Public, no auth required

### Input Validation
- All inputs validated server-side using a validation library (e.g. Joi or Zod)
- Price fields: must be positive numbers, max 2 decimal places
- Email fields: RFC 5321 format validation
- UPI ID: format validation (contains @)
- Text fields: max length enforced, HTML stripped to prevent XSS
- Enum fields: validated against allowed values

### Rate Limiting
- `/auth/login` and `/auth/signup`: max 10 requests per IP per 15 minutes
- `/s/:token/order`: max 5 orders per token per hour

### CORS
- Configured to allow only the deployed frontend domain
- Credentials (cookies) allowed from frontend origin only

### SQL Injection
- Supabase client uses parameterized queries internally — never use raw string interpolation in queries

### WebSocket Security
- Socket.io connections require a valid JWT token passed in the connection handshake query: `socket.handshake.auth.token`
- Server validates token on connection. Invalid token → connection refused.
- Rooms are namespaced by `pos_config_id` to prevent cross-terminal event leakage.

### Secrets Management
All secrets in environment variables, never committed to source control:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
PORT=
FRONTEND_URL=
```

### Data Integrity
- `orders.status = 'paid'` is a terminal state — no route allows reverting to Draft except explicit admin override endpoint
- Paid orders: no line item modifications allowed server-side
- QR tokens: validated as active before processing any mobile order
- Session validation: all POS terminal actions verify session is still active (not closed) before processing

---

*End of Odoo POS Cafe Complete Context Document*
*Total pages covered: 19 | Total DB tables: 18 | Total API endpoints: 55+*