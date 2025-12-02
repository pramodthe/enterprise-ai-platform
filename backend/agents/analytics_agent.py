"""
ANALYTICS AGENT - Complete with Chart Rendering and Comprehensive Data
Features:
- Chart generation with matplotlib
- Comprehensive business data (10 tables)
- Automatic report generation
- Analysis metrics calculation
"""

import os
import sys
import logging
import json
import base64
import io
from pathlib import Path

# Add backend directory to sys.path so we can import 'data'
sys.path.append(str(Path(__file__).parent.parent))

import pandas as pd
import re
import traceback

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

    guardrail_id = os.getenv("BEDROCK_GUARDRAIL_ID")
    guardrail_version = os.getenv("BEDROCK_GUARDRAIL_VERSION", "1")
    
    model_kwargs = {
        "max_tokens": 2048,
        "temperature": 0.3,
        "model_id": os.getenv("BEDROCK_MODEL_ID", "us.anthropic.claude-3-5-haiku-20241022-v1:0")
    }
    
    if guardrail_id:
        logger.info(f"Initializing Bedrock model with guardrail: {guardrail_id} (v{guardrail_version})")
        model_kwargs["guardrail_id"] = guardrail_id
        model_kwargs["guardrail_version"] = guardrail_version
        model_kwargs["guardrail_trace"] = "enabled"
        
    model = BedrockModel(**model_kwargs)

else:
    from strands import Agent
    from strands.models.anthropic import AnthropicModel

    model = AnthropicModel(
        client_args={"api_key": os.getenv("api_key")},
        max_tokens=2048,
        params={"temperature": 0.2},
        model_id=os.getenv("DEFAULT_MODEL", "claude-3-haiku-20240307")
    )


# Import comprehensive business data
from data.business_data import ALL_DATA

DUMMY_DATA = ALL_DATA


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
    """Fetch dataset by name.
    
    Available tables:
    - sales: Monthly sales data (12 months)
    - products: Product performance (7 products)
    - traffic: Website traffic (7 days)
    - demographics: Customer demographics (6 age groups)
    - regions: Regional sales (6 regions)
    - marketing: Marketing channels (7 channels)
    - employees: Employee data (7 departments)
    - quarterly: Quarterly performance (4 quarters)
    - satisfaction: Customer satisfaction (6 metrics)
    - inventory: Inventory status (4 categories)
    """
    if table not in DUMMY_DATA:
        available = ", ".join(DUMMY_DATA.keys())
        raise ValueError(f"Unknown table '{table}'. Available: {available}")
    return DUMMY_DATA[table]

@tool
def generate_chart_tool(data: list, chart_type: str = "line", x: str = None, y: str = None, title: str = None) -> dict:
    """Generate a chart from data. Returns dict with base64 PNG image.
    
    Args:
        data: List of dictionaries containing the data
        chart_type: Type of chart - "line", "bar", or "scatter"
        x: Column name for x-axis
        y: Column name for y-axis
        title: Chart title
    
    Returns:
        Dict with image_base64, format, and description
    """
    try:
        logger.info(f"Chart tool called: type={chart_type}, x={x}, y={y}")
        
        df = pd.DataFrame(data)
        logger.info(f"DataFrame created. Columns: {list(df.columns)}")
        
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
        
        logger.info(f"Chart generated successfully")
        return result
        
    except Exception as e:
        error_msg = f"Chart generation failed: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise ValueError(error_msg)

ANALYTICS_TOOLS = [add, subtract, multiply, divide, calculate_average, percent_change, query_data_tool, generate_chart_tool]


def _get_analytics_response_impl(query: str):
    """Process analytics query"""
    
    query_lower = query.lower()
    
    # Keywords that indicate chart/visualization request
    chart_keywords = ['chart', 'graph', 'plot', 'visualiz', 'visual', 'show', 'display', 'dashboard']
    calculation_only_keywords = ['add', 'subtract', 'multiply', 'divide', 'average of', 'mean of', 'sum of']
    report_keywords = ['report', 'comprehensive', 'analysis', 'dashboard', 'summary']
    
    has_chart_keyword = any(keyword in query_lower for keyword in chart_keywords)
    has_report_keyword = any(keyword in query_lower for keyword in report_keywords)
    is_calculation_only = any(keyword in query_lower for keyword in calculation_only_keywords) and not has_chart_keyword
    
    # Use direct chart generation for chart or report requests
    if (has_chart_keyword or has_report_keyword) and not is_calculation_only:
        try:
            logger.info(f"Detected chart/report request: {query}")
            
            # Determine dataset
            table = "sales"  # default
            
            if "product" in query_lower:
                table = "products"
            elif "traffic" in query_lower or "visitor" in query_lower or "website" in query_lower:
                table = "traffic"
            elif "demographic" in query_lower or "age" in query_lower:
                table = "demographics"
            elif "region" in query_lower or "geographic" in query_lower:
                table = "regions"
            elif "marketing" in query_lower or "channel" in query_lower:
                table = "marketing"
            elif "employee" in query_lower or "department" in query_lower:
                table = "employees"
            elif "quarter" in query_lower:
                table = "quarterly"
            elif "satisfaction" in query_lower or "rating" in query_lower:
                table = "satisfaction"
            elif "inventory" in query_lower or "stock" in query_lower:
                table = "inventory"
            
            # Get data
            data = query_data_tool(table)
            logger.info(f"Using table: {table}")
            
            # Determine chart type
            chart_type = "line"
            if "bar" in query_lower:
                chart_type = "bar"
            elif "scatter" in query_lower:
                chart_type = "scatter"
            
            # Determine x and y columns based on dataset
            if table == "sales":
                x_col, y_col, title = "month", "revenue", "Monthly Revenue Trend"
                if "expense" in query_lower:
                    y_col, title = "expenses", "Monthly Expenses Trend"
                elif "customer" in query_lower:
                    y_col, title = "customers", "Monthly Customers Trend"
                elif "order" in query_lower:
                    y_col, title = "orders", "Monthly Orders Trend"
                    
            elif table == "products":
                x_col, y_col, title = "product", "units_sold", "Product Sales"
                chart_type = "bar"
                if "return" in query_lower:
                    y_col, title = "returns", "Product Returns"
                elif "revenue" in query_lower:
                    y_col, title = "revenue", "Product Revenue"
                elif "profit" in query_lower:
                    y_col, title = "profit", "Product Profitability"
                    
            elif table == "traffic":
                x_col, y_col, title = "day", "visitors", "Daily Website Traffic"
                if "conversion" in query_lower:
                    y_col, title = "conversions", "Daily Conversions"
                elif "bounce" in query_lower:
                    y_col, title = "bounce_rate", "Bounce Rate by Day"
                    
            elif table == "demographics":
                x_col, y_col, title = "segment", "count", "Customer Demographics"
                chart_type = "bar"
                if "spend" in query_lower:
                    y_col, title = "avg_spend", "Average Spend by Segment"
                elif "retention" in query_lower:
                    y_col, title = "retention_rate", "Retention Rate by Segment"
                    
            elif table == "regions":
                x_col, y_col, title = "region", "revenue", "Revenue by Region"
                chart_type = "bar"
                if "customer" in query_lower:
                    y_col, title = "customers", "Customers by Region"
                elif "growth" in query_lower:
                    y_col, title = "growth", "Growth Rate by Region"
                    
            elif table == "marketing":
                x_col, y_col, title = "channel", "conversions", "Conversions by Marketing Channel"
                chart_type = "bar"
                if "visitor" in query_lower:
                    y_col, title = "visitors", "Visitors by Marketing Channel"
                elif "roi" in query_lower:
                    y_col, title = "roi", "ROI by Marketing Channel"
                    
            elif table == "employees":
                x_col, y_col, title = "department", "employees", "Employees by Department"
                chart_type = "bar"
                if "salary" in query_lower:
                    y_col, title = "avg_salary", "Average Salary by Department"
                elif "satisfaction" in query_lower:
                    y_col, title = "satisfaction", "Employee Satisfaction"
                    
            elif table == "quarterly":
                x_col, y_col, title = "quarter", "revenue", "Quarterly Revenue"
                if "profit" in query_lower:
                    y_col, title = "profit", "Quarterly Profit"
                elif "margin" in query_lower:
                    y_col, title = "margin", "Quarterly Profit Margin"
                    
            elif table == "satisfaction":
                x_col, y_col, title = "metric", "score", "Customer Satisfaction Scores"
                chart_type = "bar"
                
            elif table == "inventory":
                x_col, y_col, title = "category", "total_value", "Inventory Value by Category"
                chart_type = "bar"
            
            # Generate chart
            result = generate_chart_tool(data, chart_type, x_col, y_col, title)
            logger.info(f"Chart generated: {chart_type} of {y_col} vs {x_col}")
            
            # Calculate statistics
            values = [row[y_col] for row in data]
            if values:
                min_val = min(values)
                max_val = max(values)
                avg_val = sum(values) / len(values)
                total_val = sum(values)
                growth = ((max_val - min_val) / min_val * 100) if min_val > 0 else 0
                
                result['analysis'] = {
                    'min': min_val,
                    'max': max_val,
                    'average': round(avg_val, 2),
                    'total': total_val,
                    'growth_percent': round(growth, 1)
                }
                
                # Add text report if requested
                if has_report_keyword:
                    report_lines = []
                    report_lines.append(f"## {title}")
                    report_lines.append("")
                    report_lines.append("### Key Metrics")
                    
                    if y_col in ['revenue', 'expenses', 'cost', 'profit', 'total_value', 'avg_salary']:
                        report_lines.append(f"- **Minimum:** ${min_val:,.0f}")
                        report_lines.append(f"- **Maximum:** ${max_val:,.0f}")
                        report_lines.append(f"- **Average:** ${avg_val:,.2f}")
                        report_lines.append(f"- **Total:** ${total_val:,.0f}")
                    else:
                        report_lines.append(f"- **Minimum:** {min_val:,.0f}")
                        report_lines.append(f"- **Maximum:** {max_val:,.0f}")
                        report_lines.append(f"- **Average:** {avg_val:,.2f}")
                        report_lines.append(f"- **Total:** {total_val:,.0f}")
                    
                    report_lines.append(f"- **Growth:** {growth:.1f}%")
                    report_lines.append("")
                    report_lines.append("### Analysis")
                    
                    if growth > 50:
                        report_lines.append(f"📈 **Strong Growth:** Exceptional growth of {growth:.1f}% indicates robust performance.")
                    elif growth > 20:
                        report_lines.append(f"📊 **Positive Trend:** Steady growth of {growth:.1f}% demonstrates healthy progress.")
                    elif growth > 0:
                        report_lines.append(f"➡️ **Moderate Growth:** Growth of {growth:.1f}% shows stable performance.")
                    else:
                        report_lines.append(f"⚠️ **Declining Trend:** Negative growth of {growth:.1f}% requires attention.")
                    
                    report_lines.append("")
                    report_lines.append("### Data Summary")
                    report_lines.append("")
                    report_lines.append(f"| {x_col.title()} | {y_col.title()} |")
                    report_lines.append("|--------|-------|")
                    
                    for row in data:
                        period = row.get(x_col, '')
                        value = row.get(y_col, 0)
                        if y_col in ['revenue', 'expenses', 'cost', 'profit', 'total_value', 'avg_salary']:
                            report_lines.append(f"| {period} | ${value:,.0f} |")
                        else:
                            report_lines.append(f"| {period} | {value:,.0f} |")
                    
                    report_lines.append("")
                    report_lines.append("### Recommendations")
                    
                    if y_col == 'revenue' and growth > 0:
                        report_lines.append("- Continue current growth strategies")
                        report_lines.append("- Monitor market trends for sustained growth")
                        report_lines.append("- Consider scaling operations")
                    elif y_col == 'expenses':
                        report_lines.append("- Review expense trends for optimization")
                        report_lines.append("- Identify cost reduction opportunities")
                        report_lines.append("- Maintain balance with revenue")
                    else:
                        report_lines.append("- Monitor trends regularly")
                        report_lines.append("- Implement data-driven strategies")
                        report_lines.append("- Focus on continuous improvement")
                    
                    result['report'] = '\n'.join(report_lines)
            
            return json.dumps(result), {}
            
        except Exception as e:
            logger.error(f"Direct chart generation failed: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return f"Error generating chart: {str(e)}", {}
    
    # For non-chart requests, use the agent
    system_prompt = """You are an AI Business Intelligence Dashboard Assistant.

Your job is to analyze data, compute metrics, and provide insights.

AVAILABLE TOOLS:
- Math: add, subtract, multiply, divide, calculate_average, percent_change
- Data: query_data_tool(table) - Available tables: sales, products, traffic, demographics, regions, marketing, employees, quarterly, satisfaction, inventory

INSTRUCTIONS:
- Always use tools for calculations
- Provide clear, concise answers
- Include business insights
- Format responses professionally

Example: "Calculate average monthly revenue"
1. Call query_data_tool("sales")
2. Extract revenue values
3. Call calculate_average(values)
4. Present result with context
"""

    try:
        agent = Agent(
            model=model,
            system_prompt=system_prompt,
            tools=ANALYTICS_TOOLS,
            name="AnalyticsAssistant"
        )

        response = agent(query)
        
        # Handle guardrail intervention
        if hasattr(response, "stop_reason") and response.stop_reason == "guardrail_intervened":
            logger.warning("Guardrail intervened in Analytics Agent")
            return str(response), {}
            
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
        result, _ = get_analytics_response("show monthly revenue chart")
        if "image_base64" in result:
            print("SUCCESS: Chart JSON returned")
        else:
            print("Response:", result[:200])
    else:
        print("Usage: python analytics_agent.py demo")
