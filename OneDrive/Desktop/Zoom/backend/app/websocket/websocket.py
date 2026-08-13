from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.meeting import Meeting
from app.websocket.connection_manager import ConnectionManager

router = APIRouter()
manager = ConnectionManager()

@router.websocket("/ws/{meeting_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    meeting_id: str,
    client_id: str,
    db: Session = Depends(get_db)
):
    # 1. Validate that the meeting exists in database before accepting the connection
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        # Reject connection with policy violation close code if meeting not found
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Meeting not found")
        return

    # 2. Accept and register connection in connection manager
    await manager.connect(meeting_id, client_id, websocket)
    
    # Broadcast 'join' to other participants in the room
    await manager.broadcast_to_room(
        meeting_id,
        {
            "type": "join",
            "sender_id": client_id
        },
        exclude_client_id=client_id
    )

    try:
        while True:
            # Receive incoming JSON signaling payloads
            data = await websocket.receive_json()
            msg_type = data.get("type")
            target_id = data.get("target_id")

            # Force sender_id to match client_id for signaling message integrity
            data["sender_id"] = client_id

            # Route signaling messages to the appropriate participants
            if msg_type in ["offer", "answer", "ice_candidate"]:
                if target_id:
                    # Forward directly to the target peer
                    await manager.forward_message(meeting_id, target_id, data)
                else:
                    # Broadcast as fallback if target is not specified
                    await manager.broadcast_to_room(meeting_id, data, exclude_client_id=client_id)
            elif msg_type == "join":
                # Handle explicit join message if sent
                await manager.broadcast_to_room(meeting_id, data, exclude_client_id=client_id)
            elif msg_type == "leave":
                # Client initiated a clean exit
                break
            else:
                # General message forwarding
                await manager.broadcast_to_room(meeting_id, data, exclude_client_id=client_id)

    except WebSocketDisconnect:
        # Abrupt disconnect
        print(f"WebSocket disconnected abruptly for client '{client_id}' in room '{meeting_id}'")
    finally:
        # Clean up in-memory registry
        manager.disconnect(meeting_id, client_id)
        # Notify other participants that this peer has left
        await manager.broadcast_to_room(
            meeting_id,
            {
                "type": "leave",
                "sender_id": client_id
            }
        )
