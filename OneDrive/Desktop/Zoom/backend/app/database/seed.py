import sys
import os

# Ensure the backend directory is in the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.database.database import SessionLocal, Base, engine
from app.models.user import User

def seed_db():
    print("Connecting to database and starting seed operation...")
    db = SessionLocal()
    try:
        default_email = "user@example.com"
        default_name = "Default User"
        
        # Check if the user already exists
        user = db.query(User).filter(User.email == default_email).first()
        if user:
            print(f"User with email '{default_email}' already exists. Skipping creation.")
            print(f"Found User ID: {user.id}")
            return user.id
        else:
            print(f"Creating default user: '{default_name}' ({default_email})...")
            new_user = User(name=default_name, email=default_email)
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            print(f"Successfully created default user with ID: {new_user.id}")
            return new_user.id
    except Exception as e:
        print(f"An error occurred during database seeding: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure all database tables exist
    print("Ensuring all database tables exist...")
    from app import models
    Base.metadata.create_all(bind=engine)
    
    # Execute seeding
    seed_db()
