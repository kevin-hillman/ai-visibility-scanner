# Cost Tracking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Track every API call's token usage and cost, with admin dashboard, CLI tool, and budget warnings.

**Architecture:** New `api_call_costs` and `cost_budgets` tables store per-call cost data. The `LLMClient` extracts token counts from API responses, a `CostCalculator` service maps tokens to USD costs, and the `scan_worker` persists costs during scan execution. A new `/costs` API router serves aggregated data to an admin dashboard at `/admin/costs` and a CLI tool.

**Tech Stack:** Python/FastAPI/SQLAlchemy (backend), Next.js/React/TypeScript (frontend), `rich` (CLI), SQLite

---

### Task 1: Database Models

**Files:**
- Modify: `backend/app/models.py`

**Context:** The existing `models.py` has `Company`, `Scan`, `Lead` models using SQLAlchemy `DeclarativeBase` with `Mapped[]` type hints and UUID string primary keys. We add two new tables and extend `Scan`.

**Step 1: Add ApiCallCost and CostBudget models, extend Scan**

Add to `backend/app/models.py` after the `Scan` class:

```python
# --- Add to Scan class (2 new columns) ---
# Inside class Scan, after error_message field:
    total_cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_tokens_used: Mapped[int | None] = mapped_column(Float, nullable=True)


# --- New model: ApiCallCost ---
class ApiCallCost(Base):
    __tablename__ = "api_call_costs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    scan_id: Mapped[str] = mapped_column(String, ForeignKey("scans.id"), nullable=False)
    platform: Mapped[str] = mapped_column(String, nullable=False)
    model: Mapped[str] = mapped_column(String, nullable=False)
    query: Mapped[str] = mapped_column(Text, nullable=False)
    input_tokens: Mapped[int] = mapped_column(Float, default=0)
    output_tokens: Mapped[int] = mapped_column(Float, default=0)
    total_tokens: Mapped[int] = mapped_column(Float, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    latency_ms: Mapped[int] = mapped_column(Float, default=0)
    success: Mapped[bool] = mapped_column(String, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    scan: Mapped["Scan"] = relationship("Scan", backref="api_costs")

    __table_args__ = (
        Index("ix_api_call_costs_scan_id", "scan_id"),
        Index("ix_api_call_costs_platform", "platform"),
        Index("ix_api_call_costs_created_at", "created_at"),
    )


# --- New model: CostBudget ---
class CostBudget(Base):
    __tablename__ = "cost_budgets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    month: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    budget_usd: Mapped[float] = mapped_column(Float, nullable=False)
    warning_threshold: Mapped[float] = mapped_column(Float, default=0.8)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
```

**Note:** Use `Float` for integer token fields — SQLite has no strict int type, and SQLAlchemy `Integer` mapped to `Mapped[int]` requires an import we can avoid. The values are always whole numbers but stored as float. Actually, better: import `Integer` from sqlalchemy and use proper types. Let the implementer choose the cleanest approach.

**Step 2: Verify tables are created on startup**

The existing `create_tables()` in `database.py` already calls `Base.metadata.create_all()`, so new models are auto-created. Verify by restarting the backend and checking:

```bash
cd backend && ./venv/bin/python -c "
from app.database import create_tables
create_tables()
print('Tables created successfully')
"
```

**Step 3: Commit**

```bash
git add backend/app/models.py
git commit -m "feat: add ApiCallCost and CostBudget models, extend Scan with cost fields"
```

---

### Task 2: Cost Calculator Service

**Files:**
- Create: `backend/app/services/cost_calculator.py`
- Create: `backend/tests/test_cost_calculator.py`

**Context:** This service maps model names + token counts to USD costs. Pricing is per 1M tokens, split into input/output.

**Step 1: Write tests**

Create `backend/tests/test_cost_calculator.py`:

```python
import pytest
from app.services.cost_calculator import CostCalculator


class TestCostCalculator:
    def setup_method(self):
        self.calc = CostCalculator()

    def test_calculate_cost_openai(self):
        cost = self.calc.calculate_cost(
            model="gpt-4o",
            input_tokens=500,
            output_tokens=300
        )
        # gpt-4o: input $2.50/1M, output $10.00/1M
        expected = (500 * 2.50 / 1_000_000) + (300 * 10.00 / 1_000_000)
        assert abs(cost - expected) < 0.0001

    def test_calculate_cost_claude(self):
        cost = self.calc.calculate_cost(
            model="claude-sonnet-4-5-20250929",
            input_tokens=400,
            output_tokens=600
        )
        # claude-sonnet: input $3.00/1M, output $15.00/1M
        expected = (400 * 3.00 / 1_000_000) + (600 * 15.00 / 1_000_000)
        assert abs(cost - expected) < 0.0001

    def test_calculate_cost_gemini(self):
        cost = self.calc.calculate_cost(
            model="gemini-2.0-flash",
            input_tokens=1000,
            output_tokens=500
        )
        # gemini-2.0-flash: input $0.10/1M, output $0.40/1M
        expected = (1000 * 0.10 / 1_000_000) + (500 * 0.40 / 1_000_000)
        assert abs(cost - expected) < 0.0001

    def test_calculate_cost_perplexity(self):
        cost = self.calc.calculate_cost(
            model="sonar",
            input_tokens=800,
            output_tokens=400
        )
        # sonar: input $1.00/1M, output $1.00/1M
        expected = (800 * 1.00 / 1_000_000) + (400 * 1.00 / 1_000_000)
        assert abs(cost - expected) < 0.0001

    def test_calculate_cost_unknown_model_uses_fallback(self):
        cost = self.calc.calculate_cost(
            model="unknown-model-xyz",
            input_tokens=1000,
            output_tokens=500
        )
        # Fallback: input $5.00/1M, output $15.00/1M
        expected = (1000 * 5.00 / 1_000_000) + (500 * 15.00 / 1_000_000)
        assert abs(cost - expected) < 0.0001

    def test_estimate_tokens_from_text(self):
        text = "Dies ist ein Testtext mit einigen Wörtern."  # ~42 chars
        tokens = self.calc.estimate_tokens(text)
        # ~4 chars per token → ~10-11 tokens
        assert 8 <= tokens <= 15

    def test_get_pricing_returns_dict(self):
        pricing = self.calc.get_pricing()
        assert "gpt-4o" in pricing
        assert "input" in pricing["gpt-4o"]
        assert "output" in pricing["gpt-4o"]
```

