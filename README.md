# AI Booking Frontend

This is the React + Vite frontend for the AI Booking application. It connects to the Flask backend for authentication, public booking pages, customer bookings, business calendar data, staff/resources, settings, dashboard metrics, and AI slot recommendations.

## Prerequisites

- Node.js 18 or newer
- npm
- Python 3.11 or newer for the backend API

## First-Time Setup

Run these commands from the project root.

1. Install frontend dependencies:

   ```bash
   npm install
   ```

2. Create the local environment file if it is not already present:

   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```

   The frontend reads this value from `.env`. If it is missing, `src/lib/api.ts` falls back to `http://localhost:5000`.

3. Set up the backend once:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r app/requirements.txt
   ```

   On macOS or Linux:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r app/requirements.txt
   ```

## Start The Application

Use two terminals.

### Terminal 1: Backend API

```bash
python -m app.main
```

The backend starts at `http://localhost:5000`.

### Terminal 2: Frontend

```bash
npm run dev
```

The frontend starts at `http://localhost:5173`.

Open `http://localhost:5173` in your browser.

## Default Login

- Email: `admin@demo.local`
- Password: `Admin123!`

You can also create a new account from the frontend. Registration supports business and customer accounts.

## Useful Commands

- `npm run dev`: Start the Vite development server.
- `npm run typecheck`: Run TypeScript checks without building.
- `npm run build`: Type-check and create a production build in `dist/`.

## Frontend Structure

- `src/App.tsx`: App shell.
- `src/routes/AppRoutes.tsx`: Route definitions for public, customer, auth, and business pages.
- `src/lib/api.ts`: Central API connector used by the frontend.
- `src/store/authStore.ts`: Authentication state and token persistence.
- `src/pages/`: Main page-level screens for business, public booking, customer dashboard, auth, and resources.
- `src/components/`: Reusable UI and feature components.
- `src/types/`: Shared TypeScript data types.

## Backend Connection Notes

- Keep the backend running before using booking, dashboard, staff, settings, or customer dashboard screens.
- If the frontend shows network errors, confirm `VITE_API_BASE_URL` points to the backend URL.
- After changing `.env`, restart `npm run dev` so Vite can reload environment values.

## Production Build

Create a production build with:

```bash
npm run build
```

Previewing or deploying the generated `dist/` folder still requires the Flask API to be available at the URL configured by `VITE_API_BASE_URL`.
