import os
from typing import Optional, Any
from config import settings

def init_langfuse_env():
    sec = settings.LANGFUSE_SECRET_KEY.strip('"\'') if settings.LANGFUSE_SECRET_KEY else ""
    pub = settings.LANGFUSE_PUBLIC_KEY.strip('"\'') if settings.LANGFUSE_PUBLIC_KEY else ""
    host = settings.LANGFUSE_BASE_URL.strip('"\'') if settings.LANGFUSE_BASE_URL else "https://us.cloud.langfuse.com"

    if sec:
        os.environ["LANGFUSE_SECRET_KEY"] = sec
    if pub:
        os.environ["LANGFUSE_PUBLIC_KEY"] = pub
    if host:
        os.environ["LANGFUSE_HOST"] = host
        os.environ["LANGFUSE_BASE_URL"] = host

init_langfuse_env()

_global_handler = None

def get_langfuse_callback() -> Optional[Any]:
    """
    Returns a Langfuse CallbackHandler for LangChain/LangGraph if credentials are configured.
    """
    global _global_handler
    if _global_handler is not None:
        return _global_handler

    sec = settings.LANGFUSE_SECRET_KEY.strip('"\'') if settings.LANGFUSE_SECRET_KEY else ""
    pub = settings.LANGFUSE_PUBLIC_KEY.strip('"\'') if settings.LANGFUSE_PUBLIC_KEY else ""
    host = settings.LANGFUSE_BASE_URL.strip('"\'') if settings.LANGFUSE_BASE_URL else "https://us.cloud.langfuse.com"

    if sec and pub:
        try:
            from langfuse.callback import CallbackHandler
            _global_handler = CallbackHandler(
                public_key=pub,
                secret_key=sec,
                host=host
            )
            return _global_handler
        except Exception as e:
            print(f"[Langfuse Tracing Warning] Could not initialize CallbackHandler: {e}")
            return None
    return None

def flush_langfuse():
    """
    Flushes all buffered traces to the Langfuse cloud server before process exit.
    """
    global _global_handler
    if _global_handler is not None:
        try:
            _global_handler.flush()
        except Exception as e:
            print(f"[Langfuse Flush Notice]: {e}")

