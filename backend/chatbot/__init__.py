"""
Root Chatbot module for the Enterprise AI Assistant Platform.
"""

from backend.chatbot.root_chatbot import (
    RootChatbot,
    ChatResponse,
    Message,
    MessageRole,
)
from backend.chatbot.agent_router import AgentRouter, RoutingDecision
from backend.chatbot.local_agent import LocalAgentClient, AgentResponse, AgentClient

__all__ = [
    "RootChatbot",
    "Message",
    "ChatResponse",
    "MessageRole",
    "AgentRouter",
    "RoutingDecision",
    "AgentResponse",
    "AgentClient",
    "LocalAgentClient",
]
