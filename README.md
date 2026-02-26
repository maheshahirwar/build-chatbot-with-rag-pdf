# PDF QA Chatbot (Production-Ready Starter)

A FastAPI-based LLM chatbot backend that:

1. Uploads and ingests PDF files.
2. Builds a retrieval index from PDF text.
3. Answers user questions using retrieved context via either OpenAI or Ollama.

## Features

- REST APIs (`/ingest`, `/chat`, `/health`)
- Robust PDF extraction (`pypdf`)
- Retrieval layer using TF-IDF + cosine similarity
- Persistent local index storage (`data/index.pkl`)
- Configurable via environment variables
- Supports both OpenAI and Ollama LLM backends
- Dockerized deployment
- Basic test coverage with `pytest`

## Tech Stack

- FastAPI + Uvicorn
- OpenAI Python SDK / Ollama HTTP API
- scikit-learn (retrieval)
- pypdf

## Setup

### 1) Install dependencies

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 2) Configure environment

```bash
cp .env.example .env
```

#### Option A: Test with Ollama (no OpenAI key required)

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

Make sure Ollama is running and the model is pulled:

```bash
ollama pull llama3.1
ollama serve
```

#### Option B: Test with OpenAI

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=<your_key>
OPENAI_MODEL=gpt-4o-mini
```

### 3) Run service

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4) Run React UI (optional)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

If your backend is not running at `http://localhost:8000`, create a `frontend/.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## End-to-End Run (Backend + React UI)

1. Start Ollama in one terminal:

```bash
ollama serve
```

2. Start the FastAPI backend in a second terminal from project root:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

3. Start the React UI in a third terminal:

```bash
cd frontend
npm install
npm run dev
```

4. Open the UI in your browser:

- `http://localhost:5173`

5. In the UI:

- Upload a `.pdf` file using **Upload & Index**.
- Wait for the "Indexed X chunks" success message.
- Ask a question in the text area and click **Ask**.
- Read the generated answer and source chunks.

6. Quick troubleshooting:

- If upload fails, verify backend is running at `http://localhost:8000/health`.
- If chat fails, ensure Ollama model is available (`ollama pull llama3.1`).
- If UI cannot reach backend, set `frontend/.env` with `VITE_API_BASE_URL=http://localhost:8000`.

## API Usage

### Health Check

```bash
curl http://localhost:8000/health
```

### Ingest PDF

```bash
curl -X POST "http://localhost:8000/ingest" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample.pdf"
```

### Ask a Question

```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic of this PDF?"}'
```

## Testing

```bash
pytest -q
```

## Docker

```bash
docker build -t pdf-qa-chatbot .
docker run --rm -p 8000:8000 --env-file .env pdf-qa-chatbot
```

## Production Notes

- Put this service behind an API gateway or load balancer.
- Add authentication (JWT or API key middleware).
- Add request rate limiting.
- Use external object storage for uploaded PDFs.
- Replace TF-IDF with embedding + vector DB (pgvector/Pinecone/Weaviate) for large-scale workloads.
- Add observability (OpenTelemetry, structured logs, metrics dashboards).
- Add CI/CD and security checks (`bandit`, `pip-audit`, SAST).
