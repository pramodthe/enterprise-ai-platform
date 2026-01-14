"""
HR Agent for the Enterprise AI Assistant Platform
"""
import csv
import os
import logging
import re
from functools import lru_cache
from pathlib import Path
from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain_core.messages import AIMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver

# Load environment variables first
load_dotenv()

# Import Opik tracing utilities
from backend.core.opik_config import is_tracing_enabled

# Configure logging
logger = logging.getLogger(__name__)

openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("OpenAI 'OPENAI_API_KEY' environment variable is not set.")

llm = ChatOpenAI(
    openai_api_key=openai_api_key,
    model=os.getenv("OPENAI_MODEL", os.getenv("DEFAULT_MODEL", "gpt-4o-mini")),
    temperature=0.3,
)

EMPLOYEE_DATA_PATH = Path(
    os.getenv(
        "EMPLOYEE_DATA_PATH",
        Path(__file__).resolve().parents[1] / "data" / "employee_directory.csv",
    )
)


def _parse_skills(raw: str) -> list[str]:
    if not raw:
        return []
    return [skill.strip() for skill in raw.split("|") if skill.strip()]


@lru_cache(maxsize=1)
def load_employee_directory() -> list[dict]:
    if not EMPLOYEE_DATA_PATH.exists():
        raise RuntimeError(f"Employee dataset not found at {EMPLOYEE_DATA_PATH}")

    employees: list[dict] = []
    with EMPLOYEE_DATA_PATH.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            if not row.get("id") or not row.get("name"):
                continue
            employees.append(
                {
                    "id": row["id"].strip(),
                    "name": row["name"].strip(),
                    "title": row.get("title", "").strip(),
                    "department": row.get("department", "").strip(),
                    "email": row.get("email") or None,
                    "location": row.get("location") or None,
                    "phone": row.get("phone") or None,
                    "skills": _parse_skills(row.get("skills", "")),
                    "manager": row.get("manager") or None,
                    "avatar_url": row.get("avatar_url") or None,
                    "bio": row.get("bio") or None,
                }
            )
    return employees


def get_people_data() -> list[dict]:
    return load_employee_directory()

EXEC_TITLES = {"CEO", "CTO", "CPO", "CMO"}

DEPARTMENT_KEYWORDS = {
    "engineering": "Engineering",
    "product": "Product",
    "marketing": "Marketing",
    "design": "Design",
    "analytics": "Analytics",
    "executive": "Executive",
}

LEADERSHIP_KEYWORDS = {
    "leadership",
    "executive",
    "management",
    "org chart",
    "organization",
    "leaders",
    "team leads",
}

TITLE_ALIASES = {
    "ceo": "CEO",
    "chief executive officer": "CEO",
    "cto": "CTO",
    "chief technology officer": "CTO",
    "cpo": "CPO",
    "chief product officer": "CPO",
    "cmo": "CMO",
    "chief marketing officer": "CMO",
}

POLICY_KEYWORDS = {
    "policy",
    "handbook",
    "benefit",
    "benefits",
    "vacation",
    "pto",
    "leave",
    "remote work",
    "insurance",
    "procedure",
    "guideline",
    "onboarding",
}

JOB_DESCRIPTION_KEYWORDS = {
    "job description",
    "jd",
    "responsibilities",
    "requirements",
    "qualifications",
    "candidate profile",
    "hiring",
    "recruiting",
}


def _normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9 ]+", " ", text.lower()).strip()

def is_job_description_query(question: str) -> bool:
    normalized = _normalize(question)
    if "job description" in normalized:
        return True
    tokens = normalized.split()
    if "jd" in tokens:
        return True
    return any(keyword in normalized for keyword in JOB_DESCRIPTION_KEYWORDS)


def should_attach_people_cards(question: str) -> bool:
    normalized = _normalize(question)
    if any(keyword in normalized for keyword in POLICY_KEYWORDS):
        return False
    if is_job_description_query(normalized):
        return False
    return True


def _format_person_line(person: dict) -> str:
    name = person.get("name", "Unknown")
    person_id = person.get("id")
    title = person.get("title", "Unknown title")
    department = person.get("department", "Unknown department")
    skills = person.get("skills", [])
    label = f"{name} (ID: {person_id})" if person_id else name
    skills_text = ", ".join(skills) if skills else "N/A"
    return f"{label} - {title}, Department: {department}, Skills: {skills_text}"


def _unique_people(people: list[dict]) -> list[dict]:
    seen = set()
    unique_list = []
    for person in people:
        pid = person.get("id") or person.get("name")
        if pid in seen:
            continue
        seen.add(pid)
        unique_list.append(person)
    return unique_list


