# Pagevoo — Milestone 1 Starter (CSS Components)

This starter uses **plain CSS (design tokens + small utilities + CSS Modules)** instead of Tailwind.

## Quickstart (Dev)

### Backend
1. Create MySQL DB `pagevoo_core` (or edit `backend/config/.env`).
2. Import `backend/migrations/001_core_schema.sql` and `002_packages_seed.sql`.
3. Copy `backend/config/.env.example` to `backend/config/.env` and edit.
4. Run: `php -S localhost:8000 -t backend/public`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`
4. Open http://localhost:5173

Dev bypass is enabled: email verification + 2FA are skipped unless `APP_ENV=production`.
