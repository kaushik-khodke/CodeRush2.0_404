import requests
from config import settings

sec = settings.LANGFUSE_SECRET_KEY.strip('"\'')
pub = settings.LANGFUSE_PUBLIC_KEY.strip('"\'')
host = settings.LANGFUSE_BASE_URL.strip('"\'')

print("="*80)
print("LANGFUSE API KEY & REGION DIAGNOSTIC")
print(f"Public Key: {pub}")
print(f"Secret Key: {sec[:10]}...")
print(f"Configured Host: {host}")
print("="*80)

hosts_to_test = [
    "https://us.cloud.langfuse.com",
    "https://cloud.langfuse.com"
]

for h in hosts_to_test:
    url = f"{h}/api/public/health"
    try:
        r = requests.get(url, timeout=5)
        print(f"\nTesting {h}/api/public/health -> Status: {r.status_code}, Body: {r.text}")
    except Exception as e:
        print(f"\nTesting {h} -> Exception: {e}")

    # Test authentication endpoint
    auth_url = f"{h}/api/public/ingestion"
    try:
        r = requests.post(
            auth_url,
            auth=(pub, sec),
            json={"batch": []},
            timeout=5
        )
        print(f"Testing {h} Auth (/api/public/ingestion) -> Status: {r.status_code}, Body: {r.text[:200]}")
    except Exception as e:
        print(f"Testing {h} Auth -> Exception: {e}")
