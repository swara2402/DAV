"""tests/test_api_endpoints.py — API integration and security tests."""
import pytest
from fastapi.testclient import TestClient
from config import settings
from auth import _decode_demo_token


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_unauthorized_request(client: TestClient):
    """Endpoints requiring auth must reject missing Authorization header with 401."""
    response = client.get("/api/v1/expenses")
    assert response.status_code == 401


def test_profile_endpoints(client: TestClient, demo_auth_headers: dict):
    response = client.get("/api/v1/profiles/me", headers=demo_auth_headers)
    assert response.status_code == 200
    profile = response.json()
    assert profile["user_id"] == "demo_maya"
    assert profile["display_name"] == "Maya"


def test_expense_crud_and_validation(client: TestClient, fresh_auth_headers: dict):
    # 1. Invalid amount (< 0) -> 422
    invalid_resp = client.post(
        "/api/v1/expenses",
        json={"date": "2026-10-20", "amount": -50.0, "category": "convenience_food"},
        headers=fresh_auth_headers,
    )
    assert invalid_resp.status_code == 422

    # 2. Invalid category -> 422
    invalid_cat = client.post(
        "/api/v1/expenses",
        json={"date": "2026-10-20", "amount": 250.0, "category": "non_existent_category"},
        headers=fresh_auth_headers,
    )
    assert invalid_cat.status_code == 422

    # 3. Valid creation
    create_resp = client.post(
        "/api/v1/expenses",
        json={
            "date": "2026-10-20",
            "amount": 450.50,
            "category": "convenience_food",
            "description": "Zomato dinner delivery",
        },
        headers=fresh_auth_headers,
    )
    assert create_resp.status_code == 201
    expense = create_resp.json()
    assert expense["amount"] == 450.50
    assert expense["category"] == "convenience_food"
    assert expense["description"] == "Zomato dinner delivery"
    exp_id = expense["id"]

    # 4. Read back
    get_resp = client.get(f"/api/v1/expenses/{exp_id}", headers=fresh_auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == exp_id

    # 5. Update
    put_resp = client.put(
        f"/api/v1/expenses/{exp_id}",
        json={"amount": 499.00, "description": "Updated dinner"},
        headers=fresh_auth_headers,
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["amount"] == 499.00
    assert put_resp.json()["description"] == "Updated dinner"

    # 6. Delete
    del_resp = client.delete(f"/api/v1/expenses/{exp_id}", headers=fresh_auth_headers)
    assert del_resp.status_code == 204

    # 7. Verify deleted -> 404
    verify_resp = client.get(f"/api/v1/expenses/{exp_id}", headers=fresh_auth_headers)
    assert verify_resp.status_code == 404


def test_cross_user_isolation(
    client: TestClient,
    demo_auth_headers: dict,
    fresh_auth_headers: dict,
):
    """User A cannot access or mutate User B's records."""
    # Create expense as demo_maya
    create_resp = client.post(
        "/api/v1/expenses",
        json={"date": "2026-10-22", "amount": 350.0, "category": "groceries"},
        headers=demo_auth_headers,
    )
    assert create_resp.status_code == 201
    expense_id = create_resp.json()["id"]

    # Try to access as demo_fresh -> must return 404
    other_resp = client.get(f"/api/v1/expenses/{expense_id}", headers=fresh_auth_headers)
    assert other_resp.status_code == 404

    # Try to delete as demo_fresh -> must return 404
    other_del = client.delete(f"/api/v1/expenses/{expense_id}", headers=fresh_auth_headers)
    assert other_del.status_code == 404


def test_task_crud_and_completion(client: TestClient, fresh_auth_headers: dict):
    # 1. Create task
    task_resp = client.post(
        "/api/v1/tasks",
        json={
            "title": "Submit GST return",
            "due_date": "2026-11-25",
            "category": "finance",
        },
        headers=fresh_auth_headers,
    )
    assert task_resp.status_code == 201
    task = task_resp.json()
    task_id = task["id"]
    assert task["completed_at"] is None

    # 2. Complete task
    comp_resp = client.post(
        f"/api/v1/tasks/{task_id}/complete",
        json={"completed_at": "2026-11-24"},
        headers=fresh_auth_headers,
    )
    assert comp_resp.status_code == 200
    assert comp_resp.json()["completed_at"] == "2026-11-24"

    # 3. Clean up
    client.delete(f"/api/v1/tasks/{task_id}", headers=fresh_auth_headers)


def test_action_and_followup_workflow(client: TestClient, demo_auth_headers: dict):
    # 1. Post 'Tried It' action
    action_resp = client.post(
        "/api/v1/actions",
        json={
            "action_text": "Meal prep on Sundays to avoid ordering takeout on busy weekdays",
        },
        headers=demo_auth_headers,
    )
    assert action_resp.status_code == 201
    action = action_resp.json()
    action_id = action["id"]
    assert action["followup_status"] == "pending"

    # 2. Check follow-up immediately -> should be insufficient_data with explanation
    followup_resp = client.get(f"/api/v1/actions/{action_id}/followup", headers=demo_auth_headers)
    assert followup_resp.status_code == 200
    outcome = followup_resp.json()
    assert outcome["status"] == "insufficient_data"
    assert "Not enough data yet" in outcome["message"]
    assert outcome["causation_disclaimer"] is not None


def test_demo_seed_idempotency(client: TestClient, demo_auth_headers: dict):
    """Repeated calls to select-persona must be idempotent and not duplicate data."""
    # First call
    r1 = client.post(
        "/api/v1/demo/select-persona",
        json={"persona": "maya"},
        headers=demo_auth_headers,
    )
    assert r1.status_code == 200

    # Second call
    r2 = client.post(
        "/api/v1/demo/select-persona",
        json={"persona": "maya"},
        headers=demo_auth_headers,
    )
    assert r2.status_code == 200
    assert r2.json()["already_seeded"] is True




def test_demo_token_is_rejected_outside_demo_mode(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    assert settings.is_demo is False
    assert _decode_demo_token("demo_maya") is None
