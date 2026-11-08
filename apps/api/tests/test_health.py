import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "timestamp" in data
    assert "service" in data


def test_api_v1_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "1.0.0"
    assert data["api_prefix"] == "/api/v1"
    assert "storage_backend" in data
    assert "model_configured" in data

