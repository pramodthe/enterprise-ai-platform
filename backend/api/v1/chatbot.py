import logging
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.chatbot.factory import get_root_chatbot

logger = logging.getLogger(__name__)

router = APIRouter()


class AgentStatus(BaseModel):
    agent_name: str
    status: str
    last_heartbeat: float
    capabilities: list[str]


class AgentListResponse(BaseModel):
    agents: list[AgentStatus]


@router.get("/agents/status", response_model=AgentListResponse)
async def get_all_agent_status():
    """Return static status for implemented agents."""
    agents_status = [
        AgentStatus(
            agent_name="HR Assistant",
            status="running",
            last_heartbeat=0,
            capabilities=["employee_lookup", "skills_matching", "org_chart"],
        ),
        AgentStatus(
            agent_name="Analytics Assistant",
            status="running",
            last_heartbeat=0,
            capabilities=["calculations", "data_analysis", "business_metrics"],
        ),
    ]
    return AgentListResponse(agents=agents_status)


class UnifiedQuery(BaseModel):
    query: str
    agent: str = "auto"


class UnifiedResponse(BaseModel):
    response: str
    agent_used: str
    confidence: float


@router.post("/agents/query", response_model=UnifiedResponse)
async def query_all_agents(request: UnifiedQuery):
    """Route query to the root chatbot (agent router)."""
    logger.info("Received query: %s", request.query)

    try:
        chatbot = get_root_chatbot()
        session_id = str(uuid.uuid4())
        response = await chatbot.process_message(
            message=request.query,
            session_id=session_id,
        )
        return UnifiedResponse(
            response=response.message,
            agent_used=response.agent_used,
            confidence=response.confidence,
        )
    except Exception as e:
        import traceback

        logger.error("Error in query_all_agents: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}") from e
