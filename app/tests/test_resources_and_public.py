def test_services_and_specialists_can_be_browsed(client, auth_headers):
    services = client.get("/api/resources/services", headers=auth_headers)
    assert services.status_code == 200
    services_data = services.get_json()["data"]
    assert len(services_data) > 0

    first_service_id = services_data[0]["id"]
    specialists = client.get(f"/api/resources/specialists?serviceId={first_service_id}", headers=auth_headers)
    assert specialists.status_code == 200
    specialists_data = specialists.get_json()["data"]
    assert len(specialists_data) > 0
    assert any(first_service_id in specialist["serviceIds"] for specialist in specialists_data)


def test_admin_can_publish_public_booking_page(client, admin_headers):
    response = client.post(
        "/api/public-pages/publish",
        headers=admin_headers,
        json={
            "title": "Hair Booking",
            "businessName": "Glow Studio",
            "serviceName": "Hair Styling",
            "serviceDescription": "Style and cut",
            "serviceCategory": "Beauty",
            "serviceDurationMinutes": 60,
            "servicePrice": 40,
            "locationType": "In-store",
            "locationDetails": "Main branch",
            "specialistIds": [2],
            "timeSlots": [
                {"day": "Monday", "time": "09:00", "isAvailable": True, "maxBookingsPerSlot": 1}
            ],
        },
    )
    assert response.status_code == 200
    body = response.get_json()
    assert body["success"] is True
    slug = body["data"]["slug"]

    public_get = client.get(f"/api/public-pages/{slug}")
    assert public_get.status_code == 200
    assert public_get.get_json()["success"] is True