**Step 2: Run tests to verify they fail**

```bash
cd backend && ./venv/bin/python -m pytest tests/test_cost_calculator.py -v
```
Expected: FAIL (module not found)

**Step 3: Implement CostCalculator**

Create `backend/app/services/cost_calculator.py`:

```python
"""
Cost Calculator Service.
Maps model names + token counts to USD costs.
"""


# Pricing per 1M tokens (USD)
MODEL_PRICING: dict[str, dict[str, float]] = {
    # OpenAI
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "gpt-4-turbo": {"input": 10.00, "output": 30.00},
    # Anthropic
    "claude-sonnet-4-5-20250929": {"input": 3.00, "output": 15.00},
    "claude-haiku-4-5-20251001": {"input": 0.80, "output": 4.00},
    # Google
    "gemini-2.0-flash": {"input": 0.10, "output": 0.40},
    "gemini-1.5-pro": {"input": 1.25, "output": 5.00},
    # Perplexity
    "sonar": {"input": 1.00, "output": 1.00},
    "sonar-pro": {"input": 3.00, "output": 15.00},
}

# Fallback for unknown models (conservative estimate)
FALLBACK_PRICING = {"input": 5.00, "output": 15.00}

# Average characters per token (for estimation when token counts unavailable)
CHARS_PER_TOKEN = 4


class CostCalculator:
    """Berechnet API-Kosten basierend auf Token-Verbrauch und Modell-Preislisten."""

    def calculate_cost(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int,
    ) -> float:
        """
        Berechnet die Kosten eines API-Calls in USD.

        Args:
            model: Model-ID (z.B. "gpt-4o")
            input_tokens: Anzahl Input-Tokens
            output_tokens: Anzahl Output-Tokens

        Returns:
            Kosten in USD
        """
        pricing = MODEL_PRICING.get(model, FALLBACK_PRICING)

        input_cost = input_tokens * pricing["input"] / 1_000_000
        output_cost = output_tokens * pricing["output"] / 1_000_000

        return input_cost + output_cost

    def estimate_tokens(self, text: str) -> int:
        """
        Schätzt die Token-Anzahl eines Texts (Fallback wenn API keine Counts liefert).

        Args:
            text: Der zu schätzende Text

        Returns:
            Geschätzte Token-Anzahl
        """
        return max(1, len(text) // CHARS_PER_TOKEN)

    def get_pricing(self) -> dict[str, dict[str, float]]:
        """Gibt die aktuelle Preisliste zurück."""
        return MODEL_PRICING.copy()
```

**Step 4: Run tests to verify they pass**

```bash
cd backend && ./venv/bin/python -m pytest tests/test_cost_calculator.py -v
```
Expected: All PASS

**Step 5: Commit**

```bash
git add backend/app/services/cost_calculator.py backend/tests/test_cost_calculator.py
git commit -m "feat: add CostCalculator service with model pricing"
```

---

### Task 3: Token Extraction in LLMClient

**Files:**
- Modify: `backend/app/services/llm_client.py`
- Create: `backend/tests/test_llm_token_extraction.py`

**Context:** Each `_query_*` method currently returns only the response text. We need to return token usage metadata too. The `query_platform()` method builds the response dict — we add `input_tokens`, `output_tokens`, `total_tokens` fields.

**Step 1: Modify `_query_chatgpt` to return tuple (text, usage)**

In `llm_client.py`, change `_query_chatgpt`:

```python
async def _query_chatgpt(self, query: str, model: str) -> tuple[str, dict[str, int]]:
    if not self.openai_client:
        raise ValueError("OpenAI API Key nicht konfiguriert")

    response = await self.openai_client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": query}
        ],
        temperature=0.7,
        max_tokens=1000,
    )

    usage = {}
    if response.usage:
        usage = {
            "input_tokens": response.usage.prompt_tokens,
            "output_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
        }

    return response.choices[0].message.content or "", usage
```

**Step 2: Modify `_query_claude` to return tuple (text, usage)**

```python
async def _query_claude(self, query: str, model: str) -> tuple[str, dict[str, int]]:
    if not self.anthropic_client:
        raise ValueError("Anthropic API Key nicht konfiguriert")

    message = await self.anthropic_client.messages.create(
        model=model,
        max_tokens=1000,
        system=self.system_prompt,
        messages=[
            {"role": "user", "content": query}
        ],
    )

    text_blocks = [
        block.text for block in message.content
        if hasattr(block, "text")
    ]

    usage = {
        "input_tokens": message.usage.input_tokens,
        "output_tokens": message.usage.output_tokens,
        "total_tokens": message.usage.input_tokens + message.usage.output_tokens,
    }

    return " ".join(text_blocks), usage
```

**Step 3: Modify `_query_gemini` to return tuple (text, usage)**

```python
async def _query_gemini(self, query: str, model: str) -> tuple[str, dict[str, int]]:
    if not self.settings.GOOGLE_API_KEY:
        raise ValueError("Google API Key nicht konfiguriert")

    loop = asyncio.get_event_loop()

    def sync_query():
        gemini_model = genai.GenerativeModel(model)
        full_prompt = f"{self.system_prompt}\n\n{query}"
        response = gemini_model.generate_content(full_prompt)

        usage = {}
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            meta = response.usage_metadata
            input_t = getattr(meta, "prompt_token_count", 0) or 0
            output_t = getattr(meta, "candidates_token_count", 0) or 0
            usage = {
                "input_tokens": input_t,
                "output_tokens": output_t,
                "total_tokens": input_t + output_t,
            }

        return response.text, usage

    return await loop.run_in_executor(None, sync_query)
```

**Step 4: Modify `_query_perplexity` to return tuple (text, usage)**

