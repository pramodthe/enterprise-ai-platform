"""
LocalAgentClient - Adapter for running local agent functions as AgentClients.
"""
import json
import asyncio
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any

# Configure logging
logger = logging.getLogger(__name__)


@dataclass
class AgentResponse:
    """
    Represents a response from a specialized agent.
    
    Attributes:
        content: The response content from the agent
        agent_name: Name of the agent that generated the response
        metadata: Additional data about the response
        success: Whether the agent call was successful
        error: Optional error message if the call failed
    """
    content: str
    agent_name: str
    metadata: Dict[str, Any]
    success: bool
    error: Optional[str] = None


class AgentClient(ABC):
    """
    Abstract base class for agent clients.
    
    Defines the interface for communicating with specialized agents.
    """
    
    def __init__(self, agent_name: str):
        """
        Initialize the agent client.
        
        Args:
            agent_name: Human-readable name of the agent
        """
        self.agent_name = agent_name
    
    @abstractmethod
    async def query(
        self, 
        message: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """
        Send a query to the specialized agent.
        
        Args:
            message: The query to send to the agent
            context: Optional context information
            
        Returns:
            AgentResponse containing the agent's reply and metadata
        """
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """
        Check if the agent is currently available.
        
        Returns:
            True if the agent is available, False otherwise
        """
        pass
    
    @abstractmethod
    def get_capabilities(self) -> List[str]:
        """
        Get list of agent capabilities.
        
        Returns:
            List of capability strings
        """
        pass


class LocalAgentClient(AgentClient):
    """
    Adapter to use local agent functions as AgentClients.
    """
    def __init__(self, agent_name: str, query_func):
        super().__init__(agent_name=agent_name)
        self.query_func = query_func
        
    async def query(self, message: str, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        try:
            # Run synchronous query function in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            
            # Execute the query function
            # We need to handle different return types from different agents
            response_content = await loop.run_in_executor(None, self.query_func, message)
            
            metadata = {}
            
            # Normalize response content
            if isinstance(response_content, tuple):
                # Analytics returns (response, metadata)
                # Document returns (answer, sources)
                # We'll keep the second element as metadata if possible
                if len(response_content) > 1:
                    if isinstance(response_content[1], list):
                        metadata["sources"] = response_content[1]
                    elif isinstance(response_content[1], dict):
                        metadata.update(response_content[1])
                
                response_content = response_content[0]
            
            # Check if response_content is already a dict or list (e.g. parsed by strands)
            parsed_json = None
            if isinstance(response_content, (dict, list)):
                parsed_json = response_content
            else:
                # Check if response_content is a JSON string
                content_str = str(response_content)
                try:
                    # Clean up potential artifacts like /// or ////
                    content_str = content_str.replace("////", "").replace("///", "")
                    
                    # Find the first '{' or '[' to handle potential prefixes
                    first_brace = content_str.find("{")
                    first_bracket = content_str.find("[")
                    
                    json_str = None
                    if first_brace != -1 and (first_bracket == -1 or first_brace < first_bracket):
                        # Likely an object
                        end_idx = content_str.rfind("}")
                        if end_idx > first_brace:
                            json_str = content_str[first_brace : end_idx + 1]
                    elif first_bracket != -1:
                        # Likely an array
                        end_idx = content_str.rfind("]")
                        if end_idx > first_bracket:
                            json_str = content_str[first_bracket : end_idx + 1]
                    
                    if json_str:
                        parsed_json = json.loads(json_str)
                except (json.JSONDecodeError, ValueError):
                    pass

            # Process parsed_json if available
            if parsed_json is not None:
                # Handle list wrapper (e.g. [{...}])
                if isinstance(parsed_json, list):
                    if len(parsed_json) > 0:
                        parsed_json = parsed_json[0]
                    else:
                        parsed_json = {}
                
                # Extract answer_markdown if present
                if isinstance(parsed_json, dict) and "answer_markdown" in parsed_json:
                    content_str = parsed_json["answer_markdown"]
                    # Add other fields to metadata
                    for key, value in parsed_json.items():
                        if key not in ["answer_markdown", "follow_up_questions", "sources"]:
                            metadata[key] = value
                elif isinstance(parsed_json, dict):
                    # If it's a dict but no answer_markdown, maybe convert back to formatted string?
                    # Or just use the string representation we had?
                    # For now, let's assume if we parsed it, we want to use it.
                    # But if we don't have answer_markdown, we might just return the raw string.
                    if not isinstance(response_content, (dict, list)):
                         content_str = str(response_content) # Revert to original string if structure doesn't match
                    else:
                         content_str = str(parsed_json)
            else:
                # Fallback to raw string
                content_str = str(response_content)
                
            return AgentResponse(
                content=content_str,
                agent_name=self.agent_name,
                metadata=metadata,
                success=True,
                error=None
            )
        except Exception as e:
            logger.error(f"Error querying local agent {self.agent_name}: {e}")
            return AgentResponse(
                content="",
                agent_name=self.agent_name,
                metadata={},
                success=False,
                error=str(e)
            )

    def is_available(self) -> bool:
        """
        Check if the local agent is available.
        Since it's a local function, it's always considered available.
        """
        return True

    def get_capabilities(self) -> list[str]:
        """
        Get list of agent capabilities.
        For now, we return a generic list or empty list as we don't have metadata on local functions.
        """
        return []
