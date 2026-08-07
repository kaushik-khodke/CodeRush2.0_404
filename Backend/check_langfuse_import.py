import traceback

print("Testing imports:")
try:
    import langchain
    print("1. import langchain SUCCESS:", langchain.__file__)
except Exception as e:
    print("1. import langchain FAILED:", e)

try:
    import langchain_core
    print("2. import langchain_core SUCCESS:", langchain_core.__file__)
except Exception as e:
    print("2. import langchain_core FAILED:", e)

try:
    from langfuse.callback import CallbackHandler
    print("3. from langfuse.callback import CallbackHandler SUCCESS:", CallbackHandler)
except Exception as e:
    print("3. from langfuse.callback import CallbackHandler FAILED:")
    traceback.print_exc()
