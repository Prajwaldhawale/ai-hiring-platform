from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Job, User
from app.schemas import JobCreate, JobOut
from app.utils.auth import get_current_user, require_hr

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("", response_model=List[JobOut])
def get_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Fetch all jobs. Open to both HR and Candidate.
    return db.query(Job).all()

@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_hr: User = Depends(require_hr)
):
    new_job = Job(
        title=job_data.title,
        description=job_data.description,
        required_skills=job_data.required_skills,
        preferred_skills=job_data.preferred_skills,
        created_by=current_hr.id
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

@router.put("/{job_id}", response_model=JobOut)
def update_job(
    job_id: str,
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_hr: User = Depends(require_hr)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Verify ownership
    if job.created_by != current_hr.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit jobs created by yourself"
        )
        
    job.title = job_data.title
    job.description = job_data.description
    job.required_skills = job_data.required_skills
    job.preferred_skills = job_data.preferred_skills
    
    db.commit()
    db.refresh(job)
    return job

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_hr: User = Depends(require_hr)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # Verify ownership
    if job.created_by != current_hr.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete jobs created by yourself"
        )
        
    db.delete(job)
    db.commit()
    return None
