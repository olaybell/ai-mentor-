# AI Booking Backend

This Flask backend powers the AI Booking application. It stores users, customers, specialists, services, resources, public booking pages, time slots, and bookings with SQLAlchemy ORM and SQLite.

## Get The Application Running

Run these commands from the project root.

1. Create and activate a Python virtual environment:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

   On macOS or Linux:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. Install backend dependencies:

   ```bash
   pip install -r app/requirements.txt
   ```

3. Create the local environment file.

   If `.env.example` exists, rename or copy it to `.env`. If it does not exist, create `.env` in the project root with:

   ```env
   SECRET_KEY=change-me-in-local-dev
   DATABASE_PATH=app/booking.db
   JWT_EXPIRATION_HOURS=24
   LLM_API_URL=
   LLM_API_KEY=
   LLM_MODEL=google/gemma-2-9b-it:free
   LLM_TIMEOUT_SECONDS=8
   VITE_API_BASE_URL=http://localhost:5000
   ```

   The backend loads this file automatically through `app/config.py`.

4. Start the Flask backend:

   ```bash
   python -m app.main
   ```

   The backend runs on `http://localhost:5000` by default.

5. In another terminal, install and start the frontend:

   ```bash
   npm install
   npm run dev
   ```

   The frontend runs on `http://localhost:5173` by default.

6. Check the backend health endpoint:

   ```bash
   GET http://localhost:5000/health
   ```

## Environment Variables

- `SECRET_KEY`: Flask/JWT signing secret. Change this before production.
- `DATABASE_PATH`: SQLite file path or a full `sqlite:///...` URL.
- `JWT_EXPIRATION_HOURS`: Number of hours before login tokens expire.
- `LLM_API_URL`: Optional OpenAI-compatible chat completion endpoint for AI slot ranking.
- `LLM_API_KEY`: Optional API key for the LLM endpoint.
- `LLM_MODEL`: Model name sent to the LLM endpoint. The default is a free-model-friendly value.
- `LLM_TIMEOUT_SECONDS`: Maximum time to wait for the LLM before falling back.
- `VITE_API_BASE_URL`: Frontend API base URL.

If `LLM_API_URL` or `LLM_API_KEY` is blank, booking recommendations still work through the deterministic heuristic fallback.

## Default Admin

- Email: `admin@demo.local`
- Password: `Admin123!`

## Main API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/me`
- `PATCH /api/auth/password`
- `DELETE /api/auth/me`

### Resources

- `GET /api/resources/services`
- `GET /api/resources/specialists?serviceId=1`
- `GET /api/resources`
- `POST /api/resources`
- `PATCH /api/resources/:id`
- `DELETE /api/resources/:id`

### Staff

- `GET /api/staff`
- `POST /api/staff`
- `PATCH /api/staff/:id`
- `DELETE /api/staff/:id`

### Bookings

- `GET /api/bookings`
- `POST /api/bookings`
- `GET /api/bookings/:id`
- `PATCH /api/bookings/:id`
- `DELETE /api/bookings/:id`
- `GET /api/availability?specialistId=1&serviceId=1&date=2026-06-08`

### AI

- `POST /api/ai/check-conflict`
- `POST /api/ai/recommend-slot`

### Public Booking Pages

- `POST /api/public-pages/publish`
- `GET /api/public-pages`
- `GET /api/public-pages/:slug`

### Analytics

- `GET /api/analytics/overview`

## Services Directory

- `app/services/auth_service.py`: Handles account registration, login credential checks, profile serialization, profile updates, booking-rule preferences, password changes, and account deletion.
- `app/services/booking_service.py`: Owns booking lifecycle logic. It validates services and specialists, creates or reuses time slots, resolves customers, checks specialist overlap conflicts, creates bookings, lists customer or business bookings, updates bookings, and cancels bookings.
- `app/services/ai_service.py`: Runs the hybrid scheduling assistant. It filters candidate slots through booking availability and conflict checks, ranks slots heuristically, optionally asks an OpenAI-compatible LLM endpoint for contextual ranking, and falls back safely when the LLM is unavailable.
- `app/services/analytics_service.py`: Builds dashboard data including booking frequency, specialist utilisation, daily metrics, cancelled-slot opportunities, pending conflict-review counts, and AI-style dashboard insights.
- `app/services/resource_service.py`: Reads available services and specialists for booking flows, and manages operational resources such as rooms or equipment with create, update, list, and delete helpers.
- `app/services/staff_service.py`: Manages staff records with validation for required fields, unique staff email checks, serialization, create, update, list, and delete operations.
- `app/services/__init__.py`: Marks the folder as the services package.

## Implementation Notes

- SQLite is used locally, but SQLAlchemy keeps the database layer portable.
- Bookings reference a customer, specialist, service, and time slot.
- Active booking statuses are `pending` and `confirmed`; `cancelled` bookings do not block future availability.
- Conflict prevention uses the interval overlap rule: an existing booking conflicts when `existing_start < requested_end` and `existing_end > requested_start`.
- AI recommendations return up to three ranked slots with customer-facing rationales.
