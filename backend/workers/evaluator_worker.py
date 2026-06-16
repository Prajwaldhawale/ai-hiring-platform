import asyncio
import json
import logging
import os
from sqlalchemy.orm import Session
from confluent_kafka import Consumer, KafkaError

from app.config import settings
from app.db import SessionLocal
from app.models import Application, Candidate, Job, AIEvaluation
from app.utils.kafka_producer import kafka_producer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Attempt to import Gemini SDK
gemini_available = False
try:
    from google import genai
    from google.genai import types
    gemini_available = True
except ImportError:
    logger.warning("google-genai package not found. Gemini API features will be disabled.")

def get_gemini_evaluation(job: Job, candidate: Candidate):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not gemini_available:
        return None
        
    try:
        client = genai.Client(api_key=api_key)
        prompt = f"""
        You are an expert HR Recruiting Assistant. Evaluate the candidate for the following job:
        Job Title: {job.title}
        Job Description: {job.description}
        Required Skills: {job.required_skills}
        Preferred Skills: {job.preferred_skills}

        Candidate Profile:
        Extracted Skills: {candidate.skills}
        Experience details: {candidate.experience}

        Provide your evaluation in a JSON structure containing four keys:
        1. "strengths": A list of strings showing what makes this candidate a good fit.
        2. "weaknesses": A list of strings showing areas where the candidate falls short.
        3. "missing_skills": A list of skills from the job's required or preferred skills that are missing in the candidate's profile.
        4. "interview_questions": A list of 3-5 specific technical interview questions tailored to evaluate the candidate's skills relative to this job.

        Return ONLY raw valid JSON. Do not include markdown tags.
        """
        
        # We use the standard model in the new SDK
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        
        # Parse output
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        data = json.loads(text.strip())
        logger.info("Successfully fetched AI Evaluation from Gemini.")
        return data
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}. Falling back to programmatic evaluation.")
        return None

def get_programmatic_evaluation(job: Job, candidate: Candidate):
    # Heuristics based fallback
    cand_skills_lower = [s.lower() for s in (candidate.skills or [])]
    job_req_skills = job.required_skills or []
    job_pref_skills = job.preferred_skills or []
    
    # Identify missing skills
    missing = []
    matched = []
    
    for s in job_req_skills + job_pref_skills:
        if s.lower() not in cand_skills_lower:
            missing.append(s)
        else:
            matched.append(s)
            
    # Compile Strengths
    strengths = []
    if matched:
        strengths.append(f"Demonstrated core competence in key required technologies: {', '.join(matched[:3])}.")
    else:
        strengths.append("Foundational knowledge in software engineering.")
    
    if len(candidate.experience or []) > 1:
        strengths.append("Possesses professional experience in multiple previous roles.")
    else:
        strengths.append("Demonstrates solid project work history.")
        
    strengths.append(f"Clear alignment with job responsibilities for a {job.title} role.")
    
    # Compile Weaknesses
    weaknesses = []
    if missing:
        weaknesses.append(f"Lacks professional experience in the following skill areas: {', '.join(missing[:3])}.")
    else:
        weaknesses.append("No critical technical skill deficiencies identified.")
        
    weaknesses.append("Resume does not detail experience leading architectural decisions at scale.")
    
    # Compile Interview Questions
    questions = []
    if matched:
        questions.append(f"Can you explain your experience working with {matched[0]} and describe a complex challenge you solved using it?")
    else:
        questions.append("Can you walk us through your most complex software project and explain the architecture you chose?")
        
    if missing:
        questions.append(f"Since your profile does not explicitly list {missing[0]}, how would you approach ramping up on it if you joined our team?")
    else:
        questions.append("How do you handle writing clean, maintainable code when collaborating under tight deadlines?")
        
    questions.append("Describe a time you had to debug a difficult production issue. What tools and methodologies did you use?")
    questions.append(f"How do you stay updated with the latest trends and updates in the {job.title} domain?")
    
    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "missing_skills": missing,
        "interview_questions": questions
    }

def process_candidate_ranked(application_id: str, candidate_id: str, job_id: str, score: float, db: Session):
    logger.info(f"Processing candidate-ranked for Application {application_id}")
    
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        logger.error(f"Application {application_id} not found")
        return
        
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    job = db.query(Job).filter(Job.id == job_id).first()
    
    if not candidate or not job:
        logger.error(f"Candidate {candidate_id} or Job {job_id} not found")
        return
        
    # Get evaluation (API or Fallback)
    eval_data = get_gemini_evaluation(job, candidate)
    if not eval_data:
        eval_data = get_programmatic_evaluation(job, candidate)
        
    # Check if evaluation already exists
    evaluation = db.query(AIEvaluation).filter(AIEvaluation.application_id == application_id).first()
    if not evaluation:
        evaluation = AIEvaluation(
            application_id=application_id,
            strengths=eval_data.get("strengths", []),
            weaknesses=eval_data.get("weaknesses", []),
            missing_skills=eval_data.get("missing_skills", []),
            interview_questions=eval_data.get("interview_questions", [])
        )
        db.add(evaluation)
    else:
        evaluation.strengths = eval_data.get("strengths", [])
        evaluation.weaknesses = eval_data.get("weaknesses", [])
        evaluation.missing_skills = eval_data.get("missing_skills", [])
        evaluation.interview_questions = eval_data.get("interview_questions", [])
        
    db.commit()
    logger.info(f"AI Evaluation generated and saved for Application {application_id}.")
    
    # Emit next Kafka event: candidate-evaluated
    event_payload = {
        "application_id": app.id,
        "candidate_id": candidate.id,
        "job_id": job.id,
        "score": score,
        "strengths": evaluation.strengths,
        "weaknesses": evaluation.weaknesses,
        "missing_skills": evaluation.missing_skills,
        "interview_questions": evaluation.interview_questions
    }
    kafka_producer.send_event("candidate-evaluated", event_payload)
    
    # If Kafka is in mock mode, trigger the WebSocket broadcast directly from the FastAPI process
    if kafka_producer.mock_mode:
        from app.utils.websocket import manager
        
        # We run it as a coroutine
        try:
            # Check if event loop is running (FastAPI thread)
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.run_coroutine_threadable(
                    manager.broadcast({
                        "event": "candidate_evaluated",
                        "data": event_payload
                    })
                )
            else:
                loop.run_until_complete(
                    manager.broadcast({
                        "event": "candidate_evaluated",
                        "data": event_payload
                    })
                )
        except Exception as ex:
            # If we're not inside the FastAPI runner (e.g. running standalone script), just print
            logger.info(f"[MOCK BROADCAST] Live Update: Candidate Evaluated details: {event_payload}")

def main():
    logger.info("AI Evaluation Worker starting up...")
    
    conf = {
        'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
        'group.id': 'candidate-evaluator-group',
        'auto.offset.reset': 'earliest',
        'socket.timeout.ms': 3000
    }
    
    try:
        consumer = Consumer(conf)
        consumer.subscribe(['candidate-ranked'])
        logger.info("Subscribed to 'candidate-ranked' topic.")
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
            score = payload.get("score")
            
            try:
                process_candidate_ranked(app_id, cand_id, job_id, score, db)
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
