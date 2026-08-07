import os
import time
from config import settings
from langfuse.callback import CallbackHandler
from langchain_groq import ChatGroq

sec = settings.LANGFUSE_SECRET_KEY.strip('"\'')
pub = settings.LANGFUSE_PUBLIC_KEY.strip('"\'')
host = settings.LANGFUSE_BASE_URL.strip('"\'')

print("="*80)
print("TESTING DIRECT LANGFUSE TRACE TRANSMISSION")
print(f"Public Key:  {pub[:8]}...")
print(f"Secret Key:  {sec[:8]}...")
print(f"Host URL:    {host}")
print("="*80)

handler = CallbackHandler(
    public_key=pub,
    secret_key=sec,
    host=host
)

llm = ChatGroq(
    model_name="llama-3.3-70b-versatile",
    groq_api_key=settings.GROQ_API_KEY,
    temperature=0.1
)

print("\nInvoking Groq LLM with Langfuse CallbackHandler attached...")
response = llm.invoke("Hello Space Mission Control! Confirm connectivity.", config={"callbacks": [handler]})

print(f"\nGroq Response: {response.content}")

print("\nFlushing Langfuse event buffer to cloud server...")
handler.flush()
print("SUCCESS: Traces flushed to us.cloud.langfuse.com!")
