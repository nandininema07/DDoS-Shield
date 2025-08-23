import subprocess
import sys
import os

# --- Configuration ---
# This script is designed to run from the 'backend' directory.

# --- CHANGE HERE: Updated the main API command ---
# The main API now runs with 4 workers to prevent deadlocks.
# The '--reload' flag is removed as it's not compatible with '--workers'.
main_api_command = [
    sys.executable,
    "-m", "uvicorn",
    "backend_api:app",
    "--host", "127.0.0.1",
    "--port", "8000",
    "--workers", "4"  # Use multiple workers
]

# The secondary API for auth can remain in reload mode for development convenience.
auth_api_command = [
    sys.executable,
    "-m", "uvicorn",
    "auth_and_settings_api:app",
    "--host", "127.0.0.1",
    "--port", "8001",
    "--reload"
]

def run_servers():
    """
    Starts both the main and authentication API servers as parallel subprocesses.
    It monitors their output and waits for them to terminate.
    """
    print("🚀 Starting both backend servers...")
    print(f" -> Main API on http://127.0.0.1:8000 (running with 4 workers)")
    print(f" -> Auth & Settings API on http://127.0.0.1:8001 (running in reload mode)")
    print("-" * 30)

    # Start the main API process
    main_process = subprocess.Popen(main_api_command, stdout=sys.stdout, stderr=sys.stderr)
    
    # Start the auth API process
    auth_process = subprocess.Popen(auth_api_command, stdout=sys.stdout, stderr=sys.stderr)

    try:
        # Wait for both processes to complete.
        # This will keep the script running until you manually stop it (Ctrl+C).
        main_process.wait()
        auth_process.wait()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down servers...")
        main_process.terminate()
        auth_process.terminate()
        print("✅ Servers stopped.")

if __name__ == "__main__":
    # Check if the required files exist before trying to run them
    if not os.path.exists("backend_api.py") or not os.path.exists("auth_and_settings_api.py"):
        print("❌ Error: Make sure 'backend_api.py' and 'auth_and_settings_api.py' are in the same directory as this script.")
    else:
        run_servers()
