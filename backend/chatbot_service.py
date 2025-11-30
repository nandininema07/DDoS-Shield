import os
import requests
import json
import google.generativeai as genai

# --- Configuration & Initialization ---
# The main backend_api.py is now responsible for loading dotenv.
# This script can now directly access the environment variables.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
llm = None

if not GEMINI_API_KEY:
    print("❌ CHATBOT_SERVICE: GEMINI_API_KEY not found. Ensure backend_api.py loads it correctly.")
else:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # --- CHANGE HERE: Updated to a current and valid model name ---
        llm = genai.GenerativeModel('gemini-2.5-flash')
        print("✅ CHATBOT_SERVICE: Gemini client configured successfully.")
    except Exception as e:
        print(f"❌ CHATBOT_SERVICE: Error configuring Gemini client: {e}")

# The base URL of our own running FastAPI backend
BACKEND_API_BASE_URL = "http://127.0.0.1:8000"

# --- Tool Functions ---
def get_attack_logs_from_api():
    """Fetches the most recent attack logs."""
    try:
        # --- CHANGE HERE: Added a timeout to prevent indefinite hanging ---
        response = requests.get(f"{BACKEND_API_BASE_URL}/api/attack-logs", timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        return {"error": "The request to the attack logs API timed out."}
    except Exception as e:
        return {"error": f"Could not connect to API or API returned an error: {e}"}

def get_blacklist_from_api():
    """Fetches the current list of blacklisted IPs."""
    try:
        # --- CHANGE HERE: Added a timeout to prevent indefinite hanging ---
        response = requests.get(f"{BACKEND_API_BASE_URL}/api/blacklist", timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        return {"error": "The request to the blacklist API timed out."}
    except Exception as e:
        return {"error": f"Could not connect to API or API returned an error: {e}"}

# --- Main Chatbot Logic ---
def get_chatbot_response(user_query: str) -> str:
    """
    Processes a user's query by using an LLM to select a tool,
    fetches data, and generates a final summary.
    """
    if not llm:
        return "Chatbot is not configured. Please check the terminal logs for errors."

    tool_selection_prompt = f"""
    You are a helpful security assistant. Based on the user's question, decide which of the following tools is most appropriate to use.
    Respond with only the name of the function to call, and nothing else.

    Available tools:
    - `get_attack_logs_from_api`: Use this to answer questions about recent attacks, attack history, or specific attack events.
    - `get_blacklist_from_api`: Use this to answer questions about which IPs are blocked, the blacklist count, or why an IP was blocked.

    User Question: "{user_query}"
    Function to call:
    """
    try:
        tool_response = llm.generate_content(tool_selection_prompt)
        tool_name = tool_response.text.strip()
    except Exception as e:
        return f"Error communicating with LLM for tool selection: {e}"

    api_data = None
    if "get_attack_logs_from_api" in tool_name:
        api_data = get_attack_logs_from_api()
    elif "get_blacklist_from_api" in tool_name:
        api_data = get_blacklist_from_api()
    else:
        return "I'm not sure how to answer that. Please ask about recent attacks or the IP blacklist."

    if isinstance(api_data, dict) and "error" in api_data:
        return f"There was an error retrieving the data: {api_data['error']}"

    summary_prompt = f"""
    You are a helpful security assistant. You have been asked the following question: "{user_query}"
    You have retrieved the following data from the system's API:
    {json.dumps(api_data, indent=2, default=str)}

    Based on this data, please provide a clear and concise answer to the user's question.
    """
    try:
        summary_response = llm.generate_content(summary_prompt)
        return summary_response.text
    except Exception as e:
        return f"Error communicating with LLM for summarization: {e}"
