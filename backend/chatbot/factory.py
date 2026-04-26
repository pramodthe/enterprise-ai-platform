"""
Chatbot Factory - Manages the creation and retrieval of the RootChatbot instance.
"""
import logging

from strands.models.openai import OpenAIModel

from backend.agents.hr_agent import get_hr_agent_response
from backend.agents.analytics_agent import get_analytics_response

from backend.chatbot.root_chatbot import RootChatbot
from backend.chatbot.agent_router import AgentRouter
from backend.chatbot.local_agent import LocalAgentClient
from backend.core.config import settings, get_openai_client_args

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

    agents = {
        "hr": hr_client,
        "analytics": analytics_client,
    }
    
    # Initialize router
    agent_router = AgentRouter(agents=agents)
    
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is required.")

    logger.info(f"Initializing OpenAIModel with model_id={settings.openai_model}")

    model = OpenAIModel(
        client_args=get_openai_client_args(),
        model_id=settings.openai_model,
        params={
            "temperature": settings.openai_temperature,
            "max_tokens": settings.openai_max_tokens,
        },
    )
    
    _root_chatbot = RootChatbot(
        model=model,
        agent_router=agent_router
    )
    
    return _root_chatbot
