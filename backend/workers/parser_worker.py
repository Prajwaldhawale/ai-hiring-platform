import json
import logging
import os
import re
from sqlalchemy.orm import Session
from confluent_kafka import Consumer, KafkaError

from app.config import settings
from app.db import SessionLocal
from app.models import Application, Candidate
from app.utils.kafka_producer import kafka_producer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from pypdf import PdfReader

# List of common technical skills we can scan for in resumes
SKILL_KEYWORDS = [
    "Python", "FastAPI", "React", "PostgreSQL", "Docker", "Kafka",
    "Kubernetes", "AWS", "JavaScript", "TypeScript", "HTML", "CSS",
    "SQL", "Django", "Node.js", "Java", "Go", "Git", "GitHub Actions",
    "C++", "CICD", "Deep Learning", "Machine Learning", "Android Development",
    "Jenkins", "GitHub", "Web Development"
]

def parse_skills_and_experience(file_path: str):
    """
    Reads the file (PDF or plaintext) and performs a simple regex search to identify skills.
    Also mocks experience structure for display purposes.
    """
    extracted_skills = []
    text_content = ""
    
    if os.path.exists(file_path):
        if file_path.lower().endswith('.pdf'):
            try:
                reader = PdfReader(file_path)
                pages_text = []
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        pages_text.append(text)
                text_content = "\n".join(pages_text)
                logger.info(f"Extracted {len(text_content)} characters from PDF resume.")
            except Exception as e:
                logger.error(f"Error parsing PDF resume: {e}")
        else:
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text_content = f.read()
            except Exception as e:
                logger.error(f"Error reading resume file directly: {e}")
            
    # If file content is read, check for skill keywords case-insensitively
    if text_content:
        for skill in SKILL_KEYWORDS:
            # Match word boundary, allowing Special chars like C++ or .js
            # Escape skill for regex, handling special chars
            escaped_skill = re.escape(skill)
            # Adjust word boundary for special chars like C++
            if skill.endswith('+') or skill.endswith('.'):
                pattern = r'(?:^|[\s,;])' + escaped_skill + r'(?:$|[\s,;])'
            else:
                pattern = r'\b' + escaped_skill + r'\b'
                
            if re.search(pattern, text_content, re.IGNORECASE):
                extracted_skills.append(skill)
    
    # Fallback default skills if none found to ensure a good demo experience
    if not extracted_skills:
        extracted_skills = ["Python", "FastAPI", "React", "SQL"]
        
    # Mock some realistic experience based on file path name or default values
    experience = [
        {
            "role": "Software Engineer",
            "company": "Tech Solutions Inc.",
            "duration": "2 Years",
            "description": "Developed web applications and worked with API integrations."
        },
        {
            "role": "Junior Developer",
            "company": "Digital Labs",
            "duration": "1 Year",
            "description": "Assisted in frontend UI development using React and CSS stylesheets."
        }
    ]
    
    return extracted_skills, experience

def process_application_submitted(application_id: str, file_path: str, db: Session):
    logger.info(f"Processing application-submitted for Application {application_id}")
    
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        logger.error(f"Application {application_id} not found in DB")
        return
        
    candidate = db.query(Candidate).filter(Candidate.id == app.candidate_id).first()
    if not candidate:
        logger.error(f"Candidate {app.candidate_id} not found in DB")
        return
        
    # Parse resume
    skills, experience = parse_skills_and_experience(file_path)
    
    # Update candidate in DB
    candidate.skills = skills
    candidate.experience = experience
    db.commit()
    logger.info(f"Updated Candidate {candidate.id} skills: {skills}")
    
    # Emit next Kafka event: resume-parsed
    event_payload = {
        "application_id": app.id,
        "candidate_id": candidate.id,
        "job_id": app.job_id
    }
    kafka_producer.send_event("resume-parsed", event_payload)
    
    # If Kafka is in mock mode, trigger the ranker worker directly for local testing
    if kafka_producer.mock_mode:
        from workers.ranker_worker import process_resume_parsed
        process_resume_parsed(app.id, candidate.id, app.job_id, db)

def main():
    logger.info("Resume Parsing Worker starting up...")
    
    conf = {
        'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
        'group.id': 'resume-parser-group',
        'auto.offset.reset': 'earliest',
        'socket.timeout.ms': 3000
    }
    
    try:
        consumer = Consumer(conf)
        consumer.subscribe(['application-submitted'])
        logger.info("Subscribed to 'application-submitted' topic.")
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
            file_path = payload.get("file_path")
            
            try:
                process_application_submitted(app_id, file_path, db)
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
