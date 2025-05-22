import asyncio
import hashlib
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from faker import Faker
import random

# MongoDB connection
MONGO_URL = "mongodb://localhost:27017"
DATABASE_NAME = "chatbot_db"

# Initialize Faker
fake = Faker()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# Sample Linux commands and responses for realistic conversations
SAMPLE_CONVERSATIONS = [
    {
        "title": "File Operations",
        "messages": [
            {"sender": "user", "content": "How do I list all files in a directory?"},
            {"sender": "bot", "content": "Use the 'ls' command to list files. For detailed information, use 'ls -la' which shows permissions, ownership, size, and modification dates."},
            {"sender": "user", "content": "How can I copy files recursively?"},
            {"sender": "bot", "content": "Use 'cp -r source_directory destination_directory' to copy directories and their contents recursively."}
        ]
    },
    {
        "title": "Process Management",
        "messages": [
            {"sender": "user", "content": "How do I see running processes?"},
            {"sender": "bot", "content": "Use 'ps aux' to see all running processes, or 'top' for a real-time view of processes sorted by CPU usage."},
            {"sender": "user", "content": "How to kill a process?"},
            {"sender": "bot", "content": "Use 'kill PID' where PID is the process ID, or 'killall process_name' to kill all processes with that name. Use 'kill -9 PID' for force kill."}
        ]
    },
    {
        "title": "Text Processing",
        "messages": [
            {"sender": "user", "content": "How do I search for text in files?"},
            {"sender": "bot", "content": "Use 'grep pattern filename' to search for a pattern in a file. Use 'grep -r pattern directory' to search recursively in directories."},
            {"sender": "user", "content": "How to count lines in a file?"},
            {"sender": "bot", "content": "Use 'wc -l filename' to count lines. 'wc -w' counts words and 'wc -c' counts characters."}
        ]
    },
    {
        "title": "Network Troubleshooting",
        "messages": [
            {"sender": "user", "content": "How do I check network connectivity?"},
            {"sender": "bot", "content": "Use 'ping hostname' to check basic connectivity. 'traceroute hostname' shows the path packets take to reach the destination."},
            {"sender": "user", "content": "How to see open network connections?"},
            {"sender": "bot", "content": "Use 'netstat -tuln' to show listening ports, or 'ss -tuln' on newer systems. Add '-p' to show process names."}
        ]
    },
    {
        "title": "File Permissions",
        "messages": [
            {"sender": "user", "content": "How do I change file permissions?"},
            {"sender": "bot", "content": "Use 'chmod' command. For example: 'chmod 755 filename' or 'chmod u+x filename' to add execute permission for the owner."},
            {"sender": "user", "content": "What do the permission numbers mean?"},
            {"sender": "bot", "content": "Permissions are represented by 3 digits: owner, group, others. 4=read, 2=write, 1=execute. So 755 means owner has all permissions (7), group and others have read+execute (5)."}
        ]
    },
    {
        "title": "System Information",
        "messages": [
            {"sender": "user", "content": "How do I check system resource usage?"},
            {"sender": "bot", "content": "Use 'top' or 'htop' for real-time resource monitoring. 'df -h' shows disk usage, 'free -h' shows memory usage."},
            {"sender": "user", "content": "How to see system uptime?"},
            {"sender": "bot", "content": "Use 'uptime' command to see how long the system has been running and current load averages."}
        ]
    },
    {
        "title": "Archive and Compression",
        "messages": [
            {"sender": "user", "content": "How do I create a tar archive?"},
            {"sender": "bot", "content": "Use 'tar -czf archive.tar.gz directory/' to create a compressed archive. Use 'tar -xzf archive.tar.gz' to extract it."},
            {"sender": "user", "content": "What's the difference between tar and zip?"},
            {"sender": "bot", "content": "tar preserves Unix file permissions and is more common on Linux. zip is more universal across platforms. Both can compress files."}
        ]
    }
]

