from config import settings
from agentic.tracing import get_langfuse_client, log_agent_trace, flush_langfuse
from langchain_groq import ChatGroq

sec = settings.LANGFUSE_SECRET_KEY.strip('"\'')
pub = settings.LANGFUSE_PUBLIC_KEY.strip('"\'')
host = settings.LANGFUSE_BASE_URL.strip('"\'')

print("="*80)
print("TESTING DIRECT LANGFUSE TRACE TRANSMISSION")
print(f"Public Key:  {pub[:12]}...")
print(f"Secret Key:  {sec[:12]}...")
print(f"Host URL:    {host}")
print("="*80)

client = get_langfuse_client()
if not client:
    print("ERROR: Failed to initialize Langfuse client.")
else:
    print("1. Successfully initialized Langfuse client!")

    print("\n2. Sending test trace to Langfuse Cloud...")
    log_agent_trace(
        trace_name="SMOA Mission Control Telemetry Audit",
        agent_name="Diagnosis Agent (llama-3.3-70b-versatile)",
        prompt="[TELEMETRY ANOMALY DETECTED] Battery_SOC: 14.5%, CPU_Temp: 58.2C",
        output="Root Cause: Battery cell failure due to deep discharge.",
        metadata={"subsystem": "Power", "status": "CRITICAL"}
    )

    print("\n3. Flushing trace buffer to us.cloud.langfuse.com...")
    flush_langfuse()
    print("\n" + "="*80)
    print("SUCCESS: Trace sent and flushed! Open us.cloud.langfuse.com to see your trace.")
    print("="*80)
