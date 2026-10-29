"""routers/demo.py — Demo persona selection and data reset endpoints."""
from __future__ import annotations

from typing import Literal
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from auth import get_current_user, require_demo_mode
from database import get_db
from services.demo_seeder import seed_persona, _clear_user_data

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/demo", tags=["demo"])


class PersonaSelectRequest(BaseModel):
    persona: Literal["maya", "arjun", "fresh"]


class ResetRequest(BaseModel):
    confirm: bool


@router.post("/select-persona", dependencies=[Depends(require_demo_mode)])
async def select_persona(
    body: PersonaSelectRequest,
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Selects a demo persona and seeds isolated versioned synthetic data for the user.
    Idempotent: does not duplicate records if already seeded.
    """
    user_id = user["user_id"]
    try:
        result = seed_persona(user_id, body.persona, db)
        return {
            "success": True,
            "persona": body.persona,
            "seeded": result["seeded"],
            "already_seeded": result["already_seeded"],
            "record_counts": result.get("record_counts", {}),
            "synthetic_disclosure": (
                "Synthetic data for demonstration only. Maya and Arjun are fictional personas. "
                "These records do not represent real individuals or financial accounts."
            ),
        }
    except Exception:
        logger.exception("Failed to seed demo persona")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load demo data. Check server logs and verify the bundled dataset files.",
        ) from None


@router.post("/reset", dependencies=[Depends(require_demo_mode)])
async def reset_demo_data(
    body: ResetRequest,
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Deletes all expenses, tasks, actions, and seed runs for the current user.
    Requires explicit confirmation flag.
    """
    if not body.confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation required to reset data. Pass confirm: true.",
        )

    user_id = user["user_id"]
    try:
        _clear_user_data(user_id, db)
        return {
            "success": True,
            "message": "All workspace data for this session has been successfully cleared.",
            "user_id": user_id,
        }
    except Exception:
        logger.exception("Failed to reset demo data")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset demo data. Please try again or contact support.",
        ) from None

