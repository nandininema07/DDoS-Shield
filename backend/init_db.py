import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend_api import Base, DATABASE_URL

# This script is for one-time setup of the database.
# It connects to the database and creates all necessary tables.

def initialize_database():
    """
    Connects to the database and creates all tables defined in the Base metadata.
    """
    print("Attempting to connect to the database...")
    
    # Allow some time for the PostgreSQL container to start up
    time.sleep(5) 
    
    try:
        engine = create_engine(DATABASE_URL)
        
        print("Creating all tables in the database...")
        # This command creates the tables based on your models (FlowLogDB, AttackLogDB, etc.)
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database tables created successfully.")
        
    except Exception as e:
        print(f"❌ An error occurred during database initialization: {e}")
        print("Please ensure your PostgreSQL Docker container is running and accessible.")

if __name__ == "__main__":
    initialize_database()
