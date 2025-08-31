from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid


class Person(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    amount: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class PersonCreate(BaseModel):
    name: str
    amount: float = 0.0


class PersonUpdate(BaseModel):
    amount: float


class PersonBulkUpdate(BaseModel):
    id: str
    amount: float


class PersonBulkUpdateRequest(BaseModel):
    persons: List[PersonBulkUpdate]