def build_org_lines(people_data: list[dict]) -> list[str]:
    by_manager: dict[str, list[str]] = {}
    for person in people_data:
        manager = person.get("manager")
        if manager:
            by_manager.setdefault(manager, []).append(person.get("name", ""))

    lines: list[str] = []
    top_level = [person for person in people_data if not person.get("manager")]
    for leader in top_level:
        leader_name = leader.get("name", "Unknown")
        title = leader.get("title", "Leader")
        reports = [name for name in by_manager.get(leader_name, []) if name]
        if reports:
            lines.append(f"- {title}: {leader_name} (manages: {', '.join(reports)})")
        else:
            lines.append(f"- {title}: {leader_name}")

    if not lines:
        lines.append("- No org chart data available.")

    return lines


def select_people_for_query(question: str, response_text: str) -> list[dict]:
    haystack = _normalize(f"{question} {response_text}")
    people_data = get_people_data()
    for alias, title in TITLE_ALIASES.items():
        if alias in haystack:
            return [person for person in people_data if person.get("title") == title][:1]

    name_matches = [
        person for person in people_data
        if _normalize(person.get("name", "")) and _normalize(person.get("name", "")) in haystack
    ]
    if name_matches:
        return _unique_people(name_matches)[:8]

    skill_matches = [
        person for person in people_data
        if any(_normalize(skill) in haystack for skill in person.get("skills", []))
    ]
    if skill_matches:
        return _unique_people(skill_matches)[:8]

    for keyword, department in DEPARTMENT_KEYWORDS.items():
        if keyword in haystack:
            dept_people = [person for person in people_data if person.get("department") == department]
            if "lead" in haystack or "leader" in haystack:
                dept_people = [
                    person for person in dept_people
                    if any(token in person.get("title", "") for token in ["Lead", "Manager", "Director", "Chief"])
                ]
            return _unique_people(dept_people)[:8]

    if any(keyword in haystack for keyword in LEADERSHIP_KEYWORDS):
        leaders = [person for person in people_data if person.get("title") in EXEC_TITLES]
        return leaders[:8]

    return []

@tool("search_employee_directory")
def search_employee_directory(query: str) -> str:
    """
    Search the employee directory for matching people.
    """
    matches = select_people_for_query(query, "")
    if not matches:
        return "No matching employees found in the directory."
    return "\n".join(_format_person_line(person) for person in matches)


@tool("get_org_chart")
def get_org_chart(_: str = "") -> str:
    """
    Return a simple org chart based on manager relationships in the directory.
    """
    people_data = get_people_data()
    return "\n".join(build_org_lines(people_data))

@tool("search_company_documents")
def search_company_documents(query: str) -> str:
    """
    Search company documents for policies, procedures, and guidelines.
    Use this tool when you need to look up HR policies, benefits information,
    procedures, or any other company documentation.
    
    Args:
        query: The search query for company documents (e.g., "PTO policy", "remote work guidelines")
    
    Returns:
        str: The relevant information from company documents
    """
    try:
        # Import here to avoid circular dependency
        from backend.agents.document_agent import get_document_response
        
        logger.info(f"HR agent querying document agent: {query}")
        answer, sources = get_document_response(query)
        
        # Format the response with sources
        if sources:
            source_list = ", ".join(set(sources))
            return f"{answer}\n\nSources: {source_list}"
        return answer
        
    except Exception as e:
        logger.error(f"Error querying document agent: {e}")
        return f"I couldn't access the company documents at this time. Error: {str(e)}"

TOOLS = [search_employee_directory, get_org_chart, search_company_documents]
_AGENT_GRAPH = None
_CHECKPOINTER = InMemorySaver()


def get_agent_graph():
    global _AGENT_GRAPH
    if _AGENT_GRAPH is None:
        system_prompt = (
            "You are an HR assistant for an enterprise platform. "
            "Use search_employee_directory for employee lookups, "
            "get_org_chart for org structure, and search_company_documents "
            "for policy/benefits questions. Do not invent employees. "
            "If a person is not found, say so."
        )
        _AGENT_GRAPH = create_agent(
            model=llm,
            tools=TOOLS,
            system_prompt=system_prompt,
            checkpointer=_CHECKPOINTER,
            name="hr_agent",
        )
    return _AGENT_GRAPH


def get_hr_agent_response(question: str, session_id: str | None = None) -> str:
    """
    Get response from HR agent for a specific question.
    
    This function is traced with Opik when tracing is enabled.
    """
    graph = get_agent_graph()
    session_key = session_id or "global"
    config = {"configurable": {"thread_id": session_key}}

    if is_tracing_enabled():
        try:
            from opik.integrations.langchain import OpikTracer

            project_name = os.getenv("OPIK_PROJECT_NAME", "enterprise-ai-assistant")
            config["callbacks"] = [OpikTracer(project_name=project_name)]
        except ImportError:
            logger.debug("Opik package not available. Running without tracing.")
        except Exception as exc:
            logger.warning(
                "Failed to initialize Opik tracing: %s. Running without tracing.",
                exc,
            )

    result = graph.invoke(
        {"messages": [{"role": "user", "content": question}]},
        config=config,
    )
    messages = result.get("messages", [])
    for message in reversed(messages):
        if isinstance(message, AIMessage):
            return str(message.content).strip()
    return ""