```python
async def _query_perplexity(self, query: str, model: str) -> tuple[str, dict[str, int]]:
    if not self.perplexity_api_key:
        raise ValueError("Perplexity API Key nicht konfiguriert")

    url = "https://api.perplexity.ai/chat/completions"

    headers = {
        "Authorization": f"Bearer {self.perplexity_api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": query}
        ],
        "temperature": 0.7,
        "max_tokens": 1000,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()

        data = response.json()
        text = data["choices"][0]["message"]["content"]

        usage = {}
        if "usage" in data:
            usage = {
                "input_tokens": data["usage"].get("prompt_tokens", 0),
                "output_tokens": data["usage"].get("completion_tokens", 0),
                "total_tokens": data["usage"].get("total_tokens", 0),
            }

        return text, usage
```

**Step 5: Update `query_platform` to include token data in response dict**

```python
async def query_platform(self, platform: str, query: str, model: str) -> dict[str, Any]:
    start_time = time.time()

    try:
        if platform == "chatgpt":
            response_text, usage = await self._query_chatgpt(query, model)
        elif platform == "claude":
            response_text, usage = await self._query_claude(query, model)
        elif platform == "gemini":
            response_text, usage = await self._query_gemini(query, model)
        elif platform == "perplexity":
            response_text, usage = await self._query_perplexity(query, model)
        else:
            raise ValueError(f"Unbekannte Plattform: {platform}")

        latency_ms = int((time.time() - start_time) * 1000)

        return {
            "platform": platform,
            "query": query,
            "model": model,
            "response_text": response_text,
            "success": True,
            "error": None,
            "latency_ms": latency_ms,
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0),
            "total_tokens": usage.get("total_tokens", 0),
        }

    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)

        return {
            "platform": platform,
            "query": query,
            "model": model,
            "response_text": "",
            "success": False,
            "error": str(e),
            "latency_ms": latency_ms,
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
        }
```

**Step 6: Run existing tests to verify nothing broke**

```bash
cd backend && ./venv/bin/python -m pytest tests/ -v
```

**Step 7: Commit**

```bash
git add backend/app/services/llm_client.py
git commit -m "feat: extract token usage from all LLM platform responses"
```

---

### Task 4: Scan Worker Integration

**Files:**
- Modify: `backend/app/workers/scan_worker.py`

**Context:** The `run_scan()` function loops through queries and calls `llm_client.query_all_platforms()`. After each batch we need to: (1) create `ApiCallCost` records, (2) at the end aggregate totals onto the `Scan`.

**Step 1: Modify run_scan to record costs**

Add imports at top of `scan_worker.py`:

```python
from app.models import Scan, Company, ApiCallCost
from app.services.cost_calculator import CostCalculator
```

Inside `run_scan()`, after `llm_client = LLMClient(settings)`:

```python
cost_calculator = CostCalculator()
```

Inside the `for platform_response in platform_responses:` loop, after `all_results.append(result)`, add cost recording:

```python
                # Kosten erfassen
                api_cost = ApiCallCost(
                    scan_id=scan_id,
                    platform=platform,
                    model=model_used,
                    query=query_text,
                    input_tokens=platform_response.get("input_tokens", 0),
                    output_tokens=platform_response.get("output_tokens", 0),
                    total_tokens=platform_response.get("total_tokens", 0),
                    cost_usd=cost_calculator.calculate_cost(
                        model=model_used,
                        input_tokens=platform_response.get("input_tokens", 0),
                        output_tokens=platform_response.get("output_tokens", 0),
                    ),
                    latency_ms=platform_response.get("latency_ms", 0),
                    success=platform_response.get("success", False),
                )
                db.add(api_cost)
```

Also record failed responses (currently skipped with `continue`). Move the cost recording BEFORE the `if not success: continue` check so we track failed calls too:

```python
            for platform_response in platform_responses:
                platform = platform_response.get("platform", "unknown")
                response_text = platform_response.get("response_text", "")
                model_used = platform_response.get("model", "unknown")

                # Kosten erfassen (auch für fehlgeschlagene Calls)
                api_cost = ApiCallCost(
                    scan_id=scan_id,
                    platform=platform,
                    model=model_used,
                    query=query_text,
                    input_tokens=platform_response.get("input_tokens", 0),
                    output_tokens=platform_response.get("output_tokens", 0),
                    total_tokens=platform_response.get("total_tokens", 0),
                    cost_usd=cost_calculator.calculate_cost(
                        model=model_used,
                        input_tokens=platform_response.get("input_tokens", 0),
                        output_tokens=platform_response.get("output_tokens", 0),
                    ),
                    latency_ms=platform_response.get("latency_ms", 0),
                    success=platform_response.get("success", False),
                )
                db.add(api_cost)

                # Skip failed responses for analysis
                if not platform_response.get("success", False):
                    continue

                # ... existing analysis code ...
```

Before `scan.status = "completed"`, aggregate costs onto the scan:

```python
        # Kosten aggregieren
        from sqlalchemy import func
        cost_totals = db.query(
            func.sum(ApiCallCost.cost_usd),
            func.sum(ApiCallCost.total_tokens),
        ).filter(ApiCallCost.scan_id == scan_id).first()

        scan.total_cost_usd = cost_totals[0] or 0.0
        scan.total_tokens_used = int(cost_totals[1] or 0)

        # Budget-Warnung prüfen
        _check_budget_warning(db, cost_calculator)
```

Add budget warning helper at module level:

```python
import logging

logger = logging.getLogger(__name__)


def _check_budget_warning(db: Session, cost_calculator: CostCalculator) -> None:
    """Prüft ob Monatsbudget-Schwelle überschritten ist und loggt Warnung."""
    from app.models import CostBudget
    from sqlalchemy import func

    now = datetime.utcnow()
    current_month = now.strftime("%Y-%m")

    budget = db.query(CostBudget).filter(CostBudget.month == current_month).first()
    if not budget:
        return

    month_total = db.query(func.sum(ApiCallCost.cost_usd)).filter(
        ApiCallCost.created_at >= now.replace(day=1, hour=0, minute=0, second=0)
    ).scalar() or 0.0

    ratio = month_total / budget.budget_usd if budget.budget_usd > 0 else 0
    if ratio >= budget.warning_threshold:
        logger.warning(
            f"BUDGET-WARNUNG: {ratio:.0%} des Monatsbudgets verbraucht "
            f"(${month_total:.4f} / ${budget.budget_usd:.2f})"
        )
```

