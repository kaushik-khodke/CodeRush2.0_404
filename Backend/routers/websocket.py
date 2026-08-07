import json
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead_connections.append(connection)
        for dead in dead_connections:
            self.disconnect(dead)

ws_manager = ConnectionManager()

@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection open and receive optional messages
            data = await websocket.receive_text()
            await websocket.send_text(json.dumps({"status": "acknowledged", "echo": data}))
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
