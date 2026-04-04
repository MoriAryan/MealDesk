# Odoo POS Cafe - Phase 1 Setup

## What is included
- Monorepo structure with `backend` and `frontend`
- Express backend foundation with Supabase config
- JWT auth and refresh-token middleware skeletons
- Full Phase 1 SQL schema and seed data for core entities
- React + Tailwind frontend shell with route placeholders

## Manual steps required from you
1. Create a Supabase project.
2. Copy `backend/.env.example` to `backend/.env` and fill in all values.
3. Copy `frontend/.env.example` to `frontend/.env` and fill in values.
4. Get your Supabase Postgres connection string and set `SUPABASE_DB_URL` in `backend/.env`.

## Run order
1. `npm --prefix backend run db:migrate`
2. `npm --prefix backend run db:seed`
3. `npm --prefix backend run dev`
4. `npm --prefix frontend run dev`

## Expected checks
- `GET http://localhost:4000/api/health` should return API and Supabase status.
- Frontend should load and show navigation to Dashboard, Settings, POS Terminal, Kitchen Display, Customer Display, Self Ordering, and Reports.
