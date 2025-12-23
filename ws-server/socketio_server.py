# server/socketio_server.py
from flask import request, current_app
from flask_socketio import SocketIO, join_room, leave_room, emit
from flask_jwt_extended import decode_token
from models import db, RoomParticipant, User
import requests
import os

socketio = SocketIO(cors_allowed_origins="*")  # tighten in prod
MAX_MESH = 10

# live maps
room_sockets = {}             # room_id(str) -> set(sids)
sid_meta = {}                 # sid -> {user_id, room_id, user_details}

def init_socketio(app):
    socketio.init_app(app)
    register_handlers()

def _user_from_token(token):
    try:
        sub = decode_token(token)["sub"]
        return User.query.get(int(sub))
    except Exception:
        return None

def _in_room(user_id, room_id):
    return db.session.query(RoomParticipant)\
        .filter_by(user_id=user_id, room_id=room_id).first() is not None

def _fetch_user_details(user_id):
    """Fetch user details from API"""
    try:
        user = User.query.get(user_id)
        if user:
            return {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "profile": user.profile,
                "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') else None
            }
    except Exception as e:
        current_app.logger.error(f"Failed to fetch user details for {user_id}: {e}")
        # Fallback to database
        user = User.query.get(user_id)
        if user:
            return {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "profile": user.profile,
                "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') else None
            }
    return None

def _get_room_participants(room_id):
    """Get all current participants in a room with their details"""
    participants = []
    sids = room_sockets.get(room_id, set())
    
    for sid in sids:
        meta = sid_meta.get(sid)
        if meta and 'user_details' in meta:
            participant = meta['user_details'].copy()
            participant['socket_id'] = sid
            participant['is_online'] = True
            participants.append(participant)
    
    return participants

def register_handlers():

    @socketio.on("connect")
    def on_connect(auth):
        token = (auth or {}).get("token")
        room_id = (auth or {}).get("roomId")
        if not token or not room_id:
            return False

        user = _user_from_token(token)
        if not user or not _in_room(user.id, int(room_id)):
            return False

        # Fetch user details from API
        user_details = _fetch_user_details(user.id)
        if not user_details:
            current_app.logger.error(f"Could not fetch details for user {user.id}")
            return False

        rid = str(room_id)
        sids = room_sockets.get(rid, set())
        if len(sids) >= MAX_MESH:
            emit("room:full", {"limit": MAX_MESH})
            return False

        join_room(rid)
        sids.add(request.sid)
        room_sockets[rid] = sids
        sid_meta[request.sid] = {
            "user_id": user.id, 
            "room_id": rid,
            "user_details": user_details
        }

        # Emit user joined to others in room
        emit("presence:join", {
            "user": user_details,
            "socketId": request.sid,
            "timestamp": str(current_app.get_timestamp() if hasattr(current_app, 'get_timestamp') else 'now')
        }, to=rid, skip_sid=request.sid)

        # Send current participants list to the new user
        current_participants = _get_room_participants(rid)
        emit("participants:list", {
            "participants": current_participants,
            "total": len(current_participants)
        })

        emit("connected", {"ok": True, "user": user_details})

    @socketio.on("disconnect")
    def on_disconnect():
        meta = sid_meta.pop(request.sid, None)
        if not meta:
            return
            
        rid = meta["room_id"]
        user_details = meta.get("user_details", {})
        
        sids = room_sockets.get(rid, set())
        sids.discard(request.sid)
        if not sids:
            room_sockets.pop(rid, None)
            
        leave_room(rid)
        
        # Emit user left to others in room
        emit("presence:leave", {
            "user": user_details,
            "socketId": request.sid,
            "timestamp": str(current_app.get_timestamp() if hasattr(current_app, 'get_timestamp') else 'now')
        }, to=rid, skip_sid=request.sid)

    # List peers (socket IDs) in your room
    @socketio.on("peers:list")
    def peers_list():
        meta = sid_meta.get(request.sid)
        if not meta:
            emit("peers:list", {"peers": []})
            return
        rid = meta["room_id"]
        peers = [sid for sid in room_sockets.get(rid, set()) if sid != request.sid]
        emit("peers:list", {"peers": peers})

    # Get current participants with details
    @socketio.on("participants:list")
    def participants_list():
        meta = sid_meta.get(request.sid)
        if not meta:
            emit("participants:list", {"participants": [], "total": 0})
            return
        rid = meta["room_id"]
        participants = _get_room_participants(rid)
        emit("participants:list", {
            "participants": participants,
            "total": len(participants)
        })

    # User status updates (e.g., mute/unmute)
    @socketio.on("user:status")
    def user_status(data):
        meta = sid_meta.get(request.sid)
        if not meta:
            return
        
        rid = meta["room_id"]
        user_details = meta.get("user_details", {})
        
        # Broadcast status change to room
        emit("user:status:change", {
            "user": user_details,
            "socketId": request.sid,
            "status": data.get("status", {}),
            "timestamp": str(current_app.get_timestamp() if hasattr(current_app, 'get_timestamp') else 'now')
        }, to=rid, skip_sid=request.sid)

    # Signaling relays
    @socketio.on("webrtc:offer")
    def on_offer(data):
        emit("webrtc:offer", data, room=data["to"])

    @socketio.on("webrtc:answer")
    def on_answer(data):
        emit("webrtc:answer", data, room=data["to"])

    @socketio.on("webrtc:ice")
    def on_ice(data):
        emit("webrtc:ice", data, room=data["to"])