async def clear_database():
    """Clear all collections in the database"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    print("🗑️  Clearing database...")
    
    # Drop all collections
    collections = await db.list_collection_names()
    for collection_name in collections:
        await db[collection_name].drop()
        print(f"   Dropped collection: {collection_name}")
    
    client.close()
    print("✅ Database cleared successfully!")

async def create_fake_users(num_users=5):
    """Create fake users with conversations and messages"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    print(f"👥 Creating {num_users} fake users...")
    
    users = []
    
    for i in range(num_users):
        # Generate fake user data
        username = fake.user_name()
        email = fake.email()
        password = "password123"  # Same password for all test users
        
        # Ensure unique usernames and emails
        username = f"{username}_{i}" if i > 0 else username
        email = f"user{i}_{email}" if i > 0 else email
        
        user_doc = {
            "username": username,
            "email": email,
            "password": hash_password(password),
            "created_at": fake.date_time_between(start_date="-1y", end_date="now")
        }
        
        result = await db.users.insert_one(user_doc)
        user_id = result.inserted_id
        
        users.append({
            "id": user_id,
            "username": username,
            "email": email,
            "password": "password123"  # Store plain password for reference
        })
        
        print(f"   Created user: {username} ({email})")
        
        # Create conversations for this user
        await create_conversations_for_user(db, user_id)
    
    client.close()
    
    # Print user credentials
    print("\n📋 User Credentials (for testing):")
    print("-" * 50)
    for user in users:
        print(f"Email: {user['email']}")
        print(f"Password: {user['password']}")
        print(f"Username: {user['username']}")
        print("-" * 50)
    
    return users

async def create_conversations_for_user(db, user_id):
    """Create random conversations and messages for a user"""
    num_conversations = random.randint(2, 5)
    
    for _ in range(num_conversations):
        # Pick a random conversation template
        conversation_template = random.choice(SAMPLE_CONVERSATIONS)
        
        # Create slight variations in timing
        created_time = fake.date_time_between(start_date="-3m", end_date="-1d")
        
        conversation_doc = {
            "user_id": user_id,
            "title": conversation_template["title"],
            "created_at": created_time,
            "updated_at": created_time
        }
        
        result = await db.conversations.insert_one(conversation_doc)
        conversation_id = result.inserted_id
        
        # Create messages for this conversation
        message_time = created_time
        for message_data in conversation_template["messages"]:
            # Add some time between messages
            message_time += timedelta(minutes=random.randint(1, 30))
            
            message_doc = {
                "conversation_id": conversation_id,
                "sender": message_data["sender"],
                "content": message_data["content"],
                "timestamp": message_time
            }
            
            await db.messages.insert_one(message_doc)
        
        # Update conversation's updated_at to the last message time
        await db.conversations.update_one(
            {"_id": conversation_id},
            {"$set": {"updated_at": message_time}}
        )

async def create_indexes():
    """Create database indexes for better performance"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    print("🔍 Creating database indexes...")
    
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        await db.conversations.create_index([("user_id", 1), ("updated_at", -1)])
        await db.messages.create_index([("conversation_id", 1), ("timestamp", 1)])
        print("✅ Database indexes created successfully!")
    except Exception as e:
        print(f"⚠️  Index creation warning: {e}")
    
    client.close()

async def print_database_stats():
    """Print statistics about the seeded database"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    print("\n📊 Database Statistics:")
    print("-" * 30)
    
    # Count users
    user_count = await db.users.count_documents({})
    print(f"Users: {user_count}")
    
    # Count conversations
    conversation_count = await db.conversations.count_documents({})
    print(f"Conversations: {conversation_count}")
    
    # Count messages
    message_count = await db.messages.count_documents({})
    print(f"Messages: {message_count}")
    
    # Count messages by sender
    user_messages = await db.messages.count_documents({"sender": "user"})
    bot_messages = await db.messages.count_documents({"sender": "bot"})
    print(f"User messages: {user_messages}")
    print(f"Bot messages: {bot_messages}")
    
    client.close()

async def main():
    """Main function to seed the database"""
    print("🚀 Starting database seeding process...")
    print("=" * 50)
    
    try:
        # Test MongoDB connection
        client = AsyncIOMotorClient(MONGO_URL)
        await client.admin.command('ping')
        client.close()
        print("✅ MongoDB connection successful!")
        
        # Clear existing data
        await clear_database()
        
        # Create fake users with conversations
        num_users = int(input("\nHow many users do you want to create? (default: 5): ") or "5")
        await create_fake_users(num_users)
        
        # Create database indexes
        await create_indexes()
        
        # Print statistics
        await print_database_stats()
        
        print("\n🎉 Database seeding completed successfully!")
        print("\nYou can now:")
        print("1. Start your FastAPI server: python main.py")
        print("2. Use the credentials above to test login functionality")
        print("3. All users have the password: password123")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        print("Make sure MongoDB is running and accessible")

if __name__ == "__main__":
    # Install required packages if not already installed
    try:
        import faker
    except ImportError:
        print("Installing required packages...")
        import subprocess
        subprocess.check_call(["pip", "install", "faker"])
        import faker
    
    asyncio.run(main())