# AI Linux CMD Assistant

This project is an AI-powered assistant designed to help users with Linux commands. It utilizes a fine-tuned Llama 2 model to understand and respond to queries related to Linux.

## Features

*   **Linux Command Assistance:** Provides help and explanations for various Linux commands.
*   **Fine-tuned Language Model:** Uses a Llama 2 model fine-tuned with PEFT (LoRA) for specialized Linux knowledge.
*   **Web Interface:** A user-friendly web interface built with React and Vite to interact with the assistant.
*   **FastAPI Backend:** A robust Python backend serving the AI model and handling API requests.
*   **GPU/CPU Support:** Automatically detects and utilizes available GPU for faster inference, with a fallback to CPU.

## Tech Stack

*   **Backend:**
    *   Python
    *   FastAPI
    *   Hugging Face Transformers
    *   PEFT (Parameter-Efficient Fine-Tuning)
    *   PyTorch
    *   Uvicorn (ASGI server)
*   **Frontend:**
    *   React
    *   Vite
    *   Tailwind CSS
    *   JavaScript
*   **Fine-tuning:**
    *   Jupyter Notebook (`fine_tunning_pipeline.ipynb`)
    *   Pandas

## Project Structure

```
ai-linux-cmd-assistant/
├── client/                   # Frontend React application
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── server/                   # Backend FastAPI application
│   ├── content/              # Model adapter configuration
│   ├── model_api.py          # Core API logic with model loading and inference
│   ├── main.py               # (Potentially another entry point or utility)
│   ├── requirements.txt      # Python dependencies for the server
│   └── docker-compose.yml    # Docker configuration (optional)
├── fine_tunning_pipeline.ipynb # Jupyter notebook for model fine-tuning
├── linux_cmds.csv            # Data used for fine-tuning
├── linux_qa.csv              # Data used for fine-tuning
└── README.md                 # This file
```

## Setup and Installation

### Prerequisites

*   Python 3.8+
*   Node.js and npm (or yarn)
*   Access to a Hugging Face token with permissions for Llama 2 models (if not using a public adapter).

### Backend (Server)

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```
2.  **Create and activate a virtual environment (recommended):**
    ```bash
    python -m venv venv
    # On Windows
    venv\Scripts\activate
    # On macOS/Linux
    source venv/bin/activate
    ```
3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Set up environment variables:**
    Create a `.env` file in the `server` directory or set environment variables directly. The most important one is `HF_TOKEN` for Hugging Face authentication.
    ```env
    HF_TOKEN="your_hugging_face_token"
    ```
5.  **Run the FastAPI server:**
    The `model_api.py` file can be run directly:
    ```bash
    python model_api.py
    ```
    This will typically start the server on `http://localhost:8081`.

### Frontend (Client)

1.  **Navigate to the client directory:**
    ```bash
    cd client
    ```
2.  **Install Node.js dependencies:**
    ```bash
    npm install
    # or if you use yarn
    # yarn install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    # or if you use yarn
    # yarn dev
    ```
    This will typically start the frontend application on `http://localhost:5173` (or another port specified by Vite) and open it in your default browser.

## Usage

*   **Web Interface:** Once both the backend and frontend servers are running, you can access the AI Linux Assistant through the web interface (usually `http://localhost:5173`).
*   **API Endpoints:** The backend exposes several API endpoints:
    *   `POST /ask`: Send a question (JSON body: `{"question": "your linux question"}`) to get an answer.
    *   `GET /`: Root endpoint, shows API status.
    *   `GET /health`: Health check for the API.
    *   `GET /gpu-status`: Provides information about GPU status if CUDA is available.

## Fine-tuning

The `fine_tunning_pipeline.ipynb` notebook contains the code and steps used to fine-tune the base Llama 2 model with the provided `linux_cmds.csv` and `linux_qa.csv` datasets. You can explore this notebook to understand the fine-tuning process or to customize the model further with your own data.

## Contributing

(Add guidelines for contributing to the project if applicable)

## License

(Specify the license for your project, e.g., MIT, Apache 2.0)
