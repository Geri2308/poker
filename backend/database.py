from motor.motor_asyncio import AsyncIOMotorClient
import os
from typing import List
from models import Person, PersonCreate, PersonUpdate
from datetime import datetime


class PersonDatabase:
    def __init__(self, db):
        self.collection = db.persons
    
    async def initialize_default_persons(self):
        """Initialize default persons if collection is empty"""
        # Always reset to exactly 10 players - remove any extras
        await self.collection.delete_many({})  # Clear all existing
        
        default_persons = [
            {"id": "1", "name": "Geri", "amount": 0.0},
            {"id": "2", "name": "Sepp", "amount": 0.0},
            {"id": "3", "name": "Toni", "amount": 0.0},
            {"id": "4", "name": "Geri Ranner", "amount": 0.0},
            {"id": "5", "name": "Manuel", "amount": 0.0},
            {"id": "6", "name": "Rene", "amount": 0.0},
            {"id": "7", "name": "Gabi", "amount": 0.0},
            {"id": "8", "name": "Roland", "amount": 0.0},
            {"id": "9", "name": "Stefan", "amount": 0.0},
            {"id": "10", "name": "Richi", "amount": 0.0}
        ]
        
        for person_data in default_persons:
            person = Person(**person_data)
            await self.collection.insert_one(person.dict())
    
    async def get_all_persons(self) -> List[Person]:
        """Get all persons sorted by amount (highest first)"""
        cursor = self.collection.find({}).sort("amount", -1)
        persons = await cursor.to_list(1000)
        return [Person(**person) for person in persons]
    
    async def get_person_by_id(self, person_id: str) -> Person:
        """Get person by ID"""
        person_data = await self.collection.find_one({"id": person_id})
        if person_data:
            return Person(**person_data)
        return None
    
    async def create_person(self, person_create: PersonCreate) -> Person:
        """Create new person"""
        person = Person(**person_create.dict())
        await self.collection.insert_one(person.dict())
        return person
    
    async def update_person(self, person_id: str, person_update: PersonUpdate) -> Person:
        """Update person's amount"""
        update_data = person_update.dict()
        update_data["updated_at"] = datetime.utcnow()
        
        result = await self.collection.update_one(
            {"id": person_id},
            {"$set": update_data}
        )
        
        if result.modified_count:
            return await self.get_person_by_id(person_id)
        return None
    
    async def bulk_update_persons(self, updates: List[dict]) -> List[Person]:
        """Bulk update multiple persons"""
        for update in updates:
            await self.collection.update_one(
                {"id": update["id"]},
                {"$set": {"amount": update["amount"], "updated_at": datetime.utcnow()}}
            )
        
        return await self.get_all_persons()
    
    async def reset_all_amounts(self) -> List[Person]:
        """Reset all persons' amounts to 0"""
        await self.collection.update_many(
            {},
            {"$set": {"amount": 0.0, "updated_at": datetime.utcnow()}}
        )
        
        return await self.get_all_persons()