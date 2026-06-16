import os
import shutil
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload

from app.db import get_db, SessionLocal
from app.models import Application, Candidate, Job, User, AIEvaluation
from app.schemas import ApplicationOut, ApplicationStatusUpdate, AIEvaluationOut, CandidateOut
from app.utils.auth import get_current_user, require_candidate, require_hr
from app.utils.kafka_producer import kafka_producer
from app.utils.websocket import manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/applications", tags=["applications"])

# Create uploads folder if it doesn't exist
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
async def apply_to_job(
    job_id: str = Form(...),
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_candidate)
):
    # Retrieve Candidate profile
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
        
    # Verify job exists
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found")
        
    # Check if candidate already applied to this job
    existing_app = db.query(Application).filter(
        Application.candidate_id == candidate.id,
        Application.job_id == job_id
    ).first()
    if existing_app:
        raise HTTPException(status_code=400, detail="You have already applied to this job")
        
    # Create the application record first to get a unique application ID
    new_app = Application(
        candidate_id=candidate.id,
        job_id=job_id,
        status="APPLIED"
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    
    # Save the file locally using application_id and original extension
    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{new_app.id}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Failed to save uploaded resume: {e}")
        # Clean up application
        db.delete(new_app)
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to save resume file")
        
    # Update candidate's resume URL (relative url for download)
    resume_url = f"/uploads/{safe_filename}"
    candidate.resume_url = resume_url
    db.commit()
    
    # Produce event to Kafka: application-submitted
    event_payload = {
        "application_id": new_app.id,
        "candidate_id": candidate.id,
        "job_id": job_id,
        "resume_url": resume_url,
        "file_path": file_path
    }
    kafka_producer.send_event("application-submitted", event_payload)
    
    # Trigger mock pipeline if Kafka is in mock mode
    if kafka_producer.mock_mode and background_tasks:
        from workers.parser_worker import process_application_submitted
        from app.db import SessionLocal
        
        def run_mock_pipeline(app_id, path):
            db_bg = SessionLocal()
            try:
                process_application_submitted(app_id, path, db_bg)
            except Exception as ex:
                logger.error(f"Error running mock pipeline: {ex}")
            finally:
                db_bg.close()
                
        background_tasks.add_task(run_mock_pipeline, new_app.id, file_path)
        
    # Refresh to load relationships
    app_out = db.query(Application).options(
        joinedload(Application.job),
        joinedload(Application.candidate).joinedload(Candidate.user)
    ).filter(Application.id == new_app.id).first()
    
    return app_out

@router.get("/profile", response_model=CandidateOut)
def get_candidate_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_candidate)
):
    candidate = db.query(Candidate).options(joinedload(Candidate.user)).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    return candidate

@router.get("/my", response_model=List[ApplicationOut])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_candidate)
):
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
        
    return db.query(Application).options(
        joinedload(Application.job),
        joinedload(Application.candidate).joinedload(Candidate.user),
        joinedload(Application.evaluation)
    ).filter(Application.candidate_id == candidate.id).all()

@router.get("", response_model=List[ApplicationOut])
def get_hr_applications(
    db: Session = Depends(get_db),
    current_hr: User = Depends(require_hr)
):
    # Recruiter gets applications for jobs they created
    return db.query(Application).options(
        joinedload(Application.job),
        joinedload(Application.candidate).joinedload(Candidate.user),
        joinedload(Application.evaluation)
    ).join(Job).filter(Job.created_by == current_hr.id).all()

@router.get("/{app_id}/evaluation", response_model=AIEvaluationOut)
def get_application_evaluation(
    app_id: str,
    db: Session = Depends(get_db),
    current_hr: User = Depends(require_hr)
):
    # Verify application and that job belongs to current HR recruiter
    app = db.query(Application).join(Job).filter(
        Application.id == app_id,
        Job.created_by == current_hr.id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized")
        
    evaluation = db.query(AIEvaluation).filter(AIEvaluation.application_id == app_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="AI Evaluation not found for this candidate yet")
        
    return evaluation

@router.patch("/{app_id}/status", response_model=ApplicationOut)
async def update_application_status(
    app_id: str,
    status_data: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_hr: User = Depends(require_hr)
):
    # Verify application and ownership of the job post
    app = db.query(Application).options(
        joinedload(Application.job),
        joinedload(Application.candidate).joinedload(Candidate.user)
    ).join(Job).filter(
        Application.id == app_id,
        Job.created_by == current_hr.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized")
        
    app.status = status_data.status
    db.commit()
    db.refresh(app)
    
    # Broadcast update over WebSockets
    await manager.broadcast({
        "event": "application_status_updated",
        "data": {
            "application_id": app.id,
            "status": app.status,
            "candidate_name": app.candidate.user.name,
            "job_title": app.job.title
        }
    })
    
    return app

@router.delete("/profile/resume", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_candidate)
):
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    
    if candidate.resume_url:
        file_name = candidate.resume_url.split("/")[-1]
        file_path = os.path.join(UPLOAD_DIR, file_name)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                logger.error(f"Error removing resume file: {e}")
                
    candidate.resume_url = None
    candidate.skills = []
    candidate.experience = []
    db.commit()
    return None

@router.post("/profile/resume", response_model=CandidateOut)
async def upload_profile_resume(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_candidate)
):
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
        
    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"profile_{candidate.id}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Failed to save profile resume: {e}")
        raise HTTPException(status_code=500, detail="Failed to save resume file")
        
    resume_url = f"/uploads/{safe_filename}"
    candidate.resume_url = resume_url
    db.commit()
    
    from workers.parser_worker import parse_skills_and_experience
    
    def parse_and_update(cand_id, path):
        db_bg = SessionLocal()
        try:
            cand = db_bg.query(Candidate).filter(Candidate.id == cand_id).first()
            if cand:
                skills, experience = parse_skills_and_experience(path)
                cand.skills = skills
                cand.experience = experience
                db_bg.commit()
                logger.info(f"Background parser parsed profile resume for {cand_id}: {skills}")
        except Exception as ex:
            logger.error(f"Error parsing profile resume: {ex}")
        finally:
            db_bg.close()
            
    if background_tasks:
        background_tasks.add_task(parse_and_update, candidate.id, file_path)
    else:
        skills, experience = parse_skills_and_experience(file_path)
        candidate.skills = skills
        candidate.experience = experience
        db.commit()
        
    db.refresh(candidate)
    return candidate

@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_candidate)
):
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    app = db.query(Application).filter(
        Application.id == app_id,
        Application.candidate_id == candidate.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    db.delete(app)
    db.commit()
    return None
