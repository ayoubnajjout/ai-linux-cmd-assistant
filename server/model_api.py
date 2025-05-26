from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel, PeftConfig
import torch
import os
import re

# ==== Configuration ====
HF_TOKEN = os.getenv("HF_TOKEN")
ADAPTER_PATH = "anyub/llama2-lora-linux"

# ==== Define request model ====
class Question(BaseModel):
    question: str

# ==== Device detection ====
if torch.cuda.is_available():
    device = "cuda"
    print(f"🚀 Using GPU: {torch.cuda.get_device_name(0)}")
    print(f"💾 GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f}GB")
else:
    device = "cpu"
    print("⚠️ CUDA not available, using CPU (will be slow)")
    torch.set_num_threads(os.cpu_count())

# ==== Load PEFT config ====
peft_config = PeftConfig.from_pretrained(ADAPTER_PATH, use_auth_token=HF_TOKEN)
base_model_name = peft_config.base_model_name_or_path

# ==== Load tokenizer ====
tokenizer = AutoTokenizer.from_pretrained(base_model_name, use_auth_token=HF_TOKEN)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

# ==== 4-bit quantization config for GTX 1650 Ti (4GB VRAM) ====
quantization_config = None
if device == "cuda":
    quantization_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4"
    )

# ==== Load base model ====
print("📦 Loading base model...")

load_args_common = {
    "use_auth_token": HF_TOKEN,
    "trust_remote_code": True,
    "low_cpu_mem_usage": True # Kept as a common arg, generally good for initial load
}

if device == "cuda":
    load_args = {
        **load_args_common,
        "quantization_config": quantization_config,
        "torch_dtype": torch.float16,
        "device_map": device,  # Changed from "auto" to explicit device
        # "max_memory": {0: "3.5GB"}, # Removed max_memory
    }
else:  # CPU
    load_args = {
        **load_args_common,
        "torch_dtype": torch.float32,
        "device_map": None,
    }

base_model = AutoModelForCausalLM.from_pretrained(
    base_model_name,
    **load_args
)

# Move to CPU if needed (this handles the device == "cpu" case after loading)
if device == "cpu":
    base_model = base_model.to(device)

# ==== Load LoRA adapter ====
print("🔧 Loading LoRA adapter...")

adapter_load_args = {
    "use_auth_token": HF_TOKEN,
    "torch_dtype": torch.float16 if device == "cuda" else torch.float32,
}
if device == "cuda":
    adapter_load_args["device_map"] = device # Add device_map for adapter on CUDA

model = PeftModel.from_pretrained(
    base_model,
    ADAPTER_PATH,
    **adapter_load_args
)

# ==== Optimize model ====
model.eval()

# Warm up the model
print("🔥 Warming up model...")
warmup_input = tokenizer("Hello", return_tensors="pt").to(device)
with torch.no_grad():
    _ = model.generate(**warmup_input, max_new_tokens=5, do_sample=False)

if device == "cuda":
    torch.cuda.empty_cache()

print("✅ Model loaded and ready!")

# ==== FastAPI setup ====
app = FastAPI()

def ask(question: str) -> str:
    instruction = (
        "You are a Linux assistant. Only answer questions related to Linux. "
        "If the question is not about Linux, respond with: 'Sorry, I only answer Linux-related questions.'"
    )
    full_prompt = f"<s>[INST] {instruction}\nQuestion: {question.strip()} [/INST]"
    
    # Tokenize input
    inputs = tokenizer(
        full_prompt, 
        return_tensors="pt", 
        truncation=True, 
        max_length=512
    ).to(device)
    
    # Generate response
    with torch.no_grad():
        with torch.inference_mode():
            outputs = model.generate(
                **inputs,
                max_new_tokens=80,  # Reasonable length for mobile GPU
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                top_k=50,
                repetition_penalty=1.1,
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,
                use_cache=True,
                early_stopping=True
            )
    
    # Decode and clean output
    output_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    answer = output_text.split("[/INST]")[-1].strip()
    answer = re.sub(r"Sorry, I only answer Linux-related questions\.?\s*", "", answer, flags=re.IGNORECASE)
    answer = answer.split("<|endoftext|>")[0].strip()
    
    # Clean GPU memory
    if device == "cuda":
        torch.cuda.empty_cache()
    
    return answer

@app.post("/ask")
async def get_answer(question: Question):
    try:
        if device == "cuda":
            memory_before = torch.cuda.memory_allocated(0) / 1024**2
        
        response = ask(question.question)
        
        if device == "cuda":
            memory_after = torch.cuda.memory_allocated(0) / 1024**2
            print(f"GPU Memory: {memory_before:.1f}MB -> {memory_after:.1f}MB")
        
        return {"answer": response}
    except Exception as e:
        if device == "cuda":
            torch.cuda.empty_cache()
        return {"error": str(e), "answer": "Sorry, there was an error processing your question."}

@app.get("/")
async def root():
    gpu_info = {}
    if device == "cuda":
        gpu_info = {
            "gpu_name": torch.cuda.get_device_name(0),
            "gpu_memory_total": f"{torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f}GB",
            "gpu_memory_allocated": f"{torch.cuda.memory_allocated(0) / 1024**2:.1f}MB"
        }
    
    return {
        "message": "Linux Assistant API is running",
        "device": device,
        **gpu_info
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "device": device,
        "model_loaded": model is not None,
        "cuda_available": torch.cuda.is_available()
    }

@app.get("/gpu-status")
async def gpu_status():
    if device == "cuda":
        return {
            "gpu_name": torch.cuda.get_device_name(0),
            "memory_total": f"{torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f}GB",
            "memory_allocated": f"{torch.cuda.memory_allocated(0) / 1024**2:.1f}MB",
            "memory_reserved": f"{torch.cuda.memory_reserved(0) / 1024**2:.1f}MB"
        }
    else:
        return {"error": "CUDA not available"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)