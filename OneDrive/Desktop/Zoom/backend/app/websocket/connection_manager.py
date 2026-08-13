from typing import Dict, Optional
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Maps meeting_id -> Dict[client_id, WebSocket]
        self.active_rooms: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, meeting_id: str, client_id: str, websocket: WebSocket):
        """Accepts the WebSocket connection and registers it in the room."""
        await websocket.accept()
        if meeting_id not in self.active_rooms:
            self.active_rooms[meeting_id] = {}
        self.active_rooms[meeting_id][client_id] = websocket
        print(f"Client '{client_id}' connected to room '{meeting_id}'")

    def disconnect(self, meeting_id: str, client_id: str):
        """Removes the connection and deletes the room key if it becomes empty."""
        if meeting_id in self.active_rooms:
            if client_id in self.active_rooms[meeting_id]:
                del self.active_rooms[meeting_id][client_id]
                print(f"Client '{client_id}' disconnected from room '{meeting_id}'")
            if not self.active_rooms[meeting_id]:
                del self.active_rooms[meeting_id]
                print(f"Room '{meeting_id}' is empty and has been removed from memory")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Sends a JSON message directly to a single connection."""
        await websocket.send_json(message)

    async def forward_message(self, meeting_id: str, target_id: str, message: dict) -> bool:
        """Forwards a signaling message to a target peer in the room. Returns success status."""
        if meeting_id in self.active_rooms:
            websocket = self.active_rooms[meeting_id].get(target_id)
            if websocket:
                try:
                    await websocket.send_json(message)
                    return True
                except Exception as e:
                    print(f"Error forwarding message to client '{target_id}': {e}")
        return False

    async def broadcast_to_room(self, meeting_id: str, message: dict, exclude_client_id: Optional[str] = None):
        """Broadcasts a JSON message to all clients in the room (except the sender)."""
        if meeting_id in self.active_rooms:
            # Create a list of targets to avoid dictionary mutation during iteration
            targets = list(self.active_rooms[meeting_id].items())
            for client_id, websocket in targets:
                if client_id != exclude_client_id:
                    try:
                        await websocket.send_json(message)
                    except Exception as e:
                        print(f"Error broadcasting to client '{client_id}': {e}")
