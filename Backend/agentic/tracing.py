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
_global_client = None

def get_langfuse_client() -> Optional[Any]:
    """
    Returns native Langfuse client instance.
    """
    global _global_client
    if _global_client is not None:
        return _global_client

    sec = settings.LANGFUSE_SECRET_KEY.strip('"\'') if settings.LANGFUSE_SECRET_KEY else ""
    pub = settings.LANGFUSE_PUBLIC_KEY.strip('"\'') if settings.LANGFUSE_PUBLIC_KEY else ""
    host = settings.LANGFUSE_BASE_URL.strip('"\'') if settings.LANGFUSE_BASE_URL else "https://us.cloud.langfuse.com"

    if sec and pub:
        try:
            from langfuse import Langfuse
            _global_client = Langfuse(
                public_key=pub,
                secret_key=sec,
                host=host
            )
            return _global_client
        except Exception as e:
            print(f"[Langfuse Client Warning] Could not initialize direct Langfuse client: {e}")
            return None
    return None

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
            # Try CallbackHandler import variations
            CallbackHandler = None
            try:
                from langfuse.callback import CallbackHandler as CH
                CallbackHandler = CH
            except Exception:
                pass

            if CallbackHandler is None:
                try:
                    from langfuse.langchain import CallbackHandler as CH
                    CallbackHandler = CH
                except Exception:
                    pass

            if CallbackHandler is not None:
                _global_handler = CallbackHandler(
                    public_key=pub,
                    secret_key=sec,
                    host=host
                )
                return _global_handler
        except Exception as e:
            print(f"[Langfuse Tracing Warning] CallbackHandler init notice: {e}")

    return None

def log_agent_trace(trace_name: str, agent_name: str, prompt: str, output: Any, metadata: Optional[dict] = None, model_name: Optional[str] = None):
    """
    Direct Langfuse trace logger guaranteeing trace transmission to us.cloud.langfuse.com.
    """
    client = get_langfuse_client()
    if client:
        try:
            trace = client.trace(
                name=trace_name,
                metadata=metadata or {}
            )
            trace.generation(
                name=agent_name,
                model=model_name or "llama-3.3-70b-versatile",
                input=prompt,
                output=str(output)
            )
            client.flush()
        except Exception as e:
            print(f"[Langfuse Direct Trace Log Warning]: {e}")


def flush_langfuse():
    """
    Flushes all buffered traces to the Langfuse cloud server before process exit.
    """
    global _global_handler, _global_client
    if _global_handler is not None and hasattr(_global_handler, "flush"):
        try:
            _global_handler.flush()
        except Exception:
            pass

    if _global_client is not None and hasattr(_global_client, "flush"):
        try:
            _global_client.flush()
        except Exception:
            pass
