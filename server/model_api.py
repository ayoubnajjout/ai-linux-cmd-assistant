from fastapi import FastAPI, Request
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

# Define request model
class Question(BaseModel):
    question: str

# Load model & tokenizer at startup
tokenizer = AutoTokenizer.from_pretrained('content/model')
model = AutoModelForCausalLM.from_pretrained('content/model')

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)

# Initialize FastAPI app
app = FastAPI()

def ask(question: str) -> str:
    prompt = f"Linux Command Question: {question.strip()}\n\nAnswer:"
    inputs = tokenizer(prompt, return_tensors='pt')
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_length=300,
            temperature=0.7,
            top_p=0.9,
            num_return_sequences=1,
            pad_token_id=tokenizer.eos_token_id,
            do_sample=True,
        )

    full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    answer = full_response.split("Answer:")[1].strip() if "Answer:" in full_response else full_response
    answer = answer.split("<|endoftext|>")[0].strip()
    return answer

@app.post("/ask")
async def get_answer(question: Question):
    response = ask(question.question)
    return {"answer": response}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)
