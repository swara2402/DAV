"""routers/expenses.py — Expense CRUD endpoints."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from auth import get_current_user
from database import get_db
from models.expense import ExpenseCreate, ExpenseUpdate, ExpenseOut

router = APIRouter(prefix="/api/v1/expenses", tags=["expenses"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_profile_exists(user_id: str, email: str, db) -> None:
    now = _now()
    if db.mode == "sqlite":
        db.execute(
            "INSERT OR IGNORE INTO profiles (user_id, display_name, selected_persona, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, (email.split("@")[0] if email else "User"), None, now, now),
        )
    else:
        db.client.table("profiles").upsert({
            "user_id": user_id,
            "display_name": email.split("@")[0] if email else "User",
            "selected_persona": None,
            "created_at": now,
            "updated_at": now,
        }).execute()


@router.get("", response_model=list[ExpenseOut])
async def list_expenses(
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    offset = (page - 1) * page_size

    if db.mode == "sqlite":
        clauses = ["user_id = ?"]
        params: list = [user_id]
        if start_date:
            clauses.append("date >= ?")
            params.append(start_date)
        if end_date:
            clauses.append("date <= ?")
            params.append(end_date)
        if category:
            clauses.append("category = ?")
            params.append(category)

        where = " AND ".join(clauses)
        sql = f"SELECT * FROM expenses WHERE {where} ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?"
        params.extend([page_size, offset])
        return db.fetchall(sql, tuple(params))
    else:
        query = db.client.table("expenses").select("*").eq("user_id", user_id)
        if start_date:
            query = query.gte("date", start_date)
        if end_date:
            query = query.lte("date", end_date)
        if category:
            query = query.eq("category", category)
        resp = query.order("date", desc=True).range(offset, offset + page_size - 1).execute()
        return resp.data or []


@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
async def create_expense(
    body: ExpenseCreate,
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    _ensure_profile_exists(user_id, user.get("email", ""), db)
    expense_id = str(uuid.uuid4())
    now = _now()
    date_str = body.date.isoformat()

    data = {
        "id": expense_id,
        "user_id": user_id,
        "date": date_str,
        "amount": round(body.amount, 2),
        "category": body.category,
        "description": body.description or "",
        "created_at": now,
        "updated_at": now,
    }

    if db.mode == "sqlite":
        db.execute(
            """
            INSERT INTO expenses (id, user_id, date, amount, category, description, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                expense_id,
                user_id,
                date_str,
                data["amount"],
                data["category"],
                data["description"],
                now,
                now,
            ),
        )
        return db.fetchone("SELECT * FROM expenses WHERE id = ?", (expense_id,))
    else:
        resp = db.client.table("expenses").insert(data).execute()
        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to create expense")
        return resp.data[0]





def _csv_date(value: str):
    """Parse common bank-statement dates, preferring Indian day-first formats."""
    from datetime import date
    from dateutil import parser as date_parser

    raw = (value or "").strip()
    if not raw:
        raise ValueError("missing date")
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d %b %Y", "%d %B %Y"):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            pass
    # Reject ambiguous slash dates rather than silently swapping day and month.
    if "/" in raw and len(raw.split("/")) == 3:
        parts = raw.split("/")
        if len(parts[0]) <= 2 and len(parts[1]) <= 2:
            raise ValueError("ambiguous date; use YYYY-MM-DD or DD/MM/YYYY")
    try:
        return date_parser.parse(raw, dayfirst=True).date()
    except (ValueError, TypeError, OverflowError) as exc:
        raise ValueError("invalid date") from exc