**Step 2: Run existing tests**

```bash
cd backend && ./venv/bin/python -m pytest tests/ -v
```

**Step 3: Commit**

```bash
git add backend/app/workers/scan_worker.py
git commit -m "feat: record API call costs during scan execution with budget warnings"
```

---

### Task 5: Pydantic Schemas for Cost API

**Files:**
- Modify: `backend/app/schemas.py`

**Context:** Add response schemas for the cost endpoints.

**Step 1: Add cost schemas to schemas.py**

```python
# --- Cost Tracking Schemas ---

class ApiCallCostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    scan_id: str
    platform: str
    model: str
    query: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost_usd: float
    latency_ms: int
    success: bool
    created_at: datetime


class CostSummary(BaseModel):
    month: str
    total_cost_usd: float
    total_tokens: int
    total_calls: int
    avg_cost_per_scan: float
    platform_breakdown: dict[str, float]
    daily_costs: list[dict[str, float]]  # [{"date": "2026-02-17", "cost": 0.05}]


class ScanCostDetail(BaseModel):
    scan_id: str
    company_name: str
    total_cost_usd: float
    total_tokens: int
    total_calls: int
    platform_breakdown: dict[str, float]
    calls: list[ApiCallCostResponse]


class PlatformCostBreakdown(BaseModel):
    platform: str
    total_cost_usd: float
    total_tokens: int
    total_calls: int
    avg_cost_per_call: float


class BudgetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    month: str
    budget_usd: float
    warning_threshold: float
    spent_usd: float
    remaining_usd: float
    utilization: float  # 0.0 - 1.0+


class BudgetUpdate(BaseModel):
    budget_usd: float
    warning_threshold: float = 0.8
```

**Step 2: Commit**

```bash
git add backend/app/schemas.py
git commit -m "feat: add Pydantic schemas for cost tracking API"
```

---

### Task 6: Cost API Router

**Files:**
- Create: `backend/app/api/costs.py`
- Modify: `backend/app/api/router.py`

**Context:** New router at `/api/v1/costs/` with 5 endpoints. Register in the main router.

**Step 1: Create costs.py**

```python
"""
Cost Tracking API Router.
Endpunkte für Kostenübersicht, Scan-Details, Plattform-Breakdown und Budget-Verwaltung.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import ApiCallCost, CostBudget, Scan, Company
from app.schemas import (
    CostSummary,
    ScanCostDetail,
    PlatformCostBreakdown,
    BudgetResponse,
    BudgetUpdate,
    ApiCallCostResponse,
)

router = APIRouter()


@router.get("/summary", response_model=CostSummary)
def get_cost_summary(
    month: str = Query(default=None, description="Format: YYYY-MM"),
    db: Session = Depends(get_db),
):
    """Monatsübersicht der Kosten."""
    if not month:
        month = datetime.now(timezone.utc).strftime("%Y-%m")

    year, m = month.split("-")
    month_start = datetime(int(year), int(m), 1, tzinfo=timezone.utc)
    if int(m) == 12:
        month_end = datetime(int(year) + 1, 1, 1, tzinfo=timezone.utc)
    else:
        month_end = datetime(int(year), int(m) + 1, 1, tzinfo=timezone.utc)

    # Gesamtkosten
    totals = db.query(
        func.sum(ApiCallCost.cost_usd),
        func.sum(ApiCallCost.total_tokens),
        func.count(ApiCallCost.id),
    ).filter(
        ApiCallCost.created_at >= month_start,
        ApiCallCost.created_at < month_end,
    ).first()

    total_cost = totals[0] or 0.0
    total_tokens = int(totals[1] or 0)
    total_calls = totals[2] or 0

    # Anzahl Scans im Monat
    scan_count = db.query(func.count(Scan.id)).filter(
        Scan.started_at >= month_start,
        Scan.started_at < month_end,
        Scan.status == "completed",
    ).scalar() or 0

    avg_cost_per_scan = total_cost / scan_count if scan_count > 0 else 0.0

    # Platform Breakdown
    platform_rows = db.query(
        ApiCallCost.platform,
        func.sum(ApiCallCost.cost_usd),
    ).filter(
        ApiCallCost.created_at >= month_start,
        ApiCallCost.created_at < month_end,
    ).group_by(ApiCallCost.platform).all()

    platform_breakdown = {row[0]: round(row[1], 6) for row in platform_rows}

    # Daily costs
    daily_rows = db.query(
        func.date(ApiCallCost.created_at),
        func.sum(ApiCallCost.cost_usd),
    ).filter(
        ApiCallCost.created_at >= month_start,
        ApiCallCost.created_at < month_end,
    ).group_by(func.date(ApiCallCost.created_at)).order_by(func.date(ApiCallCost.created_at)).all()

    daily_costs = [{"date": str(row[0]), "cost": round(row[1], 6)} for row in daily_rows]

    return CostSummary(
        month=month,
        total_cost_usd=round(total_cost, 6),
        total_tokens=total_tokens,
        total_calls=total_calls,
        avg_cost_per_scan=round(avg_cost_per_scan, 6),
        platform_breakdown=platform_breakdown,
        daily_costs=daily_costs,
    )


@router.get("/by-scan/{scan_id}", response_model=ScanCostDetail)
def get_scan_costs(scan_id: str, db: Session = Depends(get_db)):
    """Kosten-Details eines einzelnen Scans."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Scan nicht gefunden")

    company = db.query(Company).filter(Company.id == scan.company_id).first()

    costs = db.query(ApiCallCost).filter(ApiCallCost.scan_id == scan_id).order_by(ApiCallCost.created_at).all()

    total_cost = sum(c.cost_usd for c in costs)
    total_tokens = sum(c.total_tokens for c in costs)

    platform_breakdown = {}
    for c in costs:
        platform_breakdown[c.platform] = platform_breakdown.get(c.platform, 0) + c.cost_usd

    return ScanCostDetail(
        scan_id=scan_id,
        company_name=company.name if company else "Unbekannt",
        total_cost_usd=round(total_cost, 6),
        total_tokens=int(total_tokens),
        total_calls=len(costs),
        platform_breakdown={k: round(v, 6) for k, v in platform_breakdown.items()},
        calls=costs,
    )


@router.get("/by-platform", response_model=list[PlatformCostBreakdown])
def get_platform_costs(
    from_date: str = Query(default=None, description="Format: YYYY-MM-DD"),
    to_date: str = Query(default=None, description="Format: YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """Kostenaufschlüsselung nach Plattform."""
    query = db.query(
        ApiCallCost.platform,
        func.sum(ApiCallCost.cost_usd),
        func.sum(ApiCallCost.total_tokens),
        func.count(ApiCallCost.id),
    )

    if from_date:
        query = query.filter(ApiCallCost.created_at >= from_date)
    if to_date:
        query = query.filter(ApiCallCost.created_at <= to_date)

    rows = query.group_by(ApiCallCost.platform).all()

    return [
        PlatformCostBreakdown(
            platform=row[0],
            total_cost_usd=round(row[1], 6),
            total_tokens=int(row[2]),
            total_calls=row[3],
            avg_cost_per_call=round(row[1] / row[3], 6) if row[3] > 0 else 0,
        )
        for row in rows
    ]


@router.get("/budget", response_model=BudgetResponse)
def get_budget(
    month: str = Query(default=None, description="Format: YYYY-MM"),
    db: Session = Depends(get_db),
):
    """Aktuelles Budget und Auslastung."""
    if not month:
        month = datetime.now(timezone.utc).strftime("%Y-%m")

    budget = db.query(CostBudget).filter(CostBudget.month == month).first()

    year, m = month.split("-")
    month_start = datetime(int(year), int(m), 1, tzinfo=timezone.utc)
    if int(m) == 12:
        month_end = datetime(int(year) + 1, 1, 1, tzinfo=timezone.utc)
    else:
        month_end = datetime(int(year), int(m) + 1, 1, tzinfo=timezone.utc)

    spent = db.query(func.sum(ApiCallCost.cost_usd)).filter(
        ApiCallCost.created_at >= month_start,
        ApiCallCost.created_at < month_end,
    ).scalar() or 0.0

    budget_usd = budget.budget_usd if budget else 0.0
    warning_threshold = budget.warning_threshold if budget else 0.8

    return BudgetResponse(
        month=month,
        budget_usd=budget_usd,
        warning_threshold=warning_threshold,
        spent_usd=round(spent, 6),
        remaining_usd=round(max(0, budget_usd - spent), 6),
        utilization=round(spent / budget_usd, 4) if budget_usd > 0 else 0.0,
    )


@router.put("/budget", response_model=BudgetResponse)
def set_budget(
    data: BudgetUpdate,
    month: str = Query(default=None, description="Format: YYYY-MM"),
    db: Session = Depends(get_db),
):
    """Monatsbudget setzen oder aktualisieren."""
    if not month:
        month = datetime.now(timezone.utc).strftime("%Y-%m")

    budget = db.query(CostBudget).filter(CostBudget.month == month).first()

    if budget:
        budget.budget_usd = data.budget_usd
        budget.warning_threshold = data.warning_threshold
    else:
        budget = CostBudget(
            month=month,
            budget_usd=data.budget_usd,
            warning_threshold=data.warning_threshold,
        )
        db.add(budget)

    db.commit()
    db.refresh(budget)

    # Return full response with spent data
    return get_budget(month=month, db=db)
```

