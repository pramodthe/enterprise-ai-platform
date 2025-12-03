"""
RootChatbot - Main conversational agent for the Enterprise AI Assistant Platform.

This module implements the Root Chatbot that serves as the primary interface for users,
routing queries to specialized agents and providing a seamless conversation experience.
"""
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum

from strands import Agent

from backend.chatbot.agent_router import AgentRouter, RoutingDecision

# Configure logging
logger = logging.getLogger(__name__)


class MessageRole(str, Enum):
    """Enumeration of message roles in a conversation."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


@dataclass
class Message:
    """
    Represents a single message in a conversation.
    """
    role: str
    content: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None
    agent_used: Optional[str] = None


@dataclass
class ChatResponse:
    """
    Represents a response from the Root Chatbot.
    """
    message: str
    session_id: str
    agent_used: str
    confidence: float
    timestamp: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize response to dictionary."""
        return {
            "message": self.message,
            "session_id": self.session_id,
            "agent_used": self.agent_used,
            "confidence": self.confidence,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata
        }


class RootChatbot:
    """
    Main conversational agent that orchestrates user interactions.
    
    The RootChatbot intelligently routes queries to specialized agents and provides 
    responses for general queries. It uses AWS Bedrock (via Strands SDK) for 
    language model capabilities.
    
    Attributes:
        model: BedrockModel or AnthropicModel instance for generating responses
        agent_router: AgentRouter for determining query routing
        system_prompt: System prompt for the chatbot
    """
    
    DEFAULT_SYSTEM_PROMPT = """You are a helpful AI assistant for an enterprise platform.
You can help with general questions and coordinate with specialized agents for:
- HR queries (employee information, organizational structure, skills)
- Analytics queries (calculations, data analysis, reporting)
- Document queries (policies, procedures, guidelines)

Be professional, concise, and helpful in your responses."""
    
    def __init__(
        self,
        model: Any,
        agent_router: AgentRouter,
        system_prompt: Optional[str] = None
    ):
        """
        Initialize the Root Chatbot with dependencies.
        
        Args:
            model: BedrockModel or AnthropicModel instance for model interactions
            agent_router: AgentRouter for query routing decisions
            system_prompt: Optional custom system prompt
        """
        self.model = model
        self.agent_router = agent_router
        self.system_prompt = system_prompt or self.DEFAULT_SYSTEM_PROMPT
        
        logger.info("Initialized RootChatbot with provided model")
    
    async def process_message(
        self,
        message: str,
        session_id: Optional[str] = None, # Kept for API compatibility but unused
        user_id: Optional[str] = None      # Kept for API compatibility but unused
    ) -> ChatResponse:
        """
        Process a user message and return a response.
        
        Args:
            message: The user's message
            session_id: Optional session identifier (unused in stateless mode)
            user_id: Optional user identifier (unused in stateless mode)
            
        Returns:
            ChatResponse containing the reply and metadata
        """
        logger.info(f"Processing message: {message[:100]}...")
        
        # In stateless mode, context is just the current message
        # If we want to support history later, we should accept it as an argument
        context = f"USER: {message}"
        
        # Step 1: Determine if we should route to a specialized agent
        should_route = self._should_route_to_agent(message, context)
        
        # Step 2: Make routing decision
        # We don't have previous_agent in stateless mode
        routing_decision = self.agent_router.route_query(
            query=message,
            context=context,
            previous_agent=None
        )
        
        logger.info(
            f"Routing decision: {routing_decision.agent_name} "
            f"(confidence: {routing_decision.confidence:.2f})"
        )
        
        # Step 3: Process based on routing decision
        if routing_decision.should_use_agent(self.agent_router.confidence_threshold) and routing_decision.agent_name != "root":
            # Route to specialized agent
            response_content, agent_used = await self._handle_agent_query(
                message=message,
                routing_decision=routing_decision,
                context=context
            )
        else:
            # Handle directly with Root Chatbot
            response_content = await self._handle_general_query(
                message=message,
                context=context
            )
            agent_used = "root"
        
        # Step 4: Create and return ChatResponse
        response = ChatResponse(
            message=response_content,
            session_id=session_id or "stateless",
            agent_used=agent_used,
            confidence=routing_decision.confidence,
            timestamp=datetime.now(),
            metadata={
                "routing_reasoning": routing_decision.reasoning,
                "fallback_agents": routing_decision.fallback_agents,
                "conversation_length": 1
            }
        )
        
        return response
    
    def _should_route_to_agent(self, message: str, context: str) -> bool:
        """
        Determine if message should be routed to a specialized agent.
        """
        # Simple heuristic: check for common general query patterns
        general_patterns = [
            "hello", "hi", "hey", "thanks", "thank you",
            "what can you do", "help", "capabilities",
            "how are you", "goodbye", "bye"
        ]
        
        message_lower = message.lower().strip()
        
        # If it's a very short greeting or thanks, probably general
        if any(pattern in message_lower for pattern in general_patterns):
            if len(message.split()) <= 5:  # Short message
                logger.debug("Message appears to be a general query (greeting/thanks)")
                return False
        
        # Otherwise, let the router decide
        return True
    
    async def _handle_agent_query(
        self,
        message: str,
        routing_decision: RoutingDecision,
        context: str
    ) -> tuple[str, str]:
        """
        Handle a query by routing to a specialized agent.
        """
        agent_name = routing_decision.agent_name
        
        # Get the agent client
        if agent_name not in self.agent_router.agents:
            logger.error(f"Agent {agent_name} not found in router")
            return await self._handle_general_query(message, context), "root"
        
        agent_client = self.agent_router.agents[agent_name]
        
        # Prepare context for agent
        agent_context = {
            "conversation_history": context,
            "routing_confidence": routing_decision.confidence
        }
        
        # Query the agent
        try:
            agent_response = await agent_client.query(
                message=message,
                context=agent_context
            )
            
            if agent_response.success:
                logger.info(f"Successfully received response from {agent_name}")
                return agent_response.content, agent_name
            else:
                # Agent failed, try fallback
                logger.warning(
                    f"Agent {agent_name} failed: {agent_response.error}. "
                    "Attempting fallback."
                )
                return await self._handle_agent_failure(
                    message=message,
                    context=context,
                    failed_agent=agent_name,
                    routing_decision=routing_decision
                )
        
        except Exception as e:
            logger.error(f"Exception querying agent {agent_name}: {str(e)}")
            return await self._handle_agent_failure(
                message=message,
                context=context,
                failed_agent=agent_name,
                routing_decision=routing_decision
            )
    
    async def _handle_agent_failure(
        self,
        message: str,
        context: str,
        failed_agent: str,
        routing_decision: RoutingDecision
    ) -> tuple[str, str]:
        """
        Handle agent failure with fallback strategies.
        """
        # Try fallback agents
        for fallback_agent in routing_decision.fallback_agents:
            if fallback_agent in self.agent_router.agents:
                logger.info(f"Trying fallback agent: {fallback_agent}")
                
                try:
                    agent_client = self.agent_router.agents[fallback_agent]
                    agent_response = await agent_client.query(
                        message=message,
                        context={"conversation_history": context}
                    )
                    
                    if agent_response.success:
                        logger.info(f"Fallback agent {fallback_agent} succeeded")
                        return agent_response.content, fallback_agent
                
                except Exception as e:
                    logger.warning(f"Fallback agent {fallback_agent} also failed: {str(e)}")
                    continue
        
        # All agents failed, handle with root chatbot
        logger.warning(
            f"All agents failed for query. Handling with root chatbot. "
            f"Failed agent: {failed_agent}"
        )
        
        response = await self._handle_general_query(message, context)
        
        # Add disclaimer about agent failure
        disclaimer = (
            f"\n\n(Note: The specialized {failed_agent} agent is currently unavailable. "
            "I've provided a general response, but it may not be as accurate as the "
            "specialized agent would provide.)"
        )
        
        return response + disclaimer, "root"
    
    async def _handle_general_query(
        self,
        message: str,
        context: str
    ) -> str:
        """
        Handle a general query directly with the Root Chatbot.
        """
        logger.debug("Handling query with root chatbot (general knowledge)")
        
        try:
            # Create agent with the model
            agent = Agent(
                model=self.model,
                name="Root Chatbot",
                description="General purpose conversational assistant",
                system_prompt=self.system_prompt
            )
            
            # Generate response
            # Note: Strands Agent is synchronous, but we can run it in executor if needed
            # For now, we'll assume it's fast enough or the underlying model handles async
            response = agent(message)
            
            logger.debug(f"Generated response: {str(response)[:100]}...")
            return str(response)
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return (
                "I apologize, but I'm having trouble generating a response right now. "
                "Please try again in a moment."
            )
