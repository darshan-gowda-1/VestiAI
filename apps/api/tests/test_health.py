from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "timestamp" in data
    assert "service" in data


def test_api_v1_health_endpoint_when_db_connected():
    with patch(
        "app.api.v1.routes.health.check_database_connection",
        new=AsyncMock(return_value=(True, "connected")),
    ):
        response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["version"] == "1.0.0"
    assert data["api_prefix"] == "/api/v1"
    assert "storage_backend" in data
    assert "model_configured" in data


def test_api_v1_health_endpoint_when_db_unavailable():
    with patch(
        "app.api.v1.routes.health.check_database_connection",
        new=AsyncMock(return_value=(False, "unavailable (ConnectionRefusedError)")),
    ):
        response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert "unavailable" in data["database"]


def test_standardized_not_found_error_format():
    response = client.get("/api/v1/nonexistent-route", headers={"X-Request-ID": "req-test-404"})
    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "NOT_FOUND"
    assert data["request_id"] == "req-test-404"
    assert "message" in data


def test_openapi_and_docs_endpoints():
    openapi_res = client.get("/openapi.json")
    assert openapi_res.status_code == 200
    schema = openapi_res.json()
    assert schema["info"]["title"] == "VestiAI Virtual Try-On API"
    assert "/api/v1/health" in schema["paths"]

    docs_res = client.get("/docs")
    assert docs_res.status_code == 200

    redoc_res = client.get("/redoc")
    assert redoc_res.status_code == 200
