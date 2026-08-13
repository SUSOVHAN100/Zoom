import os
import unittest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set cwd and import app components
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database.database import Base, get_db
from app.database.seed import seed_db
from app.models.user import User
from app.models.meeting import Meeting
from app.models.meeting_link import MeetingLink
from app.models.participant import Participant

# Configure Test Database
TEST_DB_FILE = "./test_zoom_clone.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Overrides get_db dependency in FastAPI
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

class TestZoomBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create schema and seed testing DB
        Base.metadata.create_all(bind=engine)
        db = TestingSessionLocal()
        # Seed default user manually in the test database
        default_email = "user@example.com"
        default_name = "Default User"
        user = db.query(User).filter(User.email == default_email).first()
        if not user:
            new_user = User(name=default_name, email=default_email)
            db.add(new_user)
            db.commit()
        db.close()
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        # Remove testing DB file
        Base.metadata.drop_all(bind=engine)
        if os.path.exists(TEST_DB_FILE):
            try:
                os.remove(TEST_DB_FILE)
            except OSError:
                pass

    def test_01_health_check(self):
        """1. Verify FastAPI app starts up and responds to requests."""
        response = self.client.get("/docs")
        self.assertEqual(response.status_code, 200)

    def test_02_create_instant_meeting(self):
        """2. POST /api/meetings creates an instant meeting correctly."""
        response = self.client.post("/api/meetings")
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("meeting_id", data)
        self.assertIn("invite_token", data["meeting_link"])
        self.assertIn("invite_url", data["meeting_link"])
        self.assertEqual(data["status"], "live")
        
        # Keep track of details for sequential tests
        self.__class__.instant_meeting_id = data["meeting_id"]
        self.__class__.instant_token = data["meeting_link"]["invite_token"]

    def test_03_meeting_id_and_token_uniqueness(self):
        """3 & 4. Verify Meeting IDs and Invite Tokens generated are unique."""
        r1 = self.client.post("/api/meetings")
        r2 = self.client.post("/api/meetings")
        self.assertEqual(r1.status_code, 201)
        self.assertEqual(r2.status_code, 201)
        d1 = r1.json()
        d2 = r2.json()
        
        self.assertNotEqual(d1["meeting_id"], d2["meeting_id"])
        self.assertNotEqual(d1["meeting_link"]["invite_token"], d2["meeting_link"]["invite_token"])

    def test_05_get_meeting_details(self):
        """5. GET /api/meetings/{meeting_id} returns meeting or 404."""
        # Valid retrieval
        response = self.client.get(f"/api/meetings/{self.instant_meeting_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["meeting_id"], self.instant_meeting_id)

        # Invalid retrieval
        response = self.client.get("/api/meetings/non-existent-id")
        self.assertEqual(response.status_code, 404)

    def test_06_join_valid_meeting_as_guest(self):
        """6. POST /api/meetings/join registers guests to the database."""
        payload = {
            "meeting_id_or_token": self.instant_meeting_id,
            "display_name": "Test Guest User"
        }
        response = self.client.post("/api/meetings/join", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["meeting"]["meeting_id"], self.instant_meeting_id)
        self.assertEqual(data["participant"]["display_name"], "Test Guest User")
        self.assertFalse(data["participant"]["is_host"])
        self.__class__.guest_participant_id = data["participant"]["id"]

    def test_07_join_meeting_via_token(self):
        """Verify joining a meeting via invite token works correctly."""
        payload = {
            "meeting_id_or_token": self.instant_token,
            "display_name": "Second Guest User"
        }
        response = self.client.post("/api/meetings/join", json=payload)
        self.assertEqual(response.status_code, 200)

    def test_08_join_meeting_as_host(self):
        """Verify joining as 'Default User' resolves is_host to True."""
        payload = {
            "meeting_id_or_token": self.instant_meeting_id,
            "display_name": "Default User"
        }
        response = self.client.post("/api/meetings/join", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["participant"]["is_host"])

    def test_09_reject_invalid_meeting_join(self):
        """7. Joining non-existent meetings returns 404."""
        payload = {
            "meeting_id_or_token": "non-existent-id",
            "display_name": "Rejection Tester"
        }
        response = self.client.post("/api/meetings/join", json=payload)
        self.assertEqual(response.status_code, 404)

    def test_10_reject_invalid_display_name(self):
        """8. Joining with empty or whitespace display name returns 422 or 400."""
        # Empty string
        payload = {
            "meeting_id_or_token": self.instant_meeting_id,
            "display_name": "   "
        }
        response = self.client.post("/api/meetings/join", json=payload)
        # Service throws ValueError which router converts to HTTP 400 Bad Request
        self.assertEqual(response.status_code, 400)

    def test_11_schedule_meeting(self):
        """9. POST /api/meetings/schedule creates future meetings."""
        future_time = (datetime.utcnow() + timedelta(days=2)).isoformat()
        payload = {
            "title": "Board Sync meeting",
            "description": "Discussing quarterly milestones",
            "scheduled_at": future_time,
            "duration": 60
        }
        response = self.client.post("/api/meetings/schedule", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["title"], "Board Sync meeting")
        self.assertEqual(data["duration"], 60)
        self.assertEqual(data["status"], "scheduled")
        self.__class__.scheduled_meeting_id = data["meeting_id"]

    def test_12_upcoming_and_recent_meetings(self):
        """10 & 11. Retrieve scheduled upcoming and past recent meetings."""
        # Upcoming
        response = self.client.get("/api/meetings/upcoming")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(len(data) >= 1)
        self.assertEqual(data[0]["meeting_id"], self.scheduled_meeting_id)

        # Recent
        response = self.client.get("/api/meetings/recent")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(len(data) >= 1)

    def test_13_participants_roster_listing(self):
        """12. GET /api/meetings/{meeting_id}/participants returns active members."""
        response = self.client.get(f"/api/meetings/{self.instant_meeting_id}/participants")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(len(data) >= 2)
        names = [p["display_name"] for p in data]
        self.assertIn("Test Guest User", names)

    def test_14_participant_leave_and_removal(self):
        """13. DELETE /api/participants/{id} soft-exits guest from room."""
        # Evict participant
        response = self.client.delete(f"/api/participants/{self.guest_participant_id}")
        self.assertEqual(response.status_code, 200)
        
        # Verify no longer returned in active roster listing
        response = self.client.get(f"/api/meetings/{self.instant_meeting_id}/participants")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        ids = [p["id"] for p in data]
        self.assertNotIn(self.guest_participant_id, ids)

    def test_15_websocket_connection_and_disconnect(self):
        """14 & 15. WebSocket accepts and disconnects cleanly."""
        # Setup WebSocket test client
        with self.client.websocket_connect(f"/ws/{self.instant_meeting_id}?client_id=tester_ws_id") as websocket:
            # Send join signaling message
            websocket.send_json({"type": "join", "name": "WebSocket Tester"})
            
            # Send message and ensure no crashes occur
            websocket.send_json({
                "type": "offer",
                "target_id": "remote_peer_123",
                "payload": {"sdp": "v=0..."}
            })
            
        # Exiting 'with' block disconnects WebSocket cleanly

    def test_16_sqlite_foreign_key_and_database_persistence(self):
        """16. Verify SQLite persistence details."""
        db = TestingSessionLocal()
        # Query matching entities
        meeting = db.query(Meeting).filter(Meeting.meeting_id == self.instant_meeting_id).first()
        self.assertIsNotNone(meeting)
        
        # Verify one-to-one mapping with MeetingLink
        link = db.query(MeetingLink).filter(MeetingLink.meeting_id == meeting.id).first()
        self.assertIsNotNone(link)
        self.assertEqual(link.meeting_id, meeting.id)
        db.close()

if __name__ == "__main__":
    unittest.main()
