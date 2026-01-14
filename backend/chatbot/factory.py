"""
Chatbot Factory - Manages the creation and retrieval of the RootChatbot instance.
"""
import logging
import os

from strands.models.openai import OpenAIModel

from backend.agents.hr_agent import get_hr_agent_response
from backend.agents.analytics_agent import get_analytics_response
from backend.agents.document_agent import get_document_response

from backend.chatbot.root_chatbot import RootChatbot
from backend.chatbot.agent_router import AgentRouter
from backend.chatbot.local_agent import LocalAgentClient

# Configure logging
logger = logging.getLogger(__name__)

# Global RootChatbot instance
_root_chatbot = None

def get_root_chatbot() -> RootChatbot:
    """
    Get or initialize the global RootChatbot instance.
    """
    global _root_chatbot
    if _root_chatbot:
        return _root_chatbot
        
    logger.info("Initializing RootChatbot...")
    
    # Initialize local agent clients
    hr_client = LocalAgentClient("HR Assistant", get_hr_agent_response)
    analytics_client = LocalAgentClient("Analytics Assistant", get_analytics_response)
    doc_client = LocalAgentClient("Document Assistant", get_document_response)
    
    agents = {
        "hr": hr_client,
        "analytics": analytics_client,
        "document": doc_client
    }
    
    # Initialize router
    agent_router = AgentRouter(agents=agents)
    
    # Initialize OpenAI Model
    openai_api_key = os.getenv("OPENAI_API_KEY")
    model_id = os.getenv("OPENAI_MODEL", os.getenv("DEFAULT_MODEL", "gpt-4o-mini"))

    if not openai_api_key:
        raise ValueError("OpenAI API key required.")

    logger.info(f"Initializing OpenAIModel with model_id={model_id}")

    model = OpenAIModel(
        client_args={"api_key": openai_api_key},
        max_tokens=1028,
        model_id=model_id,
        params={"temperature": 0.3},
    )
    
    _root_chatbot = RootChatbot(
        model=model,
        agent_router=agent_router
    )
    
    return _root_chatbot
