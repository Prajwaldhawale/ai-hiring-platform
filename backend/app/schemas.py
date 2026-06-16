from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

# User Schemas
class UserRegister(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern="^(ROLE_HR|ROLE_CANDIDATE)$")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Job Schemas
class JobCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    required_skills: List[str] = []
    preferred_skills: List[str] = []

class JobOut(BaseModel):
    id: str
    title: str
    description: str
    required_skills: List[str]
    preferred_skills: List[str]
    created_by: str

    class Config:
        from_attributes = True

# Candidate Schemas
class CandidateOut(BaseModel):
    id: str
    user_id: str
    resume_url: Optional[str] = None
    skills: List[str]
    experience: List[dict] = []
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True

# AI Evaluation Schemas
class AIEvaluationOut(BaseModel):
    id: str
    application_id: str
    strengths: List[str]
    weaknesses: List[str]
    missing_skills: List[str]
    interview_questions: List[str]

    class Config:
        from_attributes = True

# Application Schemas
class ApplicationOut(BaseModel):
    id: str
    candidate_id: str
    job_id: str
    score: Optional[float] = None
    status: str
    candidate: Optional[CandidateOut] = None
    job: Optional[JobOut] = None
    evaluation: Optional[AIEvaluationOut] = None

    class Config:
        from_attributes = True

class ApplicationStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(APPLIED|SCREENED|INTERVIEW_SCHEDULED|INTERVIEWED|SELECTED|REJECTED)$")

# Analytics Schemas
class FunnelStage(BaseModel):
    stage: str
    count: int

class JobFunnel(BaseModel):
    job_id: str
    job_title: str
    stages: List[FunnelStage]

class AnalyticsOut(BaseModel):
    total_jobs: int
    total_candidates: int
    total_applications: int
    conversion_rate: float
    average_score: float
    funnel: List[FunnelStage]
    job_funnels: List[JobFunnel]
