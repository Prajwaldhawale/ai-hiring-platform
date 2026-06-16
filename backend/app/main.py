import json
import logging
import asyncio
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from confluent_kafka import Consumer, KafkaError

from app.config import settings
from app.db import engine, Base
from app.routers import auth, jobs, applications, analytics
from app.utils.websocket import manager
from app.utils.kafka_producer import kafka_producer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing database: {e}")

app = FastAPI(title=settings.PROJECT_NAME)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev simplicity; lock down in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(analytics.router)

# Mount static uploads directory for serving resumes
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def read_root():
    return {"message": "AI Hiring Platform Backend API Running", "status": "healthy"}

# WebSockets Endpoint for Recruiting Dashboards
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection open and wait for incoming client pings/messages
            data = await websocket.receive_text()
            # Respond to ping or parse other requests
            await websocket.send_text(json.dumps({"status": "ping_received", "message": data}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# Background Consumer for WebSocket broadcasts
async def kafka_websocket_listener():
    logger.info("Starting background Kafka listener for WebSocket broadcast...")
    
    # Check if Kafka broker is reachable; if not, skip consumer to avoid log floods
    if kafka_producer.mock_mode or not kafka_producer.check_connection():
        logger.info("Kafka broker is unreachable. Real-time notifications will run via internal background tasks.")
        return
        
    conf = {
        'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
        'group.id': 'fastapi-ws-broadcaster',
        'auto.offset.reset': 'latest',
        'socket.timeout.ms': 3000
    }
    
    consumer = None
    try:
        consumer = Consumer(conf)
        consumer.subscribe(['candidate-evaluated'])
        logger.info("Successfully subscribed to Kafka 'candidate-evaluated' topic.")
    except Exception as e:
        logger.warning(
            f"Failed to initialize Kafka consumer: {e}. "
            "Real-time WebSocket events will fallback to mock-trigger broadcasts."
        )
        # We will loop and skip polling if consumer couldn't be initialized
        # In a mock setup, the worker processes or app can call helper broadcasts.
        
    while True:
        if consumer is not None:
            try:
                # Poll inside a thread pool to avoid blocking the event loop
                msg = await asyncio.to_thread(consumer.poll, 1.0)
                if msg is None:
                    await asyncio.sleep(0.1)
                    continue
                if msg.error():
                    if msg.error().code() != KafkaError._PARTITION_EOF:
                        logger.error(f"Kafka consumer error: {msg.error()}")
                    continue
                
                # Process message
                val = msg.value().decode('utf-8')
                payload = json.loads(val)
                logger.info(f"Consumed 'candidate-evaluated' event from Kafka: {payload}")
                
                # Broadcast to WS clients
                await manager.broadcast({
                    "event": "candidate_evaluated",
                    "data": payload
                })
            except Exception as e:
                logger.error(f"Error in Kafka consumer loop: {e}")
                await asyncio.sleep(1.0)
        else:
            await asyncio.sleep(5.0)  # Sleep if no consumer

@app.on_event("startup")
async def startup_event():
    # Start the background task
    asyncio.create_task(kafka_websocket_listener())
