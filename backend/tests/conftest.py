"""conftest.py — Pytest fixtures for backend tests."""
import os
import sys
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set test environment
os.environ["ENVIRONMENT"] = "development"
os.environ["VITE_DEMO_MODE"] = "true"

from main import app
from database import get_db_instance, init_db
from config import settings


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Use a temporary database file for the entire test session."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        test_db_path = tmp.name

    settings.SQLITE_PATH = test_db_path
    # Re-initialize singleton
    import database
    database._db_instance = database.SQLiteDB(test_db_path)
    init_db()

    yield database._db_instance

    if os.path.exists(test_db_path):
        try:
            os.remove(test_db_path)
        except Exception:
            pass


@pytest.fixture
def client():
    """TestClient instance."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def demo_auth_headers():
    """Headers for authenticated demo user Maya."""
    return {"Authorization": "Bearer demo_maya"}


@pytest.fixture
def arjun_auth_headers():
    """Headers for authenticated demo user Arjun."""
    return {"Authorization": "Bearer demo_arjun"}


@pytest.fixture
def fresh_auth_headers():
    """Headers for authenticated demo user Fresh."""
    return {"Authorization": "Bearer demo_fresh"}
