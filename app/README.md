# Flask Backend (SQLite)

This backend implements FR1-FR7 for the AI Booking system using Flask + SQLAlchemy ORM with SQLite.

## Setup

1. Install dependencies:

   ```bash
   pip install -r app/requirements.txt
   ```

2. Run backend:

   ```bash
   python -m app.main
   ```

3. Health check:

   ```bash
   GET /health
   ```

## Default Admin

- Email: admin@demo.local
- Password: Admin123!

## API Routes

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- PATCH /api/auth/me
- PATCH /api/auth/password
- DELETE /api/auth/me

### Resources
- GET /api/resources/services
- GET /api/resources/specialists?serviceId=1

### Bookings
- GET /api/bookings
- POST /api/bookings
- GET /api/bookings/:id
- PATCH /api/bookings/:id
- DELETE /api/bookings/:id

### AI
- POST /api/ai/check-conflict
- POST /api/ai/recommend-slot

### Public Page
- POST /api/public-pages/publish
- GET /api/public-pages
- GET /api/public-pages/:slug

### Analytics
- GET /api/analytics/overview

## Notes

- SQLAlchemy ORM is used for data models and queries.
- SQLite is used for now and can be swapped later to PostgreSQL/MySQL by changing the SQLAlchemy database URL.
- Conflict prevention uses overlap check on specialist schedule.
- AI recommendation returns up to 3 alternative slots.
- Account settings, automation preferences, password updates, and account deletion are persisted through the auth API.
