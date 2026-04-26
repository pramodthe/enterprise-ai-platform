"""
Basic HR assistant — one system prompt with mock company context and a single LLM call.
"""
import logging
import re
from pathlib import Path

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from backend.core.config import get_openai_client_args, settings

logger = logging.getLogger(__name__)

if not settings.openai_api_key:
    raise RuntimeError("OpenAI 'OPENAI_API_KEY' environment variable is not set.")


def _hr_chat_model() -> ChatOpenAI:
    """Build client per request so `backend/.env` edits apply after reload without stale clients."""
    args = get_openai_client_args()
    return ChatOpenAI(
        api_key=args["api_key"],
        base_url=args.get("base_url"),
        model=settings.openai_model,
        temperature=min(settings.openai_temperature, 0.7),
        max_tokens=min(settings.openai_max_tokens, 4096),
    )

# --- Mock company (demo only; not real data) ---------------------------------

MOCK_COMPANY_NAME = "Northbridge Labs"
MOCK_COMPANY_BLURB = """
You work for Northbridge Labs, a 220-person B2B software company headquartered in Austin, TX,
with a smaller office in Toronto. You are the internal HR copilot: warm, concise, and professional.
Only use the facts below and the sample directory; if something is not covered, say you do not
have that detail in the demo handbook and suggest the employee email HR at the company.

Company snapshot:
- Industry: analytics and workflow automation for mid-market finance teams.
- Work week: Monday–Friday; core collaboration hours 10:00–15:00 US Central.
- Office: hybrid — most roles 2 days/week in office (Tue–Wed by default), exceptions by manager approval.
- Time off: 20 days/year PTO (prorated first year), 10 company holidays, 8 sick days (honor system, no accrual cap in demo).
- Benefits (US): medical (80% employer-paid employee plan), dental, vision; 401(k) with 4% match after 90 days.
- Parental leave: 12 weeks primary / 4 weeks secondary (US); Canada follows provincial top-up (demo: use "ask People Ops" if pressed).
- Equipment: laptop + $500 home-office stipend on day one; refresh every 3 years.
- Learning: $1,200/year L&D budget; internal "Lunch & Learn" Thursdays.
- Performance: semi-annual check-ins; annual merit cycle in March.
- Internal HR contact (demo): peopleops@northbridge-labs.demo (not a real inbox).
"""

MOCK_EMPLOYEES: list[dict] = [
    {
        "id": "nb-001",
        "name": "Jordan Lee",
        "title": "Chief People Officer",
        "department": "HR",
        "email": "j.lee@northbridge-labs.demo",
        "location": "Austin, TX",
        "phone": "+1-512-555-0101",
        "skills": ["People strategy", "Compensation", "Coaching"],
        "manager": None,
        "avatar_url": None,
        "bio": "Runs People Ops and employee experience programs.",
    },
    {
        "id": "nb-014",
        "name": "Sam Rivera",
        "title": "Engineering Manager, Platform",
        "department": "Engineering",
        "email": "s.rivera@northbridge-labs.demo",
        "location": "Austin, TX",
        "phone": "+1-512-555-0114",
        "skills": ["Python", "Kubernetes", "Hiring"],
        "manager": "Jordan Lee",
        "avatar_url": None,
        "bio": "Leads the core platform squad.",
    },
    {
        "id": "nb-022",
        "name": "Avery Chen",
        "title": "Senior Product Designer",
        "department": "Design",
        "email": "a.chen@northbridge-labs.demo",
        "location": "Toronto, ON",
        "phone": "+1-416-555-0122",
        "skills": ["Figma", "Design systems", "Research"],
        "manager": "Sam Rivera",
        "avatar_url": None,
        "bio": "Owns design system adoption across product teams.",
    },
    {
        "id": "nb-031",
        "name": "Priya Desai",
        "title": "People Operations Specialist",
        "department": "HR",
        "email": "p.desai@northbridge-labs.demo",
        "location": "Austin, TX",
        "phone": "+1-512-555-0131",
        "skills": ["Onboarding", "HRIS", "Benefits admin"],
        "manager": "Jordan Lee",
        "avatar_url": None,
        "bio": "First point of contact for onboarding and benefits questions.",
    },
    {
        "id": "nb-048",
        "name": "Marcus Okafor",
        "title": "Director of Customer Success",
        "department": "Customer Success",
        "email": "m.okafor@northbridge-labs.demo",
        "location": "Austin, TX",
        "phone": "+1-512-555-0148",
        "skills": ["Account management", "Renewals", "Training"],
        "manager": None,
        "avatar_url": None,
        "bio": "Owns post-sales experience and CS hiring plan.",
    },
]


