import json
import logging
from sqlalchemy.orm import Session
from confluent_kafka import Consumer, KafkaError

from app.config import settings
from app.db import SessionLocal
from app.models import Application, Candidate, Job
from app.utils.kafka_producer import kafka_producer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def calculate_match_score(cand_skills: list[str], req_skills: list[str], pref_skills: list[str]) -> float:
    # Normalize skills to lowercase
    cand_set = {s.strip().lower() for s in cand_skills}
    req_set = {s.strip().lower() for s in req_skills}
    pref_set = {s.strip().lower() for s in pref_skills}
    
    # Calculate required skills match (70% weight)
    if req_set:
        req_overlap = cand_set.intersection(req_set)
        req_score = len(req_overlap) / len(req_set)
    else:
        req_score = 1.0  # Default to 100% if no requirements specified
        
    # Calculate preferred skills match (30% weight)
    if pref_set:
        pref_overlap = cand_set.intersection(pref_set)
        pref_score = len(pref_overlap) / len(pref_set)
    else:
        pref_score = 1.0  # Default to 100% if no preferred skills specified
        
    score = (req_score * 0.7 + pref_score * 0.3) * 100
    return round(score, 1)

def process_resume_parsed(application_id: str, candidate_id: str, job_id: str, db: Session):
    logger.info(f"Processing resume-parsed for Application {application_id}")
    
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        logger.error(f"Application {application_id} not found")
        return
        
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    job = db.query(Job).filter(Job.id == job_id).first()
    
    if not candidate or not job:
        logger.error(f"Candidate {candidate_id} or Job {job_id} not found")
        return
        
    # Calculate score
    score = calculate_match_score(
        cand_skills=candidate.skills or [],
        req_skills=job.required_skills or [],
        pref_skills=job.preferred_skills or []
    )
    
    # Update application status and score
    app.score = score
    app.status = "SCREENED"
    db.commit()
    logger.info(f"Scored Application {application_id}: {score}%")
    
    # Emit next Kafka event: candidate-ranked
    event_payload = {
        "application_id": app.id,
        "candidate_id": candidate.id,
        "job_id": job.id,
        "score": score
    }
    kafka_producer.send_event("candidate-ranked", event_payload)
    
    # If Kafka is in mock mode, trigger the AI evaluation worker directly for local testing
    if kafka_producer.mock_mode:
        from workers.evaluator_worker import process_candidate_ranked
        process_candidate_ranked(app.id, candidate.id, job.id, score, db)

def main():
    logger.info("Candidate Ranking Worker starting up...")
    
    conf = {
        'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
        'group.id': 'candidate-ranker-group',
        'auto.offset.reset': 'earliest',
        'socket.timeout.ms': 3000
    }
    
    try:
        consumer = Consumer(conf)
        consumer.subscribe(['resume-parsed'])
        logger.info("Subscribed to 'resume-parsed' topic.")
    except Exception as e:
        logger.error(f"Could not connect to Kafka broker: {e}. Worker exiting.")
        return

    db = SessionLocal()
    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() != KafkaError._PARTITION_EOF:
                    logger.error(f"Kafka error: {msg.error()}")
                continue
                
            payload = json.loads(msg.value().decode('utf-8'))
            app_id = payload.get("application_id")
            cand_id = payload.get("candidate_id")
            job_id = payload.get("job_id")
            
            try:
                process_resume_parsed(app_id, cand_id, job_id, db)
            except Exception as ex:
                logger.error(f"Error processing message: {ex}")
                db.rollback()
    except KeyboardInterrupt:
        logger.info("Worker shutting down.")
    finally:
        consumer.close()
        db.close()

if __name__ == "__main__":
    main()
