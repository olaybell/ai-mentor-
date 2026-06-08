from datetime import datetime, timedelta


def _iso(days_offset: int, hour: int, minute: int = 0):
    dt = datetime.utcnow() + timedelta(days=days_offset)
    dt = dt.replace(hour=hour, minute=minute, second=0, microsecond=0)
    return dt.isoformat()


def test_booking_crud_persists(client, auth_headers):
    create = client.post(
        "/api/bookings",
        headers=auth_headers,
        json={
            "specialistId": 1,
            "serviceId": 1,
            "startTime": _iso(10, 11),
            "note": "Initial consult",
        },
    )
    assert create.status_code == 201
    booking_id = create.get_json()["data"]["id"]

    fetch = client.get(f"/api/bookings/{booking_id}", headers=auth_headers)
    assert fetch.status_code == 200

    update = client.patch(
        f"/api/bookings/{booking_id}",
        headers=auth_headers,
        json={
            "specialistId": 1,
            "serviceId": 1,
            "startTime": _iso(10, 12),
            "note": "Updated time",
        },
    )
    assert update.status_code == 200

    cancel = client.delete(f"/api/bookings/{booking_id}", headers=auth_headers)
    assert cancel.status_code == 200


def test_double_booking_conflict_blocked(client, auth_headers):
    start_time = _iso(11, 10)

    first = client.post(
        "/api/bookings",
        headers=auth_headers,
        json={"specialistId": 1, "serviceId": 1, "startTime": start_time},
    )
    assert first.status_code == 201

    second = client.post(
        "/api/bookings",
        headers=auth_headers,
        json={"specialistId": 1, "serviceId": 1, "startTime": start_time},
    )
    assert second.status_code == 400
    assert "already booked" in second.get_json()["error"].lower()


def test_conflict_detection_rate_at_least_95_percent(client, auth_headers):
    blocked = 0
    total = 40

    for i in range(total):
        # Each odd iteration creates a booking then retries same slot to force a conflict scenario.
        slot = _iso(20 + (i // 2), 9 + (i % 2))
        create = client.post(
            "/api/bookings",
            headers=auth_headers,
            json={"specialistId": 3, "serviceId": 3, "startTime": slot},
        )
        assert create.status_code == 201

        retry = client.post(
            "/api/bookings",
            headers=auth_headers,
            json={"specialistId": 3, "serviceId": 3, "startTime": slot},
        )
        if retry.status_code == 400:
            blocked += 1

    assert blocked / total >= 0.95


def test_ai_recommends_up_to_three_slots_under_three_seconds(client, auth_headers):
    now_start = _iso(30, 10)
    response = client.post(
        "/api/ai/recommend-slot",
        headers=auth_headers,
        json={
            "specialistId": 1,
            "serviceDurationMinutes": 45,
            "requestedStartTime": now_start,
        },
    )
    assert response.status_code == 200
    body = response.get_json()["data"]
    assert len(body["alternatives"]) <= 3
    assert body["latencyMs"] < 3000


def test_analytics_overview_updates_after_booking(client, auth_headers, admin_headers):
    before = client.get("/api/analytics/overview", headers=admin_headers)
    assert before.status_code == 200
    before_total = sum(item["total"] for item in before.get_json()["data"]["weeklyBookingFrequency"])

    create = client.post(
        "/api/bookings",
        headers=auth_headers,
        json={"specialistId": 2, "serviceId": 2, "startTime": _iso(40, 13)},
    )
    assert create.status_code == 201

    after = client.get("/api/analytics/overview", headers=admin_headers)
    assert after.status_code == 200
    after_total = sum(item["total"] for item in after.get_json()["data"]["weeklyBookingFrequency"])
    assert after_total == before_total + 1
