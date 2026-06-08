from datetime import datetime, timedelta

from sqlalchemy import inspect, text
from werkzeug.security import generate_password_hash

from app.models.entities import Base, Booking, Service, Specialist, StaffMember, TimeSlot, User
from app.utils.db import get_engine, get_session


def init_db() -> None:
    Base.metadata.create_all(get_engine())
    ensure_legacy_schema()
    seed_reference_data()


def ensure_legacy_schema() -> None:
    """Backfill columns needed by newer models when an older SQLite db exists."""
    engine = get_engine()
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())

    if "users" in table_names:
        user_columns = {column["name"] for column in inspector.get_columns("users")}
        with engine.begin() as connection:
            if "full_name" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(255) NOT NULL DEFAULT ''"))
            if "phone" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(50) NOT NULL DEFAULT ''"))
            if "business_name" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN business_name VARCHAR(255) NOT NULL DEFAULT 'Bright Studio'"))
            if "timezone" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN timezone VARCHAR(100) NOT NULL DEFAULT 'Africa/Lagos'"))
            if "smart_slot_selection" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN smart_slot_selection BOOLEAN NOT NULL DEFAULT 1"))
            if "conflict_resolution" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN conflict_resolution BOOLEAN NOT NULL DEFAULT 1"))

    if "bookings" in table_names:
        booking_columns = {column["name"] for column in inspector.get_columns("bookings")}
        if "time_slot_id" not in booking_columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE bookings ADD COLUMN time_slot_id INTEGER"))

    if "booking_pages" in table_names:
        booking_page_columns = {column["name"] for column in inspector.get_columns("booking_pages")}
        if "service_id" not in booking_page_columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE booking_pages ADD COLUMN service_id INTEGER"))


def seed_reference_data() -> None:
    session = get_session()

    if session.query(Service).count() == 0:
        services = [
            Service(
                name="Skin Consultation",
                description="Personalized skin assessment and treatment plan",
                duration_minutes=45,
                price=50.0,
                category="Wellness",
            ),
            Service(
                name="Hair Styling",
                description="Cut and style session",
                duration_minutes=60,
                price=40.0,
                category="Beauty",
            ),
            Service(
                name="Sports Massage",
                description="Targeted muscle recovery massage",
                duration_minutes=60,
                price=65.0,
                category="Therapy",
            ),
        ]
        session.add_all(services)

    if session.query(Specialist).count() == 0:
        specialists = [
            Specialist(name="Amina Bello", title="Senior Therapist", specialisation="Skin Health", experience_years=7, rating=4.8),
            Specialist(name="David Cole", title="Stylist", specialisation="Hair Care", experience_years=5, rating=4.6),
            Specialist(name="Rita Khan", title="Physiotherapist", specialisation="Sports Recovery", experience_years=9, rating=4.9),
        ]
        session.add_all(specialists)

    session.flush()

    if session.query(Specialist).count() > 0 and session.query(Service).count() > 0:
        specialist_1 = session.get(Specialist, 1)
        specialist_2 = session.get(Specialist, 2)
        specialist_3 = session.get(Specialist, 3)
        service_1 = session.get(Service, 1)
        service_2 = session.get(Service, 2)
        service_3 = session.get(Service, 3)

        if specialist_1 and service_1 and service_3 and len(specialist_1.services) == 0:
            specialist_1.services.extend([service_1, service_3])
        if specialist_2 and service_2 and len(specialist_2.services) == 0:
            specialist_2.services.append(service_2)
        if specialist_3 and service_3 and len(specialist_3.services) == 0:
            specialist_3.services.append(service_3)

    if session.query(User).filter(User.email == "admin@demo.local").first() is None:
        session.add(
            User(
                email="admin@demo.local",
                full_name="Demo Admin",
                phone="",
                business_name="Bright Studio",
                timezone="Africa/Lagos",
                smart_slot_selection=True,
                conflict_resolution=True,
                password_hash=generate_password_hash("Admin123!"),
                role="admin",
                created_at=datetime.utcnow(),
            )
        )

    if session.query(StaffMember).count() == 0:
        session.add_all(
            [
                StaffMember(
                    name="Dr. Mason",
                    email="mason@brightstudio.example",
                    phone="+1 (555) 014-1102",
                    role="Consultant",
                    services="Consultations, follow-ups",
                    next_slot="14:30",
                    status="Active",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                ),
                StaffMember(
                    name="Nadia Stone",
                    email="nadia@brightstudio.example",
                    phone="+1 (555) 014-1188",
                    role="Trainer",
                    services="Equipment training",
                    next_slot="12:45",
                    status="Active",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                ),
                StaffMember(
                    name="Ife Clarke",
                    email="ife@brightstudio.example",
                    phone="+1 (555) 014-1910",
                    role="Specialist",
                    services="Wellness reviews",
                    next_slot="15:00",
                    status="On leave",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                ),
                StaffMember(
                    name="Leah Hart",
                    email="leah@brightstudio.example",
                    phone="+1 (555) 014-2017",
                    role="Reception",
                    services="Front desk, booking support",
                    next_slot="Now",
                    status="Active",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                ),
            ]
        )

    if session.query(Booking).count() == 0:
        now = datetime.utcnow()
        samples = [
            (1, 1, 1, (now + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0), 45),
            (1, 2, 2, (now + timedelta(days=2)).replace(hour=14, minute=0, second=0, microsecond=0), 60),
            (1, 3, 3, (now + timedelta(days=3)).replace(hour=9, minute=30, second=0, microsecond=0), 60),
        ]
        for customer_id, specialist_id, service_id, start, duration in samples:
            slot = _get_or_create_seed_slot(session, specialist_id, start, start + timedelta(minutes=duration))
            session.add(
                Booking(
                    customer_id=customer_id,
                    specialist_id=specialist_id,
                    service_id=service_id,
                    time_slot_id=slot.id,
                    start_time=start,
                    end_time=start + timedelta(minutes=duration),
                    status="confirmed",
                    note="",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
            )

    session.commit()


def _get_or_create_seed_slot(session, specialist_id: int, start: datetime, end: datetime) -> TimeSlot:
    slot = (
        session.query(TimeSlot)
        .filter(
            TimeSlot.specialist_id == specialist_id,
            TimeSlot.start_time == start,
            TimeSlot.end_time == end,
        )
        .first()
    )

    if slot is not None:
        return slot

    slot = TimeSlot(
        specialist_id=specialist_id,
        date=start.date().isoformat(),
        start_time=start,
        end_time=end,
        is_available=True,
        created_at=datetime.utcnow(),
    )
    session.add(slot)
    session.flush()
    return slot
