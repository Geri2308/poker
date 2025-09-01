from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List
from dotenv import load_dotenv

from models import Person, PersonCreate, PersonUpdate, PersonBulkUpdateRequest
from database import PersonDatabase
from poker_api import poker_router

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize database
person_db = PersonDatabase(db)

# Create the main app
app = FastAPI(title="Poker Ranking API", version="1.0.0")

# Create API router
api_router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    """Initialize default persons on startup"""
    await person_db.initialize_default_persons()
    logger.info("Database initialized with default persons")


@api_router.get("/", tags=["Health"])
async def root():
    return {"message": "Poker Ranking API is running"}


@api_router.get("/persons", response_model=List[Person], tags=["Persons"])
async def get_all_persons():
    """Get all persons sorted by amount (highest first)"""
    try:
        persons = await person_db.get_all_persons()
        return persons
    except Exception as e:
        logger.error(f"Error getting persons: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving persons")


@api_router.get("/persons/{person_id}", response_model=Person, tags=["Persons"])
async def get_person(person_id: str):
    """Get person by ID"""
    try:
        person = await person_db.get_person_by_id(person_id)
        if not person:
            raise HTTPException(status_code=404, detail="Person not found")
        return person
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting person {person_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving person")


@api_router.post("/persons", response_model=Person, tags=["Persons"])
async def create_person(person_create: PersonCreate):
    """Create new person"""
    try:
        person = await person_db.create_person(person_create)
        return person
    except Exception as e:
        logger.error(f"Error creating person: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating person")


@api_router.put("/persons/bulk", response_model=List[Person], tags=["Persons"])
async def bulk_update_persons(request: PersonBulkUpdateRequest):
    """Bulk update multiple persons"""
    try:
        updates = [{"id": p.id, "amount": p.amount} for p in request.persons]
        persons = await person_db.bulk_update_persons(updates)
        return persons
    except Exception as e:
        logger.error(f"Error bulk updating persons: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating persons")


@api_router.put("/persons/{person_id}", response_model=Person, tags=["Persons"])
async def update_person(person_id: str, person_update: PersonUpdate):
    """Update person's amount"""
    try:
        person = await person_db.update_person(person_id, person_update)
        if not person:
            raise HTTPException(status_code=404, detail="Person not found")
        return person
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating person {person_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating person")


@api_router.post("/persons/reset", response_model=List[Person], tags=["Persons"])
async def reset_all_amounts():
    """Reset all persons' amounts to 0"""
    try:
        persons = await person_db.reset_all_amounts()
        return persons
    except Exception as e:
        logger.error(f"Error resetting amounts: {str(e)}")
        raise HTTPException(status_code=500, detail="Error resetting amounts")


# Include the router in the main app
app.include_router(api_router)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)