**Step 2: Register in router.py**

Add to `backend/app/api/router.py`:

```python
from app.api import companies, scans, rankings, reports, leads, industries, costs

# ... existing includes ...

router.include_router(
    costs.router,
    prefix="/costs",
    tags=["costs"]
)
```

**Step 3: Test endpoints manually**

```bash
curl http://localhost:8000/api/v1/costs/summary
curl http://localhost:8000/api/v1/costs/budget
```

**Step 4: Commit**

```bash
git add backend/app/api/costs.py backend/app/api/router.py
git commit -m "feat: add cost tracking API endpoints"
```

---

### Task 7: CLI Tool

**Files:**
- Create: `backend/cli/__init__.py`
- Create: `backend/cli/costs.py`

**Context:** Command-line tool for quick cost overview. Uses `rich` for formatted tables. Reads directly from the database.

**Step 1: Install rich**

```bash
cd backend && ./venv/bin/pip install rich
```

**Step 2: Create CLI tool**

Create `backend/cli/__init__.py` (empty file).

Create `backend/cli/costs.py`:

```python
"""
CLI Tool für Kostenübersicht.

Usage:
    python -m cli.costs summary [--month YYYY-MM]
    python -m cli.costs detail <scan_id>
    python -m cli.costs budget set <amount> [--threshold 0.8]
    python -m cli.costs budget show [--month YYYY-MM]
"""
import sys
from datetime import datetime, timezone

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from sqlalchemy import func

from app.database import SessionLocal
from app.models import ApiCallCost, CostBudget, Scan, Company

console = Console()


def cmd_summary(month: str | None = None):
    """Monatsübersicht der API-Kosten."""
    if not month:
        month = datetime.now(timezone.utc).strftime("%Y-%m")

    db = SessionLocal()
    try:
        year, m = month.split("-")
        month_start = datetime(int(year), int(m), 1, tzinfo=timezone.utc)
        if int(m) == 12:
            month_end = datetime(int(year) + 1, 1, 1, tzinfo=timezone.utc)
        else:
            month_end = datetime(int(year), int(m) + 1, 1, tzinfo=timezone.utc)

        # Gesamtkosten
        totals = db.query(
            func.sum(ApiCallCost.cost_usd),
            func.sum(ApiCallCost.total_tokens),
            func.count(ApiCallCost.id),
        ).filter(
            ApiCallCost.created_at >= month_start,
            ApiCallCost.created_at < month_end,
        ).first()

        total_cost = totals[0] or 0.0
        total_tokens = int(totals[1] or 0)
        total_calls = totals[2] or 0

        # Scans
        scan_count = db.query(func.count(Scan.id)).filter(
            Scan.started_at >= month_start,
            Scan.started_at < month_end,
            Scan.status == "completed",
        ).scalar() or 0

        # KPIs
        console.print(Panel(f"[bold]Kostenübersicht {month}[/bold]", style="cyan"))
        console.print(f"  Gesamtkosten:     [bold green]${total_cost:.4f}[/bold green]")
        console.print(f"  API-Calls:        [bold]{total_calls}[/bold]")
        console.print(f"  Tokens gesamt:    [bold]{total_tokens:,}[/bold]")
        console.print(f"  Scans:            [bold]{scan_count}[/bold]")
        if scan_count > 0:
            console.print(f"  Ø pro Scan:       [bold]${total_cost / scan_count:.4f}[/bold]")
        console.print()

        # Platform Breakdown
        platform_rows = db.query(
            ApiCallCost.platform,
            func.sum(ApiCallCost.cost_usd),
            func.sum(ApiCallCost.total_tokens),
            func.count(ApiCallCost.id),
        ).filter(
            ApiCallCost.created_at >= month_start,
            ApiCallCost.created_at < month_end,
        ).group_by(ApiCallCost.platform).all()

        if platform_rows:
            table = Table(title="Kosten pro Plattform")
            table.add_column("Plattform", style="cyan")
            table.add_column("Kosten", justify="right", style="green")
            table.add_column("Tokens", justify="right")
            table.add_column("Calls", justify="right")

            for row in platform_rows:
                table.add_row(row[0], f"${row[1]:.4f}", f"{int(row[2]):,}", str(row[3]))

            console.print(table)

        # Budget
        budget = db.query(CostBudget).filter(CostBudget.month == month).first()
        if budget:
            ratio = total_cost / budget.budget_usd if budget.budget_usd > 0 else 0
            color = "green" if ratio < budget.warning_threshold else "yellow" if ratio < 1.0 else "red"
            console.print(f"\n  Budget:           ${budget.budget_usd:.2f}")
            console.print(f"  Auslastung:       [{color}]{ratio:.0%}[/{color}]")

    finally:
        db.close()


def cmd_detail(scan_id: str):
    """Kosten-Details eines Scans."""
    db = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            console.print(f"[red]Scan '{scan_id}' nicht gefunden[/red]")
            return

        company = db.query(Company).filter(Company.id == scan.company_id).first()
        costs = db.query(ApiCallCost).filter(ApiCallCost.scan_id == scan_id).order_by(ApiCallCost.created_at).all()

        console.print(Panel(
            f"[bold]{company.name if company else 'Unbekannt'}[/bold] — Scan {scan_id[:8]}...",
            style="cyan"
        ))

        if not costs:
            console.print("  Keine Kostendaten vorhanden")
            return

        table = Table(title=f"API-Calls ({len(costs)} gesamt)")
        table.add_column("Plattform", style="cyan")
        table.add_column("Model")
        table.add_column("Query", max_width=40)
        table.add_column("Tokens", justify="right")
        table.add_column("Kosten", justify="right", style="green")
        table.add_column("ms", justify="right")

        for c in costs:
            table.add_row(
                c.platform,
                c.model,
                c.query[:40] + "..." if len(c.query) > 40 else c.query,
                str(int(c.total_tokens)),
                f"${c.cost_usd:.6f}",
                str(int(c.latency_ms)),
            )

        console.print(table)

        total = sum(c.cost_usd for c in costs)
        console.print(f"\n  [bold]Gesamt: ${total:.4f}[/bold]")

    finally:
        db.close()


def cmd_budget_set(amount: float, threshold: float = 0.8):
    """Monatsbudget setzen."""
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    db = SessionLocal()
    try:
        budget = db.query(CostBudget).filter(CostBudget.month == month).first()
        if budget:
            budget.budget_usd = amount
            budget.warning_threshold = threshold
        else:
            budget = CostBudget(month=month, budget_usd=amount, warning_threshold=threshold)
            db.add(budget)
        db.commit()
        console.print(f"[green]Budget für {month} gesetzt: ${amount:.2f} (Warnung bei {threshold:.0%})[/green]")
    finally:
        db.close()


def cmd_budget_show(month: str | None = None):
    """Budget anzeigen."""
    if not month:
        month = datetime.now(timezone.utc).strftime("%Y-%m")
    db = SessionLocal()
    try:
        budget = db.query(CostBudget).filter(CostBudget.month == month).first()
        if not budget:
            console.print(f"[yellow]Kein Budget für {month} definiert[/yellow]")
            return
        console.print(f"  Monat:     {budget.month}")
        console.print(f"  Budget:    ${budget.budget_usd:.2f}")
        console.print(f"  Schwelle:  {budget.warning_threshold:.0%}")
    finally:
        db.close()


def main():
    args = sys.argv[1:]

    if not args or args[0] == "help":
        console.print(__doc__)
        return

    if args[0] == "summary":
        month = args[2] if len(args) > 2 and args[1] == "--month" else None
        cmd_summary(month)
    elif args[0] == "detail" and len(args) > 1:
        cmd_detail(args[1])
    elif args[0] == "budget":
        if len(args) > 1 and args[1] == "set" and len(args) > 2:
            threshold = float(args[4]) if len(args) > 4 and args[3] == "--threshold" else 0.8
            cmd_budget_set(float(args[2]), threshold)
        else:
            month = args[3] if len(args) > 3 and args[2] == "--month" else None
            cmd_budget_show(month)
    else:
        console.print(f"[red]Unbekannter Befehl: {args[0]}[/red]")
        console.print(__doc__)


if __name__ == "__main__":
    main()
```

