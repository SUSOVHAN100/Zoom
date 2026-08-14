import threading
from typing import Dict, Set

class PresenceManager:
    """
    In-memory thread-safe manager for tracking real-time user presence.
    Tracks online users (connected to app/presence) and in-meeting users (connected to room WebSockets).
    Prevents duplicate counting when one user opens multiple tabs or connections.
    """
    def __init__(self):
        self._lock = threading.Lock()
        # Maps user_key -> set of active app presence connection IDs
        self._online_connections: Dict[str, Set[str]] = {}
        # Maps user_key -> set of active meeting connection IDs
        self._meeting_connections: Dict[str, Set[str]] = {}

    def track_app_connect(self, user_key: str, connection_id: str):
        with self._lock:
            if user_key not in self._online_connections:
                self._online_connections[user_key] = set()
            self._online_connections[user_key].add(connection_id)

    def track_app_disconnect(self, user_key: str, connection_id: str):
        with self._lock:
            if user_key in self._online_connections:
                self._online_connections[user_key].discard(connection_id)
                if not self._online_connections[user_key]:
                    del self._online_connections[user_key]

    def track_meeting_connect(self, user_key: str, connection_id: str):
        with self._lock:
            if user_key not in self._meeting_connections:
                self._meeting_connections[user_key] = set()
            self._meeting_connections[user_key].add(connection_id)

    def track_meeting_disconnect(self, user_key: str, connection_id: str):
        with self._lock:
            if user_key in self._meeting_connections:
                self._meeting_connections[user_key].discard(connection_id)
                if not self._meeting_connections[user_key]:
                    del self._meeting_connections[user_key]

    def get_online_users_count(self) -> int:
        with self._lock:
            all_online = set(self._online_connections.keys()).union(set(self._meeting_connections.keys()))
            return len(all_online)

    def get_in_meeting_users_count(self) -> int:
        with self._lock:
            return len(self._meeting_connections)

# Global singleton instance
presence_manager = PresenceManager()
