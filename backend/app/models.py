import uuid
from sqlalchemy import Column, String, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.db import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # ROLE_HR, ROLE_CANDIDATE

    # Relationships
    jobs = relationship("Job", back_populates="creator", cascade="all, delete-orphan")
    candidate_profile = relationship("Candidate", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    required_skills = Column(JSON, default=list)  # List of strings
    preferred_skills = Column(JSON, default=list)  # List of strings
    created_by = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    creator = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    resume_url = Column(String, nullable=True)
    skills = Column(JSON, default=list)  # List of strings parsed from resume
    experience = Column(JSON, default=list)  # Structured experience items

    # Relationships
    user = relationship("User", back_populates="candidate_profile")
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, default=generate_uuid)
    candidate_id = Column(String, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=True)  # Calculated matching score (0-100)
    status = Column(String, default="APPLIED")  # APPLIED, SCREENED, INTERVIEW_SCHEDULED, INTERVIEWED, SELECTED, REJECTED

    # Relationships
    candidate = relationship("Candidate", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    evaluation = relationship("AIEvaluation", back_populates="application", uselist=False, cascade="all, delete-orphan")


class AIEvaluation(Base):
    __tablename__ = "ai_evaluations"

    id = Column(String, primary_key=True, default=generate_uuid)
    application_id = Column(String, ForeignKey("applications.id", ondelete="CASCADE"), unique=True, nullable=False)
    strengths = Column(JSON, default=list)  # List of strings
    weaknesses = Column(JSON, default=list)  # List of strings
    missing_skills = Column(JSON, default=list)  # List of strings
    interview_questions = Column(JSON, default=list)  # List of strings

    # Relationships
    application = relationship("Application", back_populates="evaluation")
