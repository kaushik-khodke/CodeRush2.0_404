import os
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL

# Check if PostgreSQL connection string has a password in user:password format
if db_url.startswith("postgresql://") or db_url.startswith("postgresql+asyncpg://"):
    user_pass = db_url.split("@")[0].replace("postgresql://", "").replace("postgresql+asyncpg://", "")
    if ":" not in user_pass:
        # Fallback to in-memory SQLite for local SQLAlchemy session dependency when raw Postgres password is not set
        db_url = "sqlite+aiosqlite:///:memory:"
    else:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}

engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    connect_args=connect_args
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        logger.info(f"[DB Init Note] Local SQLAlchemy schema init note: {e}. Primary data store remains Supabase Cloud API.")
