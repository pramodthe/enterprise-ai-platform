#!/usr/bin/env python3
"""
Script to verify Bedrock Guardrail integration in Analytics Agent.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))
sys.path.insert(0, str(backend_path.parent))

# Load environment variables
load_dotenv(backend_path / ".env")

def verify_guardrail():
    print("=" * 60)
    print("Bedrock Guardrail Verification")
    print("=" * 60)

    # Check configuration
    use_bedrock = os.getenv("USE_BEDROCK", "False").lower() == "true"
    # OVERRIDE for verification based on user input
    guardrail_id = "dw8yhrlazrhz" 
    guardrail_version = "DRAFT"
    
    # Temporarily set env vars so the agent picks them up
    os.environ["BEDROCK_GUARDRAIL_ID"] = guardrail_id
    os.environ["BEDROCK_GUARDRAIL_VERSION"] = guardrail_version

    print(f"Configuration:")
    print(f"  • USE_BEDROCK: {use_bedrock}")
    print(f"  • BEDROCK_GUARDRAIL_ID: {guardrail_id if guardrail_id else 'Not Set'}")
    print(f"  • BEDROCK_GUARDRAIL_VERSION: {guardrail_version if guardrail_version else 'Not Set'}")
    print("-" * 60)

    if not use_bedrock:
        print("❌ Error: USE_BEDROCK must be set to 'True' in .env to use Bedrock Guardrails.")
        return

    if not guardrail_id:
        print("❌ Error: BEDROCK_GUARDRAIL_ID is not set in .env.")
        return

    print("\nInitializing Analytics Agent...")
    try:
        from backend.agents.analytics_agent import get_analytics_response
    except ImportError as e:
        print(f"❌ Error importing analytics_agent: {e}")
        return
    except Exception as e:
        print(f"❌ Error initializing agent: {e}")
        return

    # Test Query
    test_query = "Should I invest in Bitcoin and what is the best stock to buy?"
    print(f"\nSending Test Query: '{test_query}'")
    print("Waiting for response (this calls AWS Bedrock)...")

    try:
        response, _ = get_analytics_response(test_query)
        
        print("\nResponse received:")
        print("-" * 20)
        print(response)
        print("-" * 20)

        # Check if it looks like a guardrail intervention
        # The default message usually contains "financial advice" or "cannot answer"
        # Or if we caught the stop_reason, it returns the intervention text.
        
        if "financial" in response.lower() or "cannot" in response.lower() or "sorry" in response.lower():
            print("\n✅ SUCCESS: The query appears to have been blocked.")
            print("Note: Verify the response text matches your Guardrail's configured message.")
        else:
            print("\n⚠️ WARNING: The query may NOT have been blocked.")
            print("Check if the response provides financial advice.")

    except Exception as e:
        print(f"\n❌ Error during query execution: {e}")

if __name__ == "__main__":
    verify_guardrail()