**Step 3: Test CLI**

```bash
cd backend && ./venv/bin/python -m cli.costs summary
cd backend && ./venv/bin/python -m cli.costs budget set 50.00
cd backend && ./venv/bin/python -m cli.costs budget show
```

**Step 4: Commit**

```bash
git add backend/cli/
git commit -m "feat: add CLI tool for cost tracking overview"
```

---

### Task 8: Frontend TypeScript Types + API Client

**Files:**
- Modify: `frontend/src/lib/api.ts`

**Context:** Add TypeScript interfaces matching the backend schemas and fetch functions for the cost endpoints.

**Step 1: Add cost types and API functions to api.ts**

```typescript
// --- Cost Tracking Types ---

export interface ApiCallCostEntry {
  id: string;
  scan_id: string;
  platform: string;
  model: string;
  query: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  latency_ms: number;
  success: boolean;
  created_at: string;
}

export interface CostSummary {
  month: string;
  total_cost_usd: number;
  total_tokens: number;
  total_calls: number;
  avg_cost_per_scan: number;
  platform_breakdown: Record<string, number>;
  daily_costs: Array<{ date: string; cost: number }>;
}

export interface ScanCostDetail {
  scan_id: string;
  company_name: string;
  total_cost_usd: number;
  total_tokens: number;
  total_calls: number;
  platform_breakdown: Record<string, number>;
  calls: ApiCallCostEntry[];
}

export interface PlatformCostBreakdown {
  platform: string;
  total_cost_usd: number;
  total_tokens: number;
  total_calls: number;
  avg_cost_per_call: number;
}

export interface BudgetInfo {
  month: string;
  budget_usd: number;
  warning_threshold: number;
  spent_usd: number;
  remaining_usd: number;
  utilization: number;
}

// --- Cost API Functions ---

export async function fetchCostSummary(month?: string): Promise<CostSummary> {
  const params = month ? `?month=${month}` : '';
  const response = await fetch(`${API_BASE}/costs/summary${params}`);
  if (!response.ok) throw new Error(`Failed to fetch cost summary: ${response.statusText}`);
  return response.json();
}

export async function fetchScanCosts(scanId: string): Promise<ScanCostDetail> {
  const response = await fetch(`${API_BASE}/costs/by-scan/${scanId}`);
  if (!response.ok) throw new Error(`Failed to fetch scan costs: ${response.statusText}`);
  return response.json();
}

export async function fetchPlatformCosts(from?: string, to?: string): Promise<PlatformCostBreakdown[]> {
  const params = new URLSearchParams();
  if (from) params.set('from_date', from);
  if (to) params.set('to_date', to);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE}/costs/by-platform${qs}`);
  if (!response.ok) throw new Error(`Failed to fetch platform costs: ${response.statusText}`);
  return response.json();
}

