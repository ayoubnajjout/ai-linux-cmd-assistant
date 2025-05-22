from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel, PeftConfig
import torch
import time
from datetime import datetime
from typing import List
import hashlib
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

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

# Load model and tokenizer
model_name = "gpt2-medium"
peft_model_id = "content/linux_commands_model_final"  # Path to your saved model

# Check for GPU availability
device = "cuda" if torch.cuda.is_available() else "cpu"

# Load base model
model = AutoModelForCausalLM.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Configure tokenizer
tokenizer.pad_token = tokenizer.eos_token
model.config.pad_token_id = model.config.eos_token_id

# Load PEFT model
model = PeftModel.from_pretrained(model, peft_model_id)
model = model.to(device)
model.eval()

# Pydantic models
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class QuestionRequest(BaseModel):
    question: str
    user_id: str

class AnswerResponse(BaseModel):
    answer: str
    conversation_id: str

class ConversationResponse(BaseModel):
    id: str
    question: str
    answer: str
    timestamp: datetime

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

def generate_answer(question: str) -> str:
    prompt = f"Linux Command Question: {question.strip()}\n\nAnswer:"
    inputs = tokenizer(prompt, return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = model.generate(
            inputs.input_ids,
            max_length=300,
            temperature=0.7,
            top_p=0.9,
            num_return_sequences=1,
            pad_token_id=tokenizer.eos_token_id,
            do_sample=True,
        )

    full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    answer = full_response.split("Answer:")[1].strip()
    answer = answer.split("<|endoftext|>")[0].strip()
    return answer

# API Routes
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

@app.post("/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest):
    try:
        # Verify user exists
        user = await db.users.find_one({"_id": ObjectId(request.user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        answer = generate_answer(request.question)
        
        # Save conversation to database
        conversation_doc = {
            "user_id": ObjectId(request.user_id),
            "question": request.question,
            "answer": answer,
            "timestamp": datetime.utcnow()
        }
        
        result = await db.conversations.insert_one(conversation_doc)
        
        return {
            "answer": answer,
            "conversation_id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations/{user_id}", response_model=List[ConversationResponse])
async def get_conversations(user_id: str):
    try:
        # Verify user exists
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        conversations = await db.conversations.find(
            {"user_id": ObjectId(user_id)}
        ).sort("timestamp", -1).to_list(100)  # Get last 100 conversations
        
        return [
            {
                "id": str(conv["_id"]),
                "question": conv["question"],
                "answer": conv["answer"],
                "timestamp": conv["timestamp"]
            }
            for conv in conversations
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@app.delete("/conversations/{conversation_id}/{user_id}")
async def delete_conversation(conversation_id: str, user_id: str):
    try:
        result = await db.conversations.delete_one({
            "_id": ObjectId(conversation_id),
            "user_id": ObjectId(user_id)
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {"message": "Conversation deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

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
            await db.conversations.create_index([("user_id", 1), ("timestamp", -1)])
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