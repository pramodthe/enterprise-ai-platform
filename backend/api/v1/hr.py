from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from backend.agents.hr_agent import (
    get_hr_agent_response,
    select_people_for_query,
    should_attach_people_cards,
)

router = APIRouter()

class EmployeeQuery(BaseModel):
    question: str
    session_id: Optional[str] = None

class Person(BaseModel):
    id: str
    name: str
    title: str
    department: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = []
    manager: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

class EmployeeResponse(BaseModel):
    answer: str
    source: str = "HR Agent"
    people: List[Person] = []

@router.post("/hr/query", response_model=EmployeeResponse)
async def query_hr_agent(query: EmployeeQuery):
    """
    Query the HR agent for employee information
    """
    try:
        response = get_hr_agent_response(query.question, query.session_id)
        people = select_people_for_query(query.question, response) if should_attach_people_cards(query.question) else []
        return EmployeeResponse(answer=response, source="HR Agent", people=people)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing HR query: {str(e)}")

@router.get("/hr/health")
async def hr_agent_health():
    """
    Health check for HR agent
    """
    return {"status": "healthy", "agent": "HR Agent"}
