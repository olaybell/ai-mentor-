from app.models.entities import Service, Specialist
from app.utils.db import get_session
from app.models.entities import Resource
from datetime import datetime


def list_services() -> list[dict]:
    session = get_session()
    rows = session.query(Service).filter(Service.is_active.is_(True)).order_by(Service.name).all()
    return [
        {
            "id": row.id,
            "name": row.name,
            "description": row.description,
            "duration_minutes": row.duration_minutes,
            "durationMinutes": row.duration_minutes,
            "price": row.price,
            "category": row.category,
        }
        for row in rows
    ]


def list_specialists(service_id: int | None = None) -> list[dict]:
    session = get_session()
    query = session.query(Specialist).filter(Specialist.is_active.is_(True))
    if service_id is not None:
        query = query.join(Specialist.services).filter(Service.id == service_id)

    rows = query.order_by(Specialist.name).all()
    return [
        {
            "id": spec.id,
            "name": spec.name,
            "title": spec.title,
            "specialisation": spec.specialisation,
            "experience_years": spec.experience_years,
            "experienceYears": spec.experience_years,
            "rating": spec.rating,
            "serviceIds": [service.id for service in spec.services],
        }
        for spec in rows
    ]


def list_resources() -> list[dict]:
    session = get_session()
    rows = session.query(Resource).order_by(Resource.name).all()
    return [
        {
            "id": row.id,
            "name": row.name,
            "type": row.type,
            "location": row.location,
            "capacity": row.capacity,
            "usage": row.usage,
            "status": row.status,
        }
        for row in rows
    ]


def create_resource(payload: dict) -> dict:
    session = get_session()
    resource = Resource(
        name=payload.get("name", ""),
        type=payload.get("type", ""),
        location=payload.get("location", ""),
        capacity=payload.get("capacity", ""),
        usage=int(payload.get("usage", 0)),
        status=payload.get("status", "Available"),
        created_at=datetime.utcnow(),
    )
    session.add(resource)
    session.commit()
    session.refresh(resource)
    return {
        "id": resource.id,
        "name": resource.name,
        "type": resource.type,
        "location": resource.location,
        "capacity": resource.capacity,
        "usage": resource.usage,
        "status": resource.status,
    }


def update_resource(resource_id: int, payload: dict) -> dict | None:
    session = get_session()
    resource = session.get(Resource, resource_id)
    if resource is None:
        return None
    resource.name = payload.get("name", resource.name)
    resource.type = payload.get("type", resource.type)
    resource.location = payload.get("location", resource.location)
    resource.capacity = payload.get("capacity", resource.capacity)
    resource.usage = int(payload.get("usage", resource.usage))
    resource.status = payload.get("status", resource.status)
    session.commit()
    session.refresh(resource)
    return {
        "id": resource.id,
        "name": resource.name,
        "type": resource.type,
        "location": resource.location,
        "capacity": resource.capacity,
        "usage": resource.usage,
        "status": resource.status,
    }


def delete_resource(resource_id: int) -> bool:
    session = get_session()
    resource = session.get(Resource, resource_id)
    if resource is None:
        return False
    session.delete(resource)
    session.commit()
    return True
