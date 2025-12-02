# rag/model_loader.py
from __future__ import annotations
import os
from typing import Optional

from .config import (
    USE_BEDROCK,
    AWS_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    BEDROCK_MODEL_ID_DEFAULT,
    ANTHROPIC_MODEL_ID_DEFAULT,
)
from anthropic import AuthenticationError 
from strands import Agent

if USE_BEDROCK:
    from strands.models.bedrock import BedrockModel as LLMModel
else:
    from strands.models.anthropic import AnthropicModel as LLMModel


def create_llm_model() -> LLMModel:
    """
    Create the main LLM model (Haiku), using either Bedrock or Anthropic API
    depending on USE_BEDROCK.
    """
    if USE_BEDROCK:
        import boto3

        # Optionally pass explicit creds; if None, boto3 falls back to default chain
        if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
            bedrock_runtime = boto3.client(
                "bedrock-runtime",
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=AWS_REGION,
            )
        else:
            bedrock_runtime = boto3.client(
                "bedrock-runtime",
                region_name=AWS_REGION,
            )

        # Guardrail configuration
        guardrail_id = os.getenv("BEDROCK_GUARDRAIL_ID")
        guardrail_version = os.getenv("BEDROCK_GUARDRAIL_VERSION", "DRAFT")
        
        model_kwargs = {
            "max_tokens": 1028,
            "temperature": 0.3,
            "model_id": BEDROCK_MODEL_ID_DEFAULT
        }
        
        if guardrail_id:
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Document Agent: Bedrock Guardrails enabled - {guardrail_id} (v{guardrail_version})")
            model_kwargs["guardrail_id"] = guardrail_id
            model_kwargs["guardrail_version"] = guardrail_version
            model_kwargs["guardrail_trace"] = "enabled"
        
        return LLMModel(**model_kwargs)

    # Direct Anthropic API
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    if not anthropic_api_key:
        raise RuntimeError("Anthropic 'ANTHROPIC_API_KEY' environment variable is not set.")

    return LLMModel(
        client_args={"api_key": anthropic_api_key},
        max_tokens=1028,
        model_id=ANTHROPIC_MODEL_ID_DEFAULT,
        params={"temperature": 0.3},
    )
