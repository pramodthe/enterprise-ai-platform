"""
HR Agent for the Enterprise AI Assistant Platform
"""
import os
import logging
from typing import Tuple, List
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Import Opik tracing utilities
from backend.core.opik_config import is_tracing_enabled, get_opik_metadata, get_session_id

# Configure logging
logger = logging.getLogger(__name__)

# Check if using Bedrock or direct Anthropic API
if os.getenv("USE_BEDROCK", "False").lower() == "true":
    # Use AWS Bedrock
    from strands import Agent
    from strands.models.bedrock import BedrockModel

    # Use Bedrock model
    import boto3
    bedrock_runtime = boto3.client(
        "bedrock-runtime",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    )
    model = BedrockModel(
        client=bedrock_runtime,
        max_tokens=1028,
        model_id=os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-haiku-4-5-20251001-v1:0"),
        temperature=0.3
    )
else:
    # Use Anthropic model (original implementation)
    from strands import Agent
    from strands.models.anthropic import AnthropicModel

    model = AnthropicModel(
        client_args={
            "api_key": os.getenv("api_key"),  # Required API key
        },
        max_tokens=1028,
        model_id=os.getenv("DEFAULT_MODEL", "claude-3-7-sonnet-20250219"),
        params={
            "temperature": 0.3,
        }
    )

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


def _get_hr_agent_response_impl(question: str) -> str:
    """
    Internal implementation of HR agent response (without tracing decorator).
    """
    # System prompt for HR agent with sample data and document search capability
    hr_system_prompt = """
    You are an HR assistant that helps with employee queries.
    
    You have access to the following sample employee data:
    
    Employees:
    - John Smith (ID: E001) - Senior Software Engineer, Skills: Python, JavaScript, AWS
    - Sarah Johnson (ID: E002) - Product Manager, Skills: Agile, Product Strategy, User Research
    - Michael Chen (ID: E003) - Data Scientist, Skills: Python, Machine Learning, SQL
    - Emily Davis (ID: E004) - UX Designer, Skills: Figma, User Research, Prototyping
    - David Wilson (ID: E005) - DevOps Engineer, Skills: Kubernetes, Docker, CI/CD
    
    Organization Structure:
    - CEO: Robert Anderson
      - CTO: Jennifer Lee (manages: John Smith, David Wilson)
      - CPO: Mark Thompson (manages: Sarah Johnson, Emily Davis)
      - Head of Data: Lisa Brown (manages: Michael Chen)
    
    You also have access to a tool called 'search_company_documents' that can search through 
    company policies, handbooks, procedures, and guidelines.
    
    When to use the search_company_documents tool:
    - When asked about HR policies (PTO, vacation, sick leave, etc.)
    - When asked about benefits (health insurance, 401k, etc.)
    - When asked about procedures (onboarding, performance reviews, etc.)
    - When asked about company guidelines (remote work, code of conduct, etc.)
    - When you need official policy information beyond the employee data above
    
    When answering questions:
    1. For employee/org structure queries, use the data above
    2. For policy/procedure queries, use the search_company_documents tool
    3. Combine both sources when relevant (e.g., "What's the PTO policy for engineers?")
    
    Be professional and concise in your responses.
    """
    
    # Create HR agent with document search tool
    hr_agent = Agent(
        model=model,
        name="HR Assistant",
        description="Answers HR-related questions about employees and company policies",
        system_prompt=hr_system_prompt,
        tools=[search_company_documents]
    )
    
    # Process the question and return response
    response = hr_agent(question)
    return str(response)


def get_hr_agent_response(question: str) -> str:
    """
    Get response from HR agent for a specific question.
    
    This function is traced with Opik when tracing is enabled.
    """
    # Determine model provider and model ID
    use_bedrock = os.getenv("USE_BEDROCK", "False").lower() == "true"
    model_provider = "bedrock" if use_bedrock else "anthropic"
    
    if use_bedrock:
        model_id = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-haiku-4-5-20251001-v1:0")
    else:
        model_id = os.getenv("DEFAULT_MODEL", "claude-3-7-sonnet-20250219")
    
    # Check if tracing is enabled
    if is_tracing_enabled():
        try:
            from opik import track
            
            # Get common metadata
            base_metadata = get_opik_metadata()
            
            # Add HR agent specific metadata
            trace_metadata = {
                **base_metadata,
                "model_provider": model_provider,
                "model_id": model_id,
                "agent_type": "hr"
            }
            
            # Apply the track decorator dynamically
            @track(
                name="hr_agent_query",
                tags=["agent:hr"],
                metadata=trace_metadata
            )
            def traced_hr_response(question: str) -> str:
                return _get_hr_agent_response_impl(question)
            
            return traced_hr_response(question)
            
        except ImportError:
            logger.debug("Opik package not available. Running without tracing.")
            return _get_hr_agent_response_impl(question)
        except Exception as e:
            logger.warning(
                f"Failed to apply tracing to HR agent: {str(e)}. "
                "Running without tracing."
            )
            return _get_hr_agent_response_impl(question)
    else:
        # Tracing is disabled, run without tracing
        return _get_hr_agent_response_impl(question)

