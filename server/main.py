from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
import time
from datetime import datetime
from typing import List, Optional, Dict, Any
import hashlib
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from bson.errors import InvalidId

app = FastAPI()

# Add middleware for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection (without authentication)
MONGO_URL = "mongodb://localhost:27017"
DATABASE_NAME = "chatbot_db"
client = AsyncIOMotorClient(MONGO_URL)
db = client[DATABASE_NAME]

# Model API configuration
MODEL_API_URL = "http://localhost:8081"

# Pydantic models
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class CreateConversationRequest(BaseModel):
    user_id: str
    title: Optional[str] = None

class UpdateConversationRequest(BaseModel):
    title: str

class SendMessageRequest(BaseModel):
    conversation_id: str
    user_id: str
    message: str

class MessageResponse(BaseModel):
    id: str
    sender: str  # "user" or "bot"
    content: str
    timestamp: datetime

class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int

class ConversationDetailResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse]

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    created_at: datetime

# Helper functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed_password: str) -> bool:
    return hashlib.sha256(password.encode()).hexdigest() == hashed_password

async def generate_answer(question: str) -> str:
    """Generate an answer using the model API service"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{MODEL_API_URL}/ask", 
                                       json={"question": question})
            response.raise_for_status()
            data = response.json()
            return data.get("answer", "Sorry, I couldn't generate a response.")
    except httpx.RequestError as e:
        print(f"Error connecting to model API: {e}")
        return "Sorry, the AI model service is currently unavailable. Please try again later."
    except httpx.HTTPStatusError as e:
        print(f"Model API returned error {e.response.status_code}: {e.response.text}")
        return "Sorry, there was an error processing your request. Please try again."
    except Exception as e:
        print(f"Unexpected error calling model API: {e}")
        return "Sorry, an unexpected error occurred. Please try again."

def generate_conversation_title(first_message: str) -> str:
    """Generate a conversation title based on the first message"""
    words = first_message.split()[:5]  # Take first 5 words
    title = " ".join(words)
    if len(first_message.split()) > 5:
        title += "..."
    return title

# User Authentication Routes
@app.post("/register")
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username already exists
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Hash password and create user
    hashed_password = hash_password(user_data.password)
    user_doc = {
        "username": user_data.username,
        "email": user_data.email,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    return {
        "message": "User registered successfully", 
        "user_id": str(result.inserted_id)
    }

@app.post("/login")
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    return {
        "message": "Login successful",
        "user_id": str(user["_id"]),
        "username": user["username"]
    }

# Conversation Management Routes
@app.post("/conversations", response_model=ConversationResponse)
async def create_conversation(request: CreateConversationRequest):
    try:
        # Verify user exists
        user = await db.users.find_one({"_id": ObjectId(request.user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        now = datetime.utcnow()
        conversation_doc = {
            "user_id": ObjectId(request.user_id),
            "title": request.title or "New Conversation",
            "created_at": now,
            "updated_at": now
        }
        
        result = await db.conversations.insert_one(conversation_doc)
        
        return {
            "id": str(result.inserted_id),
            "title": conversation_doc["title"],
            "created_at": conversation_doc["created_at"],
            "updated_at": conversation_doc["updated_at"],
            "message_count": 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations/{user_id}", response_model=List[ConversationResponse])
async def get_user_conversations(user_id: str):
    try:
        # Verify user exists
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get conversations with message count
        pipeline = [
            {"$match": {"user_id": ObjectId(user_id)}},
            {
                "$lookup": {
                    "from": "messages",
                    "localField": "_id",
                    "foreignField": "conversation_id",
                    "as": "messages"
                }
            },
            {
                "$addFields": {
                    "message_count": {"$size": "$messages"}
                }
            },
            {"$sort": {"updated_at": -1}},
            {
                "$project": {
                    "title": 1,
                    "created_at": 1,
                    "updated_at": 1,
                    "message_count": 1
                }
            }
        ]
        
        conversations = await db.conversations.aggregate(pipeline).to_list(100)
        
        return [
            {
                "id": str(conv["_id"]),
                "title": conv["title"],
                "created_at": conv["created_at"],
                "updated_at": conv["updated_at"],
                "message_count": conv["message_count"]
            }
            for conv in conversations
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations/{conversation_id}/details/{user_id}", response_model=ConversationDetailResponse)
async def get_conversation_details(conversation_id: str, user_id: str):
    try:
        # Verify conversation belongs to user
        conversation = await db.conversations.find_one({
            "_id": ObjectId(conversation_id),
            "user_id": ObjectId(user_id)
        })
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Get messages for this conversation
        messages = await db.messages.find(
            {"conversation_id": ObjectId(conversation_id)}
        ).sort("timestamp", 1).to_list(1000)
        
        message_responses = [
            {
                "id": str(msg["_id"]),
                "sender": msg["sender"],
                "content": msg["content"],
                "timestamp": msg["timestamp"]
            }
            for msg in messages
        ]
        
        return {
            "id": str(conversation["_id"]),
            "title": conversation["title"],
            "created_at": conversation["created_at"],
            "updated_at": conversation["updated_at"],
            "messages": message_responses
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/conversations/{conversation_id}/{user_id}", response_model=Dict[str, Any])
async def update_conversation(conversation_id: str, user_id: str, request: UpdateConversationRequest):
    try:
        user_object_id = ObjectId(user_id)
        conversation_object_id = ObjectId(conversation_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user_id or conversation_id format")

    current_time = datetime.utcnow()

    result = await db.conversations.update_one(
        {"_id": conversation_object_id, "user_id": user_object_id},
        {"$set": {"title": request.title, "updated_at": current_time}}
    )

    if result.matched_count == 0:
        # Check if conversation exists at all, or if it's a user mismatch
        existing_conversation = await db.conversations.find_one({"_id": conversation_object_id})
        if not existing_conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            # Conversation exists but user_id doesn't match or other issue
            raise HTTPException(status_code=403, detail="User not authorized to update this conversation or conversation not found for user")
    
    # Fetch the updated document to return it
    updated_doc = await db.conversations.find_one({
        "_id": conversation_object_id,
        "user_id": user_object_id 
    })

    if not updated_doc:
        # This case should ideally not be reached if matched_count > 0 and update was successful
        raise HTTPException(status_code=404, detail="Updated conversation data could not be retrieved")

    return {
        "id": str(updated_doc["_id"]),
        "title": updated_doc["title"],
        "created_at": updated_doc["created_at"],
        "updated_at": updated_doc["updated_at"]
        # message_count is not returned as it's not stored directly on the conversation document
        # and the frontend client code preserves it from the existing conversation object.
    }

@app.delete("/conversations/{conversation_id}/{user_id}")
async def delete_conversation(conversation_id: str, user_id: str):
    try:
        # First delete all messages in the conversation
        await db.messages.delete_many({"conversation_id": ObjectId(conversation_id)})
        
        # Then delete the conversation
        result = await db.conversations.delete_one({
            "_id": ObjectId(conversation_id),
            "user_id": ObjectId(user_id)
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {"message": "Conversation and all messages deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/users/{user_id}/conversations/clear")
async def clear_all_conversations(user_id: str):
    """Clear all conversations and messages for a specific user"""
    try:
        # Verify user exists
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get all conversation IDs for the user
        conversations = await db.conversations.find(
            {"user_id": ObjectId(user_id)}, 
            {"_id": 1}
        ).to_list(None)
        
        conversation_ids = [conv["_id"] for conv in conversations]
        
        # Delete all messages for all conversations of this user
        messages_delete_result = await db.messages.delete_many({
            "conversation_id": {"$in": conversation_ids}
        })
        
        # Delete all conversations for this user
        conversations_delete_result = await db.conversations.delete_many({
            "user_id": ObjectId(user_id)
        })
        
        return {
            "message": "All conversations cleared successfully",
            "conversations_deleted": conversations_delete_result.deleted_count,
            "messages_deleted": messages_delete_result.deleted_count
        }
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Message Routes
@app.post("/messages", response_model=MessageResponse)
async def send_message(request: SendMessageRequest):
    try:
        # Verify conversation belongs to user
        conversation = await db.conversations.find_one({
            "_id": ObjectId(request.conversation_id),
            "user_id": ObjectId(request.user_id)
        })
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        now = datetime.utcnow()
        
        # Save user message
        user_message_doc = {
            "conversation_id": ObjectId(request.conversation_id),
            "sender": "user",
            "content": request.message,
            "timestamp": now
        }
        user_message_result = await db.messages.insert_one(user_message_doc)
          # Generate bot response
        bot_response = await generate_answer(request.message)
        
        # Save bot message
        bot_message_doc = {
            "conversation_id": ObjectId(request.conversation_id),
            "sender": "bot",
            "content": bot_response,
            "timestamp": datetime.utcnow()
        }
        bot_message_result = await db.messages.insert_one(bot_message_doc)
        
        # Update conversation's updated_at timestamp and title if it's the first message
        update_data = {"updated_at": datetime.utcnow()}
        if conversation["title"] == "New Conversation":
            update_data["title"] = generate_conversation_title(request.message)
        
        await db.conversations.update_one(
            {"_id": ObjectId(request.conversation_id)},
            {"$set": update_data}
        )
        
        # Return the bot's response
        return {
            "id": str(bot_message_result.inserted_id),
            "sender": "bot",
            "content": bot_response,
            "timestamp": bot_message_doc["timestamp"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/messages/{message_id}/{user_id}")
async def delete_message(message_id: str, user_id: str):
    try:
        # Find the message and verify it belongs to a conversation owned by the user
        message = await db.messages.find_one({"_id": ObjectId(message_id)})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Verify the conversation belongs to the user
        conversation = await db.conversations.find_one({
            "_id": message["conversation_id"],
            "user_id": ObjectId(user_id)
        })
        if not conversation:
            raise HTTPException(status_code=403, detail="Not authorized to delete this message")
        
        # Delete the message
        await db.messages.delete_one({"_id": ObjectId(message_id)})
        
        return {"message": "Message deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# User Routes
@app.get("/user/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "created_at": user["created_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_question(request: dict):
    try:
        # Check if required parameters are present
        if "question" not in request or "user_id" not in request:
            raise HTTPException(status_code=400, detail="Missing required parameters")
        
        question = request["question"]
        user_id = request["user_id"]
        
        # Verify user exists
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create a new conversation or use existing if provided
        conversation_id = request.get("conversation_id")
        if not conversation_id:
            # Create a new conversation
            now = datetime.utcnow()
            conversation_doc = {
                "user_id": ObjectId(user_id),
                "title": generate_conversation_title(question),
                "created_at": now,
                "updated_at": now
            }
            conversation_result = await db.conversations.insert_one(conversation_doc)
            conversation_id = str(conversation_result.inserted_id)
        else:
            # Verify conversation belongs to user
            conversation = await db.conversations.find_one({
                "_id": ObjectId(conversation_id),
                "user_id": ObjectId(user_id)
            })
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
        
        now = datetime.utcnow()
        
        # Save user message
        user_message_doc = {
            "conversation_id": ObjectId(conversation_id),
            "sender": "user",
            "content": question,
            "timestamp": now
        }
        await db.messages.insert_one(user_message_doc)
          # Generate bot response
        bot_response = await generate_answer(question)
        
        # Save bot message
        bot_message_doc = {
            "conversation_id": ObjectId(conversation_id),
            "sender": "bot",
            "content": bot_response,
            "timestamp": datetime.utcnow()
        }
        bot_message_result = await db.messages.insert_one(bot_message_doc)
        
        # Update conversation's updated_at timestamp
        await db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"updated_at": datetime.utcnow()}}
        )
        
        # Return the response with conversation_id
        return {
            "answer": bot_response,
            "conversation_id": conversation_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    health_status = {"status": "healthy", "model_api": "unknown"}
    
    # Check model API health
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{MODEL_API_URL}/docs")  # FastAPI auto-generates /docs
            if response.status_code == 200:
                health_status["model_api"] = "healthy"
            else:
                health_status["model_api"] = "unhealthy"
    except Exception:
        health_status["model_api"] = "unavailable"
    
    return health_status

# Database initialization
@app.on_event("startup")
async def startup_db_client():
    try:
        # Test the connection
        await client.admin.command('ping')
        print("MongoDB connection successful!")
        
        # Create indexes for better performance
        try:
            await db.users.create_index("email", unique=True)
            await db.users.create_index("username", unique=True)
            await db.conversations.create_index([("user_id", 1), ("updated_at", -1)])
            await db.messages.create_index([("conversation_id", 1), ("timestamp", 1)])
            print("Database indexes created successfully!")
        except Exception as e:
            print(f"Index creation warning: {e}")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        print("Please ensure MongoDB is running and accessible")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)