from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import logging
import os
import uuid

from backend.chatbot.factory import get_root_chatbot

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

class AgentStatus(BaseModel):
    agent_name: str
    status: str
    last_heartbeat: float
    capabilities: List[str]

class AgentListResponse(BaseModel):
    agents: List[AgentStatus]

@router.get("/agents/status", response_model=AgentListResponse)
async def get_all_agent_status():
    """
    Get status of all available agents
    """
    # In a real implementation, this would check actual agent status
    # For now, return a static status based on our implemented agents
    agents_status = [
        AgentStatus(
            agent_name="HR Assistant",
            status="running",
            last_heartbeat=0,
            capabilities=["employee_lookup", "skills_matching", "org_chart"]
        ),
        AgentStatus(
            agent_name="Analytics Assistant", 
            status="running",
            last_heartbeat=0,
            capabilities=["calculations", "data_analysis", "business_metrics"]
        ),
        AgentStatus(
            agent_name="Document Assistant",
            status="running", 
            last_heartbeat=0,
            capabilities=["document_search", "knowledge_retrieval", "content_extraction"]
        )
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
    """
    Route query to appropriate agent based on content.
    """
    logger.info(f"Received query: {request.query}")
    
    try:
        chatbot = get_root_chatbot()
        
        # Process message
        # We use a random session ID for now to avoid state pollution between requests
        # until frontend supports session IDs.
        session_id = str(uuid.uuid4())
        
        response = await chatbot.process_message(
            message=request.query,
            session_id=session_id
        )
        
        return UnifiedResponse(
            response=response.message,
            agent_used=response.agent_used,
            confidence=response.confidence
        )
    
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"Error in query_all_agents: {error_trace}")
        
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")