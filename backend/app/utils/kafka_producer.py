import json
import logging
import socket
from confluent_kafka import Producer

from app.config import settings

logger = logging.getLogger(__name__)

class KafkaProducerWrapper:
    def __init__(self):
        self.producer = None
        self.mock_mode = False
        self._checked = False

    def check_connection(self) -> bool:
        if self._checked:
            return not self.mock_mode
            
        self._checked = True
        try:
            server = settings.KAFKA_BOOTSTRAP_SERVERS.split(",")[0]
            if ":" in server:
                host, port = server.split(":")
                port = int(port)
            else:
                host = server
                port = 9092
                
            # Perform a fast TCP connect check
            with socket.create_connection((host, port), timeout=1.0):
                logger.info(f"Kafka broker successfully reached at {host}:{port}")
                return True
        except Exception:
            logger.warning(
                f"Kafka broker at {settings.KAFKA_BOOTSTRAP_SERVERS} is unreachable. "
                "Falling back to MOCK mode (in-memory pipeline execution)."
            )
            self.mock_mode = True
            return False

    def get_producer(self):
        if not self.check_connection():
            return None
        if self.producer is not None:
            return self.producer

        conf = {
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'client.id': 'fastapi-producer',
            'socket.timeout.ms': 3000,
            'message.timeout.ms': 3000
        }
        try:
            self.producer = Producer(conf)
            logger.info("Kafka Producer successfully initialized.")
        except Exception as e:
            logger.warning(
                f"Could not connect to Kafka bootstrap servers: {settings.KAFKA_BOOTSTRAP_SERVERS}. "
                f"Error: {e}. Falling back to MOCK mode."
            )
            self.mock_mode = True
        return self.producer

    def send_event(self, topic: str, payload: dict):
        producer = self.get_producer()
        if self.mock_mode or producer is None:
            logger.info(f"[MOCK KAFKA PRODUCER] Event published to topic '{topic}': {payload}")
            # In mock mode, if we are running without docker/kafka, we can run worker logic directly
            # or just log it. We will log it.
            return

        try:
            # Produce asynchronously
            payload_str = json.dumps(payload)
            producer.produce(topic, value=payload_str.encode('utf-8'), callback=self._delivery_report)
            producer.poll(0)  # Serve delivery callbacks
        except Exception as e:
            logger.error(f"Failed to publish event to Kafka: {e}")

    def _delivery_report(self, err, msg):
        if err is not None:
            logger.error(f"Message delivery failed: {err}")
        else:
            logger.info(f"Message delivered to {msg.topic()} [{msg.partition()}]")

    def flush(self):
        if self.producer:
            self.producer.flush()

kafka_producer = KafkaProducerWrapper()
