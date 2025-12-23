import eventlet
eventlet.monkey_patch()
import os
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

from flask import Flask
from flask_caching import Cache
import uuid
import json
import redis
import ssl
from flask_cors import CORS
from flask_restful import Api
# from socketio_server import init_socketio, socketio

from config import Config

import sqlalchemy.pool


def create_app():
    app = Flask(__name__)
    
    app.config.from_object(Config)
    CORS(app)  # Enable CORS for all routes

    # ---- Caching (Flask-Caching) ----
    cache = Cache(app)              # Uses Config (CACHE_TYPE, etc.)
    app.cache = cache
    
    # ---- (Optional) direct Redis connection if you need it besides caching ----
    redis_url = app.config.get("CACHE_REDIS_URL")
    if redis_url:
        redis_connection_kwargs = {"decode_responses": True}
        if redis_url.startswith("rediss://"):
            redis_connection_kwargs["ssl"] = True
            redis_connection_kwargs["ssl_cert_reqs"] = ssl.CERT_NONE
        app.redis = redis.Redis.from_url(redis_url, **redis_connection_kwargs)
    
    
    class CustomJSONEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, uuid.UUID):
                return str(obj)
            return super().default(obj)
        
    app.json_encoder = CustomJSONEncoder

    # ---- API resources ----
    api = Api(app)
    
    # Health check endpoint for Redis
    class HealthCheck(Resource):
        def get(self):
            try:
                app.redis.ping()
                return {"status": "healthy", "redis": "connected"}, 200
            except redis.ConnectionError:
                return {"status": "healthy", "redis": "disconnected"}, 200

    # Register all API resources (routes)
    api.add_resource(HealthCheck, '/health')


    return app


# For gunicorn / production import
app = create_app()
# init_socketio(app)

if __name__ == '__main__':
    app.run(debug=True)
