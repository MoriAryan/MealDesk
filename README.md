# Odoo POS Cafe

Built for the **Odoo × Indus University Hackathon** — a 24-hour sprint to prototype a production-grade restaurant Point of Sale system on top of Odoo's ecosystem.

---

## The Team

| Role | Name |
|------|------|
| Team Leader | Mori Aryan |
| Member | Aftab |
| Member | Matin |

---

## What is this?

A full-stack POS (Point of Sale) system designed for cafes and restaurants. The idea was to cover the complete order lifecycle — from a customer sitting down at a table, to the kitchen getting the ticket, to the payment going through, all visible in real time.

We built it from scratch in one day. It is not a demo with fake data — everything talks to a real database, orders actually flow to the kitchen display, and payments actually get recorded.

---

## What it can do

**For the cashier at the register:**
- Open a session and pick a table from the floor plan
- Browse products by category, add them to the cart
- Send the order to the kitchen with one tap
- Collect payment — cash, card/digital, or UPI QR code (generates a live QR from the saved UPI ID)
- Customer-facing display updates automatically during checkout

**For the kitchen:**
- Live ticket board — new orders land here the moment the cashier hits Send
- Move tickets through stages: To Cook → Preparing → Completed
- Mark individual items as done

**For management:**
- Product and category management
- Payment method configuration (enable/disable cash, digital, UPI)
- Floor plan editor — create floors, add tables
- POS terminal setup and session control
- Reports dashboard with filters by date, session, staff, or product
- Export to PDF / XLS

---

## Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router v7
- Recharts (reports)
- jsPDF (export)

**Backend**
- Node.js + Express v5
- PostgreSQL (via Supabase)
- JWT authentication
- bcrypt

---

## Running locally

You need Node.js and a Supabase (PostgreSQL) instance. Copy the env files and fill in your credentials.

```bash
# Backend
cd backend
cp .env.example .env
# fill in your Supabase URL, DB connection string, JWT secret
npm install
npm run dev

# Frontend (separate terminal)
cd frontend
cp .env.example .env
# fill in VITE_API_URL pointing to your backend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:3000`.

To seed the database with initial data:
```bash
cd backend
npm run db:migrate
npm run db:seed
```

---

## Project structure

```
Odoo-POS-Cafe/
├── frontend/          # React app
│   └── src/
│       ├── pages/     # All page-level components
│       │   └── pos/   # POS terminal views (Floor, Register, Payment)
│       ├── layouts/   # App shell + POS terminal layout
│       ├── api/       # API client functions
│       ├── auth/      # Auth context + protected routes
│       └── components/
├── backend/           # Express API
│   └── src/
│       ├── routes/    # REST endpoints
│       └── server.js
└── supabase/
    └── migrations/    # SQL schema
```

---

## Hackathon context

This was submitted as part of the **Odoo × Indus University Hackathon**. The problem statement asked teams to build a complete restaurant POS flow — covering backend configuration, a live terminal, kitchen display, customer display, payment processing, and reporting — in 24 hours.

We chose to go fully custom rather than scaffolding off a template. Every screen, every API route, and the database schema was written during the hackathon window.

---

*Odoo × Indus University Hackathon — 2026*