export async function fetchBudget(month?: string): Promise<BudgetInfo> {
  const params = month ? `?month=${month}` : '';
  const response = await fetch(`${API_BASE}/costs/budget${params}`);
  if (!response.ok) throw new Error(`Failed to fetch budget: ${response.statusText}`);
  return response.json();
}

export async function updateBudget(budgetUsd: number, warningThreshold: number = 0.8, month?: string): Promise<BudgetInfo> {
  const params = month ? `?month=${month}` : '';
  const response = await fetch(`${API_BASE}/costs/budget${params}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ budget_usd: budgetUsd, warning_threshold: warningThreshold }),
  });
  if (!response.ok) throw new Error(`Failed to update budget: ${response.statusText}`);
  return response.json();
}
```

**Step 2: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat: add cost tracking TypeScript types and API client"
```

---

### Task 9: Admin Cost Dashboard Page

**Files:**
- Create: `frontend/src/app/admin/costs/page.tsx`
- Create: `frontend/src/app/admin/costs/CostDashboardClient.tsx`

**Context:** Server component page at `/admin/costs` that renders a client component with the cost dashboard. Uses the same design system as the rest of the app (teal accents, light/dark mode, same card/section patterns seen in the report page).

**Step 1: Create server page**

Create `frontend/src/app/admin/costs/page.tsx`:

```tsx
import { Metadata } from 'next';
import CostDashboardClient from './CostDashboardClient';

export const metadata: Metadata = {
  title: 'Kostenübersicht — Admin',
  robots: 'noindex, nofollow',
};

export default function CostDashboardPage() {
  return <CostDashboardClient />;
}
```

**Step 2: Create client component**

Create `frontend/src/app/admin/costs/CostDashboardClient.tsx`:

This is a large component. Key sections:
1. KPI cards row (Monatskosten, API-Calls, Ø/Scan, Budget-Auslastung)
2. Platform breakdown (horizontal bars)
3. Daily cost chart (CSS bars)
4. Recent scans table with costs
5. Budget management (set/view)

```tsx
'use client';

import { useEffect, useState } from 'react';
import {
  fetchCostSummary,
  fetchBudget,
  updateBudget,
  type CostSummary,
  type BudgetInfo,
} from '@/lib/api';

function formatUSD(value: number): string {
  return `$${value.toFixed(4)}`;
}

function KpiCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-5">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}

function PlatformBreakdown({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 0.0001);

  const platformColors: Record<string, string> = {
    chatgpt: 'bg-green-500',
    claude: 'bg-orange-500',
    gemini: 'bg-blue-500',
    perplexity: 'bg-purple-500',
  };

  return (
    <div className="space-y-3">
      {entries.map(([platform, cost]) => (
        <div key={platform}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700 dark:text-gray-300 capitalize">{platform}</span>
            <span className="text-gray-500 dark:text-gray-400 tabular-nums">{formatUSD(cost)}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${platformColors[platform] || 'bg-teal-500'}`}
              style={{ width: `${(cost / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DailyCostChart({ data }: { data: Array<{ date: string; cost: number }> }) {
  if (data.length === 0) return <div className="text-sm text-gray-400">Keine Daten</div>;

  const max = Math.max(...data.map((d) => d.cost), 0.0001);

  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((day) => (
        <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full">
          <div
            className="w-full bg-teal-500 rounded-t min-h-[2px]"
            style={{ height: `${(day.cost / max) * 100}%` }}
            title={`${day.date}: ${formatUSD(day.cost)}`}
          />
          <div className="text-[10px] text-gray-400 mt-1 truncate w-full text-center">
            {day.date.slice(-2)}
          </div>
        </div>
      ))}
    </div>
  );
}

function BudgetSection({ budget, onUpdate }: { budget: BudgetInfo | null; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return;
    setSaving(true);
    try {
      await updateBudget(value);
      setEditing(false);
      onUpdate();
    } finally {
      setSaving(false);
    }
  };

  if (!budget || budget.budget_usd === 0) {
    return (
      <div className="text-center py-4">
        {editing ? (
          <div className="flex items-center gap-2 justify-center">
            <input
              type="number"
              step="0.01"
              placeholder="Budget in USD"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f1117] text-gray-900 dark:text-white text-sm w-32"
            />
            <button onClick={handleSave} disabled={saving} className="px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50">
              Setzen
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-sm text-teal-600 dark:text-teal-400 hover:underline">
            Monatsbudget festlegen
          </button>
        )}
      </div>
    );
  }

  const color = budget.utilization < budget.warning_threshold
    ? 'text-emerald-600 dark:text-emerald-400'
    : budget.utilization < 1.0
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-rose-600 dark:text-rose-400';

  const barColor = budget.utilization < budget.warning_threshold
    ? 'bg-emerald-500'
    : budget.utilization < 1.0
      ? 'bg-yellow-500'
      : 'bg-rose-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-700 dark:text-gray-300">
          {formatUSD(budget.spent_usd)} / {formatUSD(budget.budget_usd)}
        </span>
        <span className={`font-semibold ${color}`}>{(budget.utilization * 100).toFixed(0)}%</span>
      </div>
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(budget.utilization * 100, 100)}%` }}
        />
      </div>
      {budget.utilization >= budget.warning_threshold && (
        <div className={`mt-2 text-xs ${color}`}>
          {budget.utilization >= 1.0 ? 'Budget überschritten!' : 'Budget-Warnung: Schwelle erreicht'}
        </div>
      )}
    </div>
  );
}

export default function CostDashboardClient() {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [budget, setBudget] = useState<BudgetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, b] = await Promise.all([fetchCostSummary(), fetchBudget()]);
      setSummary(s);
      setBudget(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-6 text-center">
          <p className="text-rose-600 dark:text-rose-400">{error}</p>
          <button onClick={loadData} className="mt-3 text-sm text-teal-600 hover:underline">Erneut versuchen</button>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="text-sm font-medium text-teal-600 dark:text-teal-400 tracking-wide uppercase mb-2">Admin</div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Kostenübersicht</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{summary.month}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Monatskosten" value={formatUSD(summary.total_cost_usd)} />
        <KpiCard label="API-Calls" value={summary.total_calls.toLocaleString()} subtitle={`${summary.total_tokens.toLocaleString()} Tokens`} />
        <KpiCard label="Ø pro Scan" value={formatUSD(summary.avg_cost_per_scan)} />
        <KpiCard
          label="Budget"
          value={budget && budget.budget_usd > 0 ? `${(budget.utilization * 100).toFixed(0)}%` : '–'}
          subtitle={budget && budget.budget_usd > 0 ? `${formatUSD(budget.spent_usd)} / ${formatUSD(budget.budget_usd)}` : 'Nicht gesetzt'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Platform Breakdown */}
        <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kosten pro Plattform</h2>
          <PlatformBreakdown data={summary.platform_breakdown} />
        </div>

        {/* Daily Chart */}
        <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tägliche Kosten</h2>
          <DailyCostChart data={summary.daily_costs} />
        </div>
      </div>

      {/* Budget Section */}
      <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monatsbudget</h2>
        <BudgetSection budget={budget} onUpdate={loadData} />
      </div>
    </div>
  );
}
```

**Step 3: Verify build**

```bash
cd frontend && npx tsc --noEmit && npm run build
```

**Step 4: Commit**

```bash
git add frontend/src/app/admin/costs/
git commit -m "feat: add admin cost dashboard page"
```

---

### Task 10: Integration Test — Full Scan with Cost Tracking

**Files:**
- Modify: `backend/tests/test_api.py` (or create `backend/tests/test_cost_tracking.py`)

**Context:** Verify the full flow: after a scan completes, `api_call_costs` records exist and the cost API endpoints return data.

**Step 1: Write integration test**

Create `backend/tests/test_cost_tracking.py`:

```python
"""Integration tests for cost tracking."""
import pytest
from datetime import datetime, timezone
from app.models import ApiCallCost, CostBudget, Scan, Company
from app.services.cost_calculator import CostCalculator


class TestCostModels:
    """Test that cost models can be created and queried."""

    def test_create_api_call_cost(self, test_db):
        # Create company + scan first
        company = Company(domain="test.de", name="TestCo", industry_id="test")
        test_db.add(company)
        test_db.flush()

        scan = Scan(company_id=company.id, industry_id="test", status="completed")
        test_db.add(scan)
        test_db.flush()

        cost = ApiCallCost(
            scan_id=scan.id,
            platform="chatgpt",
            model="gpt-4o",
            query="Test query",
            input_tokens=500,
            output_tokens=300,
            total_tokens=800,
            cost_usd=0.004250,
            latency_ms=1200,
            success=True,
        )
        test_db.add(cost)
        test_db.commit()

        # Query back
        saved = test_db.query(ApiCallCost).first()
        assert saved is not None
        assert saved.platform == "chatgpt"
        assert saved.total_tokens == 800
        assert saved.cost_usd == pytest.approx(0.004250)

    def test_create_cost_budget(self, test_db):
        budget = CostBudget(
            month="2026-02",
            budget_usd=50.00,
            warning_threshold=0.8,
        )
        test_db.add(budget)
        test_db.commit()

        saved = test_db.query(CostBudget).first()
        assert saved.month == "2026-02"
        assert saved.budget_usd == 50.00


class TestCostApiEndpoints:
    """Test cost API endpoints."""

    def test_get_summary_empty(self, client):
        response = client.get("/api/v1/costs/summary")
        assert response.status_code == 200
        data = response.json()
        assert data["total_cost_usd"] == 0.0
        assert data["total_calls"] == 0

    def test_get_budget_empty(self, client):
        response = client.get("/api/v1/costs/budget")
        assert response.status_code == 200
        data = response.json()
        assert data["budget_usd"] == 0.0

    def test_set_budget(self, client):
        response = client.put(
            "/api/v1/costs/budget",
            json={"budget_usd": 50.0, "warning_threshold": 0.8},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["budget_usd"] == 50.0

    def test_get_platform_costs_empty(self, client):
        response = client.get("/api/v1/costs/by-platform")
        assert response.status_code == 200
        assert response.json() == []
```

**Step 2: Run tests**

```bash
cd backend && ./venv/bin/python -m pytest tests/test_cost_tracking.py -v
```

**Step 3: Commit**

```bash
git add backend/tests/test_cost_tracking.py
git commit -m "test: add integration tests for cost tracking"
```
