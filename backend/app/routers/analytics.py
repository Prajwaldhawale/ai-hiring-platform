from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Application, Candidate, Job, User
from app.schemas import AnalyticsOut, FunnelStage, JobFunnel
from app.utils.auth import require_hr

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard", response_model=AnalyticsOut)
def get_analytics(
    db: Session = Depends(get_db),
    current_hr: User = Depends(require_hr)
):
    # Retrieve all jobs created by this HR Recruiter
    hr_jobs = db.query(Job).filter(Job.created_by == current_hr.id).all()
    job_ids = [j.id for j in hr_jobs]
    
    total_jobs = len(hr_jobs)
    total_candidates = db.query(Candidate).count()
    
    if not job_ids:
        return AnalyticsOut(
            total_jobs=0,
            total_candidates=total_candidates,
            total_applications=0,
            conversion_rate=0.0,
            average_score=0.0,
            funnel=[],
            job_funnels=[]
        )
        
    # Total applications to this recruiter's jobs
    total_applications = db.query(Application).filter(Application.job_id.in_(job_ids)).count()
    
    # Calculate conversion rate: (SELECTED / total_applications) * 100
    selected_count = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status == "SELECTED"
    ).count()
    conversion_rate = round((selected_count / total_applications) * 100, 1) if total_applications > 0 else 0.0
    
    # Average match score
    avg_score_query = db.query(func.avg(Application.score)).filter(
        Application.job_id.in_(job_ids),
        Application.score.isnot(None)
    ).scalar()
    average_score = round(float(avg_score_query), 1) if avg_score_query is not None else 0.0
    
    # General funnel counts
    stages = ["APPLIED", "SCREENED", "INTERVIEW_SCHEDULED", "INTERVIEWED", "SELECTED", "REJECTED"]
    funnel_stats = []
    for stage in stages:
        count = db.query(Application).filter(
            Application.job_id.in_(job_ids),
            Application.status == stage
        ).count()
        funnel_stats.append(FunnelStage(stage=stage, count=count))
        
    # Job-by-job funnel breakdown
    job_funnels = []
    for job in hr_jobs:
        job_stages = []
        for stage in stages:
            count = db.query(Application).filter(
                Application.job_id == job.id,
                Application.status == stage
            ).count()
            job_stages.append(FunnelStage(stage=stage, count=count))
        job_funnels.append(JobFunnel(
            job_id=job.id,
            job_title=job.title,
            stages=job_stages
        ))
        
    return AnalyticsOut(
        total_jobs=total_jobs,
        total_candidates=total_candidates,
        total_applications=total_applications,
        conversion_rate=conversion_rate,
        average_score=average_score,
        funnel=funnel_stats,
        job_funnels=job_funnels
    )
