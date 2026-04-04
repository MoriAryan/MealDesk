# Detailed Implementation Plan: Fully Working POS Prototype

This detailed plan meticulously outlines how we will construct the remaining "POS Frontend Experience" from scratch, fulfilling the complete hackathon end-to-end flow. As requested, we will focus heavily on UI flow, states, and the POS functionality itself, while keeping payments as "dummy" frontend validations and excluding the optional self-ordering token flow.

## 1. Top-Level State Management
To ensure a smooth prototype without overly complex global stores, the POS session will manage states locally within a master `<PosTerminalLayout />` component that acts as the shell.

**Key States to track:**
- `activeTableId` (determines if we show Floor View or Order Screen)
- `cartItems` (array of items assigned to the active table)
- `currentView` (enum: `"FLOOR" | "REGISTER" | "PAYMENT"`)

## 2. Layouts and Top Menu (B1)
We will create a specialized full-screen layout overriding the default App layout specifically for the `/pos` route.

### **[NEW] `frontend/src/layouts/PosTerminalLayout.tsx`**
- **Top Navigation Bar:**
  - Left Side: Static "Table" and "Register" toggle tabs.
  - Right Side Actions:
    - **Reload Data:** Refreshes the local products array.
    - **Go to Back-end:** Navigates back to the Admin `/` dashboard.
    - **Close Register:** Ends session, clears carts, goes back to `/`.

## 3. Floor View / Table Plan (B2)
### **[NEW] `frontend/src/pages/pos/FloorView.tsx`**
- A responsive CSS Grid layout displaying Tables.
- Each table is rendered as a square, clickable card.
- **Details per card:** Table Name (e.g., "Table 3"), Seats (e.g., "4 Seats").
- **Action:** Clicking a table updates `activeTableId` in the layout state and automatically changes `currentView` to `"REGISTER"`.

## 4. The Order / Register Screen (B3)
### **[NEW] `frontend/src/pages/pos/RegisterView.tsx`**
This screen is horizontally split into two main sections:

#### **Left Pane: Product Grid**
- **Categories Bar:** Horizontal scrollable pill-buttons mapping to the categories you created in the admin panel.
- **Product Cards:** Grid of products mapping to the active category. Includes: Product Name, Sale Price, and base Unit of Measure (UOM).
- **Action:** Clicking a product appends it to the `cartItems` state.

#### **Right Pane: Active Cart (Order Lines)**
- **Header:** Displays the currently selected Table (e.g., "Order for Table 3").
- **Lines List:** Renders the appended `cartItems`. Each line shows: 
  - Product Name
  - `+` and `-` buttons to adjust quantity.
  - Subtotal for that specific line.
- **Footer Section:**
  - **Metrics:** Display standard subtotal, calculated Tax amount (from the product's tax rate), and the massive **Total**.
  - **Action 1: [Send]** – Flushes the current cart items via API call to `POST /api/kitchen/tickets`, which pushes the items into the realistic `To Cook` column of the Kitchen Display.
  - **Action 2: [Payment]** – Switches `currentView` to `"PAYMENT"`.

## 5. Payment Flow & Dummy Validations (B4 & B5)
### **[NEW] `frontend/src/pages/pos/PaymentView.tsx`**
A dedicated screen split showing the final bill and the payment method selection.

- **Left Pane:** A static list of available Payment Methods fetched from the terminal's config (Cash, Digital, UPI).
- **Right Pane (Dynamic):**
  - **If Cash/Digital:** Shows a numpad (optional) or just a massive "Amount Due" and a **[Validate]** button.
  - **If UPI QR (Special Flow):** Renders a mock QR Code graphic, the destination UPI ID (e.g., `merch@ybl`), the total amount, and two buttons: **[Confirmed]** and **[Cancel]**.
- **Post-Payment Action:** Clicking "Validate" or "Confirmed" immediately clears the `cartItems`, removes the `activeTableId`, briefly flashes a "Confirmation" overlay, and transitions the user back to the **Floor View**.

## 6. Integrations (A7 & B6)

### **Kitchen Display Connectivity**
- You already have the polling mechanism built. We will simply ensure the `Send` button accurately sends down an array of item names and quantities mapped precisely to the `kitchen_tickets` table format so it instantly renders in the "To Cook" lane.

### **Customer Display (Simplified Polling)**
- **[MODIFY] `frontend/src/pages/CustomerDisplayPage.tsx`**
- Will use a simple `setInterval` to fetch the 'latest active cart items' associated with the active terminal. It will cleanly render the checkout list and the "Total Due" text.
