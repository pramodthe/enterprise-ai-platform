"""
ANALYTICS AGENT - Fixed for Chart Rendering
"""

import os
import sys
import logging
import json
import base64
import io
import pandas as pd
import re

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

USE_BEDROCK = os.getenv("USE_BEDROCK", "False").lower() == "true"

if USE_BEDROCK:
    from strands import Agent
    from strands.models.bedrock import BedrockModel
    import boto3

    bedrock_runtime = boto3.client(
        "bedrock-runtime",
        region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
    )

    model = BedrockModel(
        max_tokens=2048,
        temperature=0.3,
        model_id=os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")
    )

else:
    from strands import Agent
    from strands.models.anthropic import AnthropicModel

    model = AnthropicModel(
        client_args={"api_key": os.getenv("api_key")},
        max_tokens=2048,
        params={"temperature": 0.2},
        model_id=os.getenv("DEFAULT_MODEL", "claude-3-haiku-20240307")
    )


DUMMY_DATA = {
    "sales": [
        {"month": "Jan", "revenue": 12000, "expenses": 5000, "customers": 120},
        {"month": "Feb", "revenue": 18000, "expenses": 7000, "customers": 150},
        {"month": "Mar", "revenue": 22500, "expenses": 9000, "customers": 175},
        {"month": "Apr", "revenue": 24000, "expenses": 9500, "customers": 190},
        {"month": "May", "revenue": 30000, "expenses": 11000, "customers": 220},
        {"month": "Jun", "revenue": 33000, "expenses": 13000, "customers": 250},
    ],
    "products": [
        {"product": "A", "units_sold": 1200, "returns": 25},
        {"product": "B", "units_sold": 900, "returns": 40},
        {"product": "C", "units_sold": 750, "returns": 12},
    ],
    "traffic": [
        {"day": "Mon", "visitors": 400},
        {"day": "Tue", "visitors": 500},
        {"day": "Wed", "visitors": 650},
        {"day": "Thu", "visitors": 700},
        {"day": "Fri", "visitors": 900},
        {"day": "Sat", "visitors": 1500},
        {"day": "Sun", "visitors": 1200},
    ]
}


from strands.tools import tool

@tool
def add(x: float, y: float) -> float:
    """Add two numbers together"""
    return x + y

@tool
def subtract(x: float, y: float) -> float:
    """Subtract second number from first"""
    return x - y

@tool
def multiply(x: float, y: float) -> float:
    """Multiply two numbers"""
    return x * y

@tool
def divide(x: float, y: float) -> float:
    """Divide first number by second"""
    if y == 0:
        raise ValueError("Cannot divide by zero")
    return x / y

@tool
def calculate_average(numbers: list) -> float:
    """Calculate the average of a list of numbers"""
    if not numbers:
        raise ValueError("Cannot calculate average of empty list")
    return sum(numbers) / len(numbers)

@tool
def percent_change(old: float, new: float) -> float:
    """Calculate percent change between old and new values"""
    if old == 0:
        raise ValueError("Cannot calculate percent change from zero")
    return ((new - old) / old) * 100

@tool
def query_data_tool(table: str) -> list:
    """Fetch dataset by name. Available tables: sales, products, traffic"""
    if table not in DUMMY_DATA:
        raise ValueError(f"Unknown table '{table}'. Available: {list(DUMMY_DATA.keys())}")
    return DUMMY_DATA[table]

@tool
def generate_chart_tool(data: list, chart_type: str = "line", x: str = None, y: str = None, title: str = None) -> dict:
    """Generate a chart from data. Returns dict with base64 PNG image.
    
    IMPORTANT: Pass the FULL list of dictionaries from query_data_tool.
    Example: generate_chart_tool(sales_data, "line", "month", "revenue", "Revenue Trend")
    
    Args:
        data: List of dictionaries containing the data (from query_data_tool)
        chart_type: Type of chart - "line", "bar", or "scatter"
        x: Column name for x-axis (e.g., "month", "product", "day")
        y: Column name for y-axis (e.g., "revenue", "expenses", "visitors")
        title: Chart title
    
    Returns:
        Dict with image_base64, format, and description
    """
    try:
        logger.info(f"Chart tool called: type={chart_type}, x={x}, y={y}")
        logger.info(f"Data type: {type(data)}, length: {len(data) if isinstance(data, list) else 'N/A'}")
        logger.info(f"First item: {data[0] if data and isinstance(data, list) else 'N/A'}")
        
        df = pd.DataFrame(data)
        logger.info(f"DataFrame created successfully. Columns: {list(df.columns)}")
        
        plt.figure(figsize=(8, 5))
        
        if chart_type == "line":
            plt.plot(df[x], df[y], marker='o', linewidth=2, markersize=6)
        elif chart_type == "bar":
            plt.bar(df[x], df[y])
        elif chart_type == "scatter":
            plt.scatter(df[x], df[y], s=100)
        else:
            raise ValueError(f"Unsupported chart_type: {chart_type}")
        
        plt.title(title or f"{chart_type.capitalize()} Chart", fontsize=14, fontweight='bold')
        plt.xlabel(x, fontsize=11)
        plt.ylabel(y, fontsize=11)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format="png", dpi=100, bbox_inches='tight')
        buffer.seek(0)
        
        img_b64 = base64.b64encode(buffer.read()).decode("utf-8")
        plt.close()
        
        result = {
            "image_base64": img_b64,
            "format": "png",
            "description": f"{chart_type} chart of {y} vs {x}",
        }
        
        logger.info(f"Chart generated successfully, base64 length: {len(img_b64)}")
        
        # Return dict - the agent framework will handle serialization
        return result
        
    except Exception as e:
        error_msg = f"Chart generation failed: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise ValueError(error_msg)