def _format_directory_for_prompt(people: list[dict]) -> str:
    lines = []
    for p in people:
        mgr = p.get("manager") or "—"
        skills = ", ".join(p.get("skills") or []) or "—"
        lines.append(
            f"- {p['name']} ({p['id']}): {p['title']}, {p.get('department', '')}; "
            f"email {p.get('email')}; location {p.get('location')}; manager: {mgr}; skills: {skills}"
        )
    return "\n".join(lines)


HR_SYSTEM_PROMPT = f"""{MOCK_COMPANY_BLURB.strip()}

Sample employee directory (use only these people when discussing individuals):
{_format_directory_for_prompt(MOCK_EMPLOYEES)}

Behavior:
- Answer in clear, friendly HR tone; short paragraphs or bullets when helpful.
- Ground answers in the mock facts above; do not invent new policies, numbers, or employees.
- If asked about something outside this demo context, explain the limit and offer what you can (e.g. general guidance + suggest peopleops@northbridge-labs.demo).
- Never claim this is legal advice; for sensitive matters, recommend speaking with People Ops or local counsel.
- Company name to use in prose: {MOCK_COMPANY_NAME}.
"""


def _normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9 ]+", " ", text.lower()).strip()


def get_people_data() -> list[dict]:
    return list(MOCK_EMPLOYEES)


def should_attach_people_cards(question: str) -> bool:
    """Skip profile cards for pure policy questions; show when the user is clearly looking up people."""
    n = _normalize(question)
    if not n:
        return False
    person_signals = (
        "who is",
        "who are",
        "find ",
        "contact",
        "email",
        "manager",
        "reports to",
        "org chart",
        "directory",
        "team in",
        "people in",
        "employees in",
        "jordan",
        "sam rivera",
        "avery",
        "priya",
        "marcus",
    )
    if any(s in n for s in person_signals):
        return True
    policy_only = (
        "benefit",
        "pto",
        "vacation",
        "policy",
        "handbook",
        "401",
        "insurance",
        "leave",
        "holiday",
        "parental",
        "sick day",
    )
    if any(s in n for s in policy_only) and not any(name in n for name in ["jordan", "sam", "avery", "priya", "marcus"]):
        return False
    return True


def _unique_people(people: list[dict]) -> list[dict]:
    seen: set[str] = set()
    out: list[dict] = []
    for person in people:
        pid = str(person.get("id") or person.get("name") or "")
        if pid in seen:
            continue
        seen.add(pid)
        out.append(person)
    return out


def select_people_for_query(question: str, response_text: str) -> list[dict]:
    haystack = _normalize(f"{question} {response_text}")
    people_data = get_people_data()
    name_matches = [
        p
        for p in people_data
        if _normalize(p.get("name", "")) and _normalize(p.get("name", "")) in haystack
    ]
    if name_matches:
        return _unique_people(name_matches)[:8]

    skill_matches = [
        p
        for p in people_data
        if any(
            (_normalize(s) in haystack)
            for s in (p.get("skills") or [])
            if _normalize(s)
        )
    ]
    if skill_matches:
        return _unique_people(skill_matches)[:8]

    dept_keywords = {
        "engineering": "Engineering",
        "design": "Design",
        "hr": "HR",
        "people": "HR",
        "customer success": "Customer Success",
    }
    for kw, dept in dept_keywords.items():
        if kw in haystack:
            dept_people = [x for x in people_data if x.get("department") == dept]
            return _unique_people(dept_people)[:8]

    if "c level" in haystack or "executive" in haystack or "leadership" in haystack:
        execs = [p for p in people_data if not p.get("manager")]
        return _unique_people(execs)[:8]

    return []


def get_hr_agent_response(question: str, session_id: str | None = None) -> str:
    """
    Single-turn reply from the HR assistant (session_id reserved for future use).
    """
    _ = session_id
    messages = [
        SystemMessage(content=HR_SYSTEM_PROMPT),
        HumanMessage(content=question.strip() or "Hello"),
    ]
    try:
        resp = _hr_chat_model().invoke(messages)
        content = resp.content
        if isinstance(content, list):
            # Some chat models return blocks
            text_parts = []
            for block in content:
                if isinstance(block, dict) and "text" in block:
                    text_parts.append(str(block["text"]))
                else:
                    text_parts.append(str(block))
            return "\n".join(text_parts).strip()
        return str(content).strip()
    except Exception:
        logger.exception("HR assistant LLM call failed")
        raise
