from supabase import create_client, Client
from config import settings

_supabase_client: Client | None = None

def get_supabase_client() -> Client | None:
    global _supabase_client
    if _supabase_client is None:
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        if url and "placeholder" not in url:
            try:
                _supabase_client = create_client(url, key)
            except Exception as e:
                print(f"[Supabase Client Warning] Could not initialize Supabase Client: {e}")
                return None
    return _supabase_client
