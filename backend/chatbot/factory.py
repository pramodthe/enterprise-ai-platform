"""
Chatbot Factory - Manages the creation and retrieval of the RootChatbot instance.
"""
import logging
import os

from strands.models.bedrock import BedrockModel
from strands.models.anthropic import AnthropicModel

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
    
    # Initialize Model (Bedrock or Anthropic)
    use_bedrock = os.getenv("USE_BEDROCK", "False").lower() == "true"
    
    if use_bedrock:
        aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
        aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        region_name = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
        model_id = os.getenv("BEDROCK_MODEL_ID", "us.anthropic.claude-3-5-haiku-20241022-v1:0")
        guardrail_id = os.getenv("BEDROCK_GUARDRAIL_ID")
        guardrail_version = os.getenv("BEDROCK_GUARDRAIL_VERSION", "DRAFT")
        
        if not aws_access_key_id or not aws_secret_access_key:
            raise ValueError("AWS credentials required for Bedrock.")
            
        logger.info(f"Initializing BedrockModel with model_id={model_id}")
        
        model_params = {"temperature": 0.3}
        if guardrail_id:
            model_params["guardrailIdentifier"] = guardrail_id
            model_params["guardrailVersion"] = guardrail_version
            logger.info(f"Bedrock Guardrails enabled: {guardrail_id}")
            
        model = BedrockModel(
            client_args={
                "aws_access_key_id": aws_access_key_id,
                "aws_secret_access_key": aws_secret_access_key,
                "region_name": region_name,
            },
            max_tokens=1028,
            model_id=model_id,
            params=model_params
        )
    else:
        # Use Anthropic API directly
        anthropic_api_key = os.getenv("api_key")
        model_id = os.getenv("DEFAULT_MODEL", "claude-3-7-sonnet-20250219")
        
        if not anthropic_api_key:
            # Fallback to mock/error if no key (or raise error)
            # For now, let's assume key is present or raise error
            raise ValueError("Anthropic API key required.")
            
        logger.info(f"Initializing AnthropicModel with model_id={model_id}")
        
        model = AnthropicModel(
            client_args={"api_key": anthropic_api_key},
            max_tokens=1028,
            model_id=model_id,
            params={"temperature": 0.3}
        )
    
    _root_chatbot = RootChatbot(
        model=model,
        agent_router=agent_router
    )
    
    return _root_chatbot
