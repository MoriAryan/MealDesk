# MealDesk: Odoo POS Cafe ☕️

**A lightning-fast, production-ready Point of Sale system built from scratch in 24 hours.**

We built this for the **Odoo × Indus University Hackathon**. The challenge was massive: architect a complete restaurant POS workflow—from a cashier at the register ringing up an order, to a live ticket board in the kitchen, down to final payment and analytics. We didn't want to just string together a mock UI that "looked" like it worked. We wanted to build a real, breathing system.

So we built MealDesk.

---

## 📖 The Story

When looking at modern cafe POS systems, we noticed they generally fall into two camps: overwhelmingly complex legacy software, or pretty but utterly simplified iPad apps that fall apart under the rush of a Friday night service. 

We wanted the sweet spot. An interface that feels premium, tactile, and instantly responsive, backed by rigid data structures specifically designed to handle peak restaurant hours. 

We threw out the templates and scaffolding tools. Instead, we manually wrote every screen, every REST endpoint, and every database relationship over a single, heavily caffeinated 24-hour sprint. 

---

## ✨ Features (What it actually does)

This is not a prototype filled with fake state. Every interaction talks to a live PostgreSQL database, meaning orders actually flow from the front-of-house to the kitchen in real-time.

**Front of House (Cashier Flow)**
- **Interactive Floor Plan**: A custom-built, interactive 3D layout view. Cashiers can visually tap on Level 1, 2, or 3, pick a table, and open a POS session instantly.
- **Smart POS Terminal**: Tap products to add them to the cart. If an image is missing, the system dynamically generates a beautiful, vibrant fallback icon based on the item's name. It seamlessly handles item variants and automatically calculates precise tax rates.
- **Frictionless Checkout**: Flow through Cash, Digital, or UPI payments. Selecting UPI generates a live, immediately scannable QR code encoded with the total amount.

**Back of House (Kitchen Flow)**
- **Live KDS (Kitchen Display System)**: The second the cashier taps "Send to Kitchen", the ticket lands on the kitchen's digital board. Chefs can advance tickets through *To Cook* → *Preparing* → *Completed*.

**Back Office (Manager Flow)**
- **Analytics Dashboard**: Real-time sales tracking, generating beautiful charts and reports that can be dynamically filtered and exported to PDF/XLS.
- **Menu & Floor Routing**: Total control over creating products, configuring categories, establishing floor capacities, and registering actual terminal hardware.

---

## 🛠 Under the Hood

We kept the stack deliberate, modern, and type-safe to ensure that when the cashier taps "Pay", things don't break.

- **Frontend:** React 19 + TypeScript, styled completely with Tailwind CSS v4. We used Framer Motion to craft premium, buttery-smooth animations—like the converging restaurant icons on the login splash screen and the interactive 3D floor states.
- **Backend:** Node.js + Express v5. Fast, lightweight, and written explicitly for this system.
- **Database:** PostgreSQL (via Supabase). We bypassed ORMs and wrote the raw SQL schemas to maintain absolute control over the dense relationships between `pos_sessions`, `orders`, `order_lines`, and `employees`.
- **Security:** We implemented hand-rolled, HTTP-only JWT authentication with strict role-based access control (Admin vs Staff).

---

## 🚀 Running it yourself

Want to see it breathe? Here is how to spin it up locally. You'll need Node.js and a Supabase (PostgreSQL) instance.

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Open .env and fill in your Supabase URL, API keys, JWT secrets, and FRONTEND_URL
npm install
npm run dev
```

### 2. Frontend Setup (Keep backend running in a separate terminal)
```bash
cd frontend
cp .env.example .env
# Make sure VITE_API_BASE_URL points to your backend (default is http://localhost:4000/api)
npm install
npm run dev
```

### 3. Database Migration & Seeding
From your Supabase SQL Editor, run the `schema.sql` file to build the massive table relations. Then, seed it the initial data directly from your backend terminal:
```bash
cd backend
npm run db:seed
```

*(Note: Ensure you've also run the explicit `ALTER TABLE public.products ALTER COLUMN image_url TYPE TEXT;` SQL command from the Supabase dashboard to support long CDN image URLs).*

---

## The Team

| Role | Name |
|------|------|
| Team Leader | Mori Aryan |
| Member | Aftab |
| Member | Matin |

*Built for the Odoo × Indus University Hackathon — 2026*