def _csv_category(value: str, description: str) -> str:
    from models.common import VALID_EXPENSE_CATEGORIES

    raw = (value or "").strip().lower().replace(" ", "_").replace("&", "and")
    aliases = {
        "food": "convenience_food", "takeaway": "convenience_food",
        "takeout": "convenience_food", "food_delivery": "convenience_food",
        "restaurants": "dining_out", "restaurant": "dining_out",
        "grocery": "groceries", "fuel": "transport", "travel": "transport",
        "shopping": "shopping", "utility": "utilities", "utility_bill": "utilities",
        "bill": "bills", "medical": "healthcare", "pharmacy": "healthcare",
        "personalcare": "personal_care", "subscription": "subscriptions",
    }
    if raw in VALID_EXPENSE_CATEGORIES:
        return raw
    if raw in aliases:
        return aliases[raw]

    text = f"{value} {description}".lower()
    if any(word in text for word in ("swiggy", "zomato", "blinkit", "zepto", "food delivery", "takeaway", "takeout")):
        return "convenience_food"
    if any(word in text for word in ("grocery", "supermarket", "bigbasket", "dmart", "vegetable")):
        return "groceries"
    if any(word in text for word in ("uber", "ola", "metro", "bus", "train", "petrol", "fuel")):
        return "transport"
    if any(word in text for word in ("electricity", "water bill", "internet bill", "mobile recharge")):
        return "utilities"
    if any(word in text for word in ("netflix", "spotify", "subscription")):
        return "subscriptions"
    if any(word in text for word in ("restaurant", "cafe", "dining")):
        return "dining_out"
    return "other"


