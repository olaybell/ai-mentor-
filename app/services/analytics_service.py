from datetime import datetime, timedelta

from sqlalchemy import func

from app.models.entities import Booking, Resource, Specialist
from app.utils.db import get_session


def get_weekly_booking_frequency() -> list[dict]:
    session = get_session()
    rows = (
        session.query(
            func.strftime("%Y-%W", Booking.start_time).label("week"),
            func.count(Booking.id).label("total"),
        )
        .filter(Booking.status != "cancelled")
        .group_by("week")
        .order_by(func.strftime("%Y-%W", Booking.start_time).desc())
        .limit(8)
        .all()
    )
    return [{"week": week, "total": total} for week, total in rows]


def get_specialist_utilisation() -> list[dict]:
    session = get_session()
    booked_minutes_expr = func.round(
        func.coalesce(func.sum((func.julianday(Booking.end_time) - func.julianday(Booking.start_time)) * 24 * 60), 0),
        0,
    )
    rows = (
        session.query(
            Specialist.id.label("specialist_id"),
            Specialist.name.label("specialist_name"),
            func.count(Booking.id).label("total_bookings"),
            booked_minutes_expr.label("booked_minutes"),
        )
        .outerjoin(Booking, (Booking.specialist_id == Specialist.id) & (Booking.status != "cancelled"))
        .group_by(Specialist.id, Specialist.name)
        .order_by(func.count(Booking.id).desc(), Specialist.name)
        .all()
    )
    return [
        {
            "specialist_id": specialist_id,
            "specialist_name": specialist_name,
            "total_bookings": total_bookings,
            "booked_minutes": booked_minutes,
        }
        for specialist_id, specialist_name, total_bookings, booked_minutes in rows
    ]


def get_overview() -> dict:
    metrics = get_dashboard_metrics()
    insights = get_dashboard_insights(metrics)
    return {
        "weeklyBookingFrequency": get_weekly_booking_frequency(),
        "utilisation": get_specialist_utilisation(),
        "metrics": metrics,
        "aiInsights": insights,
    }


def get_dashboard_metrics() -> dict:
    session = get_session()
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_start = today_start + timedelta(days=1)
    yesterday_start = today_start - timedelta(days=1)

    bookings_today = _count_bookings_between(today_start, tomorrow_start, exclude_cancelled=True)
    bookings_yesterday = _count_bookings_between(yesterday_start, today_start, exclude_cancelled=True)
    cancelled_today = _count_cancelled_between(today_start, tomorrow_start)
    pending_today = (
        session.query(Booking.id)
        .filter(
            Booking.status == "pending",
            Booking.start_time >= today_start,
            Booking.start_time < tomorrow_start,
        )
        .count()
    )

    utilisation_rows = get_specialist_utilisation()
    total_booked_minutes = sum(int(row["booked_minutes"] or 0) for row in utilisation_rows)
    specialist_count = max(len(utilisation_rows), 1)
    weekly_capacity_minutes = specialist_count * 5 * 10 * 60
    specialist_utilisation_percent = round(min((total_booked_minutes / weekly_capacity_minutes) * 100, 100))
    resource_usage = session.query(func.avg(Resource.usage)).scalar()
    resource_utilisation_percent = round(float(resource_usage or specialist_utilisation_percent or 0))

    rebookable_gaps = cancelled_today

    return {
        "bookingsToday": bookings_today,
        "bookingDelta": bookings_today - bookings_yesterday,
        "resourceUtilisation": resource_utilisation_percent,
        "specialistUtilisation": specialist_utilisation_percent,
        "potentialConflicts": pending_today,
        "cancelledSlots": cancelled_today,
        "rebookableGaps": rebookable_gaps,
    }


def get_dashboard_insights(metrics: dict) -> list[dict]:
    utilisation = get_specialist_utilisation()
    busiest = utilisation[0] if utilisation else None
    insights: list[dict] = []

    if metrics["potentialConflicts"] > 0:
        insights.append(
            {
                "title": "Pending review",
                "body": f"{metrics['potentialConflicts']} pending booking request needs confirmation before the schedule is fully locked.",
            }
        )
    else:
        insights.append(
            {
                "title": "Conflict risk",
                "body": "No pending bookings are waiting for conflict review, and active bookings are protected by the overlap check.",
            }
        )

    if busiest:
        insights.append(
            {
                "title": "Specialist workload",
                "body": f"{busiest['specialist_name']} has the highest current load with {busiest['total_bookings']} active booking(s).",
            }
        )

    if metrics["cancelledSlots"] > 0:
        insights.append(
            {
                "title": "Rebooking opportunity",
                "body": f"{metrics['cancelledSlots']} cancelled slot(s) today can be offered to customers looking for earlier appointments.",
            }
        )
    else:
        insights.append(
            {
                "title": "Demand pattern",
                "body": "No cancellations are open today. Keep monitoring morning slots because they are typically the strongest recommendation candidates.",
            }
        )

    return insights[:3]


def _count_bookings_between(start: datetime, end: datetime, exclude_cancelled: bool = False) -> int:
    session = get_session()
    query = session.query(Booking.id).filter(Booking.start_time >= start, Booking.start_time < end)
    if exclude_cancelled:
        query = query.filter(Booking.status != "cancelled")
    return query.count()


def _count_cancelled_between(start: datetime, end: datetime) -> int:
    session = get_session()
    return (
        session.query(Booking.id)
        .filter(
            Booking.status == "cancelled",
            Booking.start_time >= start,
            Booking.start_time < end,
        )
        .count()
    )
