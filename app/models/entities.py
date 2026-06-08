from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Float, ForeignKey, Index, Integer, String, Table, Text, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


specialist_services = Table(
    "specialist_services",
    Base.metadata,
    Column("specialist_id", ForeignKey("specialists.id", ondelete="CASCADE"), primary_key=True),
    Column("service_id", ForeignKey("services.id", ondelete="CASCADE"), primary_key=True),
)


booking_page_specialists = Table(
    "booking_page_specialists",
    Base.metadata,
    Column("booking_page_id", ForeignKey("booking_pages.id", ondelete="CASCADE"), primary_key=True),
    Column("specialist_id", ForeignKey("specialists.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    phone: Mapped[str] = mapped_column(String(50), default="", nullable=False)
    business_name: Mapped[str] = mapped_column(String(255), default="Bright Studio", nullable=False)
    timezone: Mapped[str] = mapped_column(String(100), default="Africa/Lagos", nullable=False)
    smart_slot_selection: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    conflict_resolution: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    bookings: Mapped[list["Booking"]] = relationship(back_populates="customer")

    __table_args__ = (
        CheckConstraint("role IN ('customer', 'staff', 'admin')", name="ck_users_role"),
    )


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    specialists: Mapped[list["Specialist"]] = relationship(
        secondary=specialist_services,
        back_populates="services",
    )
    bookings: Mapped[list["Booking"]] = relationship(back_populates="service")
    booking_pages: Mapped[list["BookingPage"]] = relationship(back_populates="service")


class Specialist(Base):
    __tablename__ = "specialists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    specialisation: Mapped[str] = mapped_column(String(255), nullable=False)
    experience_years: Mapped[int] = mapped_column(Integer, nullable=False)
    rating: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    services: Mapped[list[Service]] = relationship(
        secondary=specialist_services,
        back_populates="specialists",
    )
    bookings: Mapped[list["Booking"]] = relationship(back_populates="specialist")
    time_slots: Mapped[list["TimeSlot"]] = relationship(back_populates="specialist")
    booking_pages: Mapped[list["BookingPage"]] = relationship(
        secondary=booking_page_specialists,
        back_populates="specialists",
    )


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    specialist_id: Mapped[int] = mapped_column(ForeignKey("specialists.id"), nullable=False)
    date: Mapped[str] = mapped_column(String(10), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    specialist: Mapped[Specialist] = relationship(back_populates="time_slots")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="time_slot")

    __table_args__ = (
        Index("uq_time_slots_specialist_interval", "specialist_id", "start_time", "end_time", unique=True),
    )


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    specialist_id: Mapped[int] = mapped_column(ForeignKey("specialists.id"), nullable=False)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False)
    time_slot_id: Mapped[int | None] = mapped_column(ForeignKey("time_slots.id"), nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="confirmed", nullable=False)
    note: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    customer: Mapped[User] = relationship(back_populates="bookings")
    specialist: Mapped[Specialist] = relationship(back_populates="bookings")
    service: Mapped[Service] = relationship(back_populates="bookings")
    time_slot: Mapped[TimeSlot | None] = relationship(back_populates="bookings")

    __table_args__ = (
        CheckConstraint("status IN ('pending', 'confirmed', 'cancelled')", name="ck_bookings_status"),
        Index(
            "uq_active_booking_specialist_slot",
            "specialist_id",
            "time_slot_id",
            unique=True,
            sqlite_where=text("status IN ('pending', 'confirmed')"),
            postgresql_where=text("status IN ('pending', 'confirmed')"),
        ),
    )


class BookingPage(Base):
    __tablename__ = "booking_pages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    service_id: Mapped[int | None] = mapped_column(ForeignKey("services.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    service_name: Mapped[str] = mapped_column(String(255), nullable=False)
    service_description: Mapped[str] = mapped_column(Text, nullable=False)
    service_category: Mapped[str] = mapped_column(String(100), nullable=False)
    service_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    service_price: Mapped[float] = mapped_column(Float, nullable=False)
    location_type: Mapped[str] = mapped_column(String(30), nullable=False)
    location_details: Mapped[str] = mapped_column(Text, nullable=False)
    notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="published", nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    public_url: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    specialists: Mapped[list[Specialist]] = relationship(
        secondary=booking_page_specialists,
        back_populates="booking_pages",
    )
    service: Mapped[Service | None] = relationship(back_populates="booking_pages")
    slots: Mapped[list["BookingPageSlot"]] = relationship(back_populates="booking_page", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'ready', 'published', 'missing-required-fields')",
            name="ck_booking_pages_status",
        ),
    )


class BookingPageSlot(Base):
    __tablename__ = "booking_page_slots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    booking_page_id: Mapped[int] = mapped_column(ForeignKey("booking_pages.id", ondelete="CASCADE"), nullable=False)
    day: Mapped[str] = mapped_column(String(20), nullable=False)
    time: Mapped[str] = mapped_column(String(10), nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    max_bookings_per_slot: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    booking_page: Mapped[BookingPage] = relationship(back_populates="slots")


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    capacity: Mapped[str] = mapped_column(String(255), nullable=False)
    usage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class StaffMember(Base):
    __tablename__ = "staff_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    services: Mapped[str] = mapped_column(Text, nullable=False)
    next_slot: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint("status IN ('Active', 'On leave', 'Inactive')", name="ck_staff_members_status"),
    )