@router.post("/import-csv")
async def import_expenses_csv(
    request: Request,
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Import real, user-supplied bank/card transactions from a CSV statement.

    Accepted columns include date/transaction_date, amount/debit/withdrawal,
    description/narration/merchant, and optional category. No external account
    connection is made and no transaction is invented.
    """
    import csv
    import io
    import math

    raw = await request.body()
    if not raw:
        raise HTTPException(status_code=400, detail="The CSV file is empty.")
    if len(raw) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="CSV files must be 5 MB or smaller.")
    try:
        content = raw.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="Please export the statement as UTF-8 CSV.") from exc

    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="The CSV needs a header row.")
    normalized = {str(name).strip().lower().replace(" ", "_"): name for name in reader.fieldnames if name}
    date_col = next((normalized[k] for k in ("date", "transaction_date", "txn_date", "value_date", "posting_date") if k in normalized), None)
    desc_col = next((normalized[k] for k in ("description", "narration", "merchant", "details", "transaction_details", "particulars") if k in normalized), None)
    amount_col = next((normalized[k] for k in ("amount", "transaction_amount") if k in normalized), None)
    debit_col = next((normalized[k] for k in ("debit", "withdrawal", "withdrawals", "debit_amount") if k in normalized), None)
    credit_col = next((normalized[k] for k in ("credit", "deposit", "deposits", "credit_amount") if k in normalized), None)
    category_col = next((normalized[k] for k in ("category", "expense_category") if k in normalized), None)
    type_col = next((normalized[k] for k in ("type", "transaction_type", "dr_cr", "debit_credit", "transaction_kind") if k in normalized), None)

    if not date_col or not desc_col or not (amount_col or debit_col):
        raise HTTPException(
            status_code=400,
            detail="Required columns not found. Include date, description/narration, and amount or debit/withdrawal. Optional: category.",
        )

    rows = list(reader)
    if len(rows) > 5000:
        raise HTTPException(status_code=413, detail="Import up to 5,000 transactions at a time.")
    user_id = user["user_id"]
    email = user.get("email", "")
    _ensure_profile_exists(user_id, email, db)
    now = _now()
    imported = 0
    skipped = 0
    errors = []
    seen = set()
    from models.common import VALID_EXPENSE_CATEGORIES

    for line_number, row in enumerate(rows, start=2):
        try:
            date_value = (row.get(date_col) or "").strip()
            description = (row.get(desc_col) or "").strip()[:500]
            if type_col:
                transaction_type = (row.get(type_col) or "").strip().lower()
                if any(word in transaction_type for word in ("credit", "deposit", "income", "salary", "refund", "reversal")):
                    skipped += 1
                    continue
            if not description:
                description = "Bank statement transaction"
            # A separate debit column is the safest choice for bank exports.
            raw_amount = (row.get(debit_col) or "").strip() if debit_col else ""
            if raw_amount:
                amount_text = raw_amount
            elif amount_col:
                amount_text = (row.get(amount_col) or "").strip()
                if credit_col and (row.get(credit_col) or "").strip():
                    # In statements with separate debit/credit columns, ignore credits.
                    skipped += 1
                    continue
            else:
                skipped += 1
                continue

            amount_text = amount_text.replace(",", "").replace("₹", "").replace("INR", "").strip()
            if amount_text.startswith("(") and amount_text.endswith(")"):
                amount_text = "-" + amount_text[1:-1]
            amount = abs(float(amount_text))
            if not math.isfinite(amount) or amount <= 0:
                skipped += 1
                continue
            transaction_date = _csv_date(date_value)
            supplied_category = (row.get(category_col) or "").strip() if category_col else ""
            category = _csv_category(supplied_category, description)
            if category not in VALID_EXPENSE_CATEGORIES:
                category = "other"

            # Skip duplicate lines within this upload. Existing rows are not deduplicated
            # by amount/date/merchant because identical real purchases can occur.
            signature = (transaction_date.isoformat(), round(amount, 2), description.casefold(), category)
            if signature in seen:
                skipped += 1
                continue
            seen.add(signature)
            expense_id = str(uuid.uuid4())
            data = {
                "id": expense_id, "user_id": user_id,
                "date": transaction_date.isoformat(), "amount": round(amount, 2),
                "category": category, "description": description,
                "data_source": "bank_csv_import", "created_at": now, "updated_at": now,
            }
            if db.mode == "sqlite":
                db.execute(
                    """INSERT INTO expenses
                    (id, user_id, date, amount, category, description, data_source, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (data["id"], user_id, data["date"], data["amount"], data["category"],
                     data["description"], data["data_source"], now, now),
                )
            else:
                db.client.table("expenses").insert(data).execute()
            imported += 1
        except (ValueError, TypeError, OverflowError) as exc:
            skipped += 1
            if len(errors) < 10:
                errors.append({"line": line_number, "reason": str(exc)[:160]})

    return {
        "imported": imported,
        "skipped": skipped,
        "total_rows": len(rows),
        "source": "user_uploaded_bank_csv",
        "errors": errors,
        "note": "Transactions were imported only into the authenticated user's workspace. Review inferred categories before relying on insights.",
    }


@router.get("/{expense_id}", response_model=ExpenseOut)
async def get_expense(
    expense_id: str,
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    if db.mode == "sqlite":
        expense = db.fetchone(
            "SELECT * FROM expenses WHERE id = ? AND user_id = ?",
            (expense_id, user_id),
        )
    else:
        resp = (
            db.client.table("expenses")
            .select("*")
            .eq("id", expense_id)
            .eq("user_id", user_id)
            .execute()
        )
        expense = resp.data[0] if resp.data else None

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.put("/{expense_id}", response_model=ExpenseOut)
async def update_expense(
    expense_id: str,
    body: ExpenseUpdate,
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    # Check ownership
    if db.mode == "sqlite":
        existing = db.fetchone(
            "SELECT id FROM expenses WHERE id = ? AND user_id = ?",
            (expense_id, user_id),
        )
    else:
        resp = (
            db.client.table("expenses")
            .select("id")
            .eq("id", expense_id)
            .eq("user_id", user_id)
            .execute()
        )
        existing = resp.data[0] if resp.data else None

    if not existing:
        raise HTTPException(status_code=404, detail="Expense not found")

    now = _now()
    updates = {}
    if body.date is not None:
        updates["date"] = body.date.isoformat()
    if body.amount is not None:
        updates["amount"] = round(body.amount, 2)
    if body.category is not None:
        updates["category"] = body.category
    if body.description is not None:
        updates["description"] = body.description
    updates["updated_at"] = now

    if db.mode == "sqlite":
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [expense_id, user_id]
        db.execute(
            f"UPDATE expenses SET {set_clause} WHERE id = ? AND user_id = ?",
            tuple(values),
        )
        return db.fetchone("SELECT * FROM expenses WHERE id = ?", (expense_id,))
    else:
        db.client.table("expenses").update(updates).eq("id", expense_id).eq("user_id", user_id).execute()
        resp = db.client.table("expenses").select("*").eq("id", expense_id).eq("user_id", user_id).execute()
        return resp.data[0]


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: str,
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    if db.mode == "sqlite":
        res = db.fetchone(
            "SELECT id FROM expenses WHERE id = ? AND user_id = ?",
            (expense_id, user_id),
        )
        if not res:
            raise HTTPException(status_code=404, detail="Expense not found")
        db.execute(
            "DELETE FROM expenses WHERE id = ? AND user_id = ?",
            (expense_id, user_id),
        )
    else:
        resp = (
            db.client.table("expenses")
            .select("id")
            .eq("id", expense_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=404, detail="Expense not found")
        db.client.table("expenses").delete().eq("id", expense_id).eq("user_id", user_id).execute()
    return None