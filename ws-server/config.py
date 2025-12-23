import os
from datetime import timedelta

class Config:
    # cache
    CACHE_TYPE = "RedisCache"
    CACHE_REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CACHE_DEFAULT_TIMEOUT = 300
    PROFILE_CACHE_TTL = 300

# hello worl