ANALYTICS_TOOLS = [add, subtract, multiply, divide, calculate_average, percent_change, query_data_tool, generate_chart_tool]


def _get_analytics_response_impl(query: str):
    """Process analytics query"""
    
    # Check if this is a chart request (simple or with analysis)
    query_lower = query.lower()
    chart_keywords = ['chart', 'graph', 'plot', 'visualiz', 'show', 'display']
    calculation_only_keywords = ['add', 'subtract', 'multiply', 'divide', 'average of', 'mean of', 'sum of']
    
    has_chart_keyword = any(keyword in query_lower for keyword in chart_keywords)
    is_calculation_only = any(keyword in query_lower for keyword in calculation_only_keywords) and not has_chart_keyword
    
    # Use direct chart generation for any request with chart keywords (unless it's pure calculation)
    if has_chart_keyword and not is_calculation_only:
        # Handle chart requests directly with intelligent parsing
        try:
            logger.info(f"Detected chart request: {query}")
            query_lower = query.lower()
            
            # Determine dataset
            table = "sales"  # default
            if "product" in query_lower:
                table = "products"
            elif "traffic" in query_lower or "visitor" in query_lower:
                table = "traffic"
            
            # Get the data
            data = query_data_tool(table)
            logger.info(f"Using table: {table}")
            
            # Determine chart type
            chart_type = "line"
            if "bar" in query_lower:
                chart_type = "bar"
            elif "scatter" in query_lower:
                chart_type = "scatter"
            
            # Determine x and y columns based on dataset and query
            if table == "sales":
                x_col = "month"
                y_col = "revenue"  # default
                title = "Monthly Revenue Trend"
                
                if "expense" in query_lower:
                    y_col = "expenses"
                    title = "Monthly Expenses Trend"
                elif "customer" in query_lower:
                    y_col = "customers"
                    title = "Monthly Customers Trend"
                elif "revenue" in query_lower:
                    y_col = "revenue"
                    title = "Monthly Revenue Trend"
                    
            elif table == "products":
                x_col = "product"
                y_col = "units_sold"  # default
                title = "Product Sales"
                
                if "return" in query_lower:
                    y_col = "returns"
                    title = "Product Returns"
                elif "unit" in query_lower or "sold" in query_lower or "sales" in query_lower:
                    y_col = "units_sold"
                    title = "Units Sold by Product"
                    
            elif table == "traffic":
                x_col = "day"
                y_col = "visitors"
                title = "Daily Website Traffic"
            
            # Generate the chart
            result = generate_chart_tool(data, chart_type, x_col, y_col, title)
            logger.info(f"Chart generated: {chart_type} of {y_col} vs {x_col}")
            
            # If query includes analysis keywords, add brief analysis
            if any(word in query_lower for word in ['analyze', 'analysis', 'trend', 'compare', 'insight']):
                # Calculate some basic stats
                values = [row[y_col] for row in data]
                if values:
                    min_val = min(values)
                    max_val = max(values)
                    avg_val = sum(values) / len(values)
                    growth = ((max_val - min_val) / min_val * 100) if min_val > 0 else 0
                    
                    # Add analysis to the result
                    result['analysis'] = {
                        'min': min_val,
                        'max': max_val,
                        'average': round(avg_val, 2),
                        'growth_percent': round(growth, 1)
                    }
            
            return json.dumps(result), {}
            
        except Exception as e:
            logger.error(f"Direct chart generation failed: {e}", exc_info=True)
            return f"Error generating chart: {str(e)}", {}
    
    # For analysis requests, use the agent with all tools
    system_prompt = """You are an AI Business Intelligence Dashboard Assistant.

Your job is to analyze data, compute metrics, and create visualizations in a dashboard-quality format.

AVAILABLE TOOLS:
- Math: add(x, y), subtract(x, y), multiply(x, y), divide(x, y)
- Statistics: calculate_average(numbers), percent_change(old, new)
- Data: query_data_tool(table) - Returns list of dicts. Tables: "sales", "products", "traffic"
- Charts: generate_chart_tool(data, chart_type, x, y, title) - Returns dict with base64 image

===========================================
HOW TO USE GENERATE_CHART_TOOL CORRECTLY
===========================================
The generate_chart_tool requires these parameters:
1. data: The FULL list of dictionaries from query_data_tool (pass it directly!)
2. chart_type: "line", "bar", or "scatter"
3. x: Column name for x-axis (e.g., "month", "product", "day")
4. y: Column name for y-axis (e.g., "revenue", "expenses", "visitors")
5. title: Chart title string

CORRECT EXAMPLE:
Step 1: sales_data = query_data_tool("sales")
Step 2: generate_chart_tool(sales_data, "line", "month", "revenue", "Monthly Revenue Trend")

WRONG - Don't do this:
- generate_chart_tool([12000, 18000, ...], "line", ...) ❌ (Don't extract values)
- generate_chart_tool(sales_data[0], ...) ❌ (Don't pass single row)
- generate_chart_tool("sales", ...) ❌ (Don't pass table name)

CORRECT - Do this:
- Pass the ENTIRE data list from query_data_tool ✓

===========================================
FINAL USER-FACING OUTPUT REQUIREMENTS
===========================================
Your responses MUST follow a business-dashboard-friendly format:

1. **Headline Metric**  
   Give the direct answer clearly (big number or KPI style).

2. **Supporting Calculation / Short Summary**  
   Provide a concise, friendly explanation of how the tool result was obtained.
   Example:
   “Using the calculation tool, I added 25 and 42, resulting in **67**.”

3. **Optional Data Table (if helpful)**  
   Display key values used in the calculation or analysis.

4. **Visualization**  
   If the user asks for a chart—or if a chart meaningfully enhances the insight—  
   call `generate_chart` and return the base64 image along with a short explanation.

5. **Business Insight**  
   End with a one-sentence interpretation, such as:  
   “Revenue continues an upward trend, indicating strong month-over-month growth.”

===========================================
VOICE & STYLE
===========================================
• Clear, concise, executive-level tone  
• Avoid jargon unless necessary  
• Provide insights, not just numbers  
• Always sound like a BI dashboard or analytics tool  
• Never reveal chain-of-thought—summarize instead  
• Always use tools for actual computation or data extraction

===========================================
EXAMPLE RESPONSE STYLE
===========================================

User: “Add 20 and 40.”

Assistant:
**KPI Result:** 60  
**How I computed it:** I used the calculation tool to add 20 and 40.  
**Insight:** This represents the combined total across both values.

User: “Show revenue vs expenses by month.”

Assistant:
1. Fetch sales data using `query_data('sales')`  
2. Create a bar or line chart using `generate_chart`  
3. Return a dashboard-style summary:
   • Revenue is rising steadily  
   • Expenses grow at a slower rate  
   • Profit margin is improving

===========================================
CRITICAL CHART EXAMPLE
===========================================
User: "Analyze revenue with a chart"

CORRECT TOOL USAGE:
1. data = query_data_tool("sales")
2. generate_chart_tool(data, "line", "month", "revenue", "Revenue Trend")
   ↑ Pass the FULL data list, not extracted values!

===========================================
BEHAVIOR RULES
===========================================
- ALWAYS pass full data list to generate_chart_tool (not values!)
- Use calculate_average tool for averages
- Always use tools for math or data lookups
- Provide dashboard-style summaries with insights



"""

    try:
        agent = Agent(
            model=model,
            system_prompt=system_prompt,
            tools=ANALYTICS_TOOLS,  # Include ALL tools including generate_chart_tool
            name="AnalyticsAssistant"
        )

        response = agent(query)
        response_str = str(response).strip()
        
        logger.info(f"Agent response: {response_str[:200]}")
        return response_str, {}

    except Exception as e:
        logger.error(f"Analytics agent error: {e}", exc_info=True)
        return f"Error: {str(e)}", {}


def get_analytics_response(query: str):
    return _get_analytics_response_impl(query)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "demo":
        print("Analytics Agent Demo")
        result, _ = get_analytics_response("show me monthly revenue chart")
        if "image_base64" in result:
            print("SUCCESS: Chart JSON returned")
            print(f"JSON length: {len(result)}")
        else:
            print("Response:", result[:200])
    else:
        print("Usage: python analytics_agent_fixed.py demo")
