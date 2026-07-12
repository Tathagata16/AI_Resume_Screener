# AI-Powered Resume Ranking System (RAG + Gemini)

A full-stack, intermediate-level portfolio web application for recruiters to parse, search, and rank resumes against detailed job descriptions using **Retrieval-Augmented Generation (RAG)**.

## High-Level Architecture
1. **React Frontend**: Clean, modern, responsive workspace using React Router, Axios, and Tailwind CSS.
2. **Express Backend**: Gatekeeps recruiter sessions via JWT, tracks job descriptions, resume metadata, and comparison history in MongoDB, and coordinates uploads.
3. **FastAPI AI Service**: Decoupled AI helper which parses files (PDF/DOCX), chunks text, generates embeddings (Gemini API), retrieves contexts using a SQLite vector database (with Python-based cosine similarity), and compiles rankings.

```
React Frontend (5173) ──> Express Backend (5000) ──> MongoDB (27017)
                                 │
                                 └──> FastAPI AI Service (8000) ──> SQLite Vector DB
                                              │
                                              └──> Google Gemini API (LLM & Embeddings)
```

---

## Technical Features
* **Stateless Auth**: Recruiter registration and login using JWT.
* **Document Storage**: Supports uploading 1 to 15 resumes (PDF/DOCX). Files are saved to a local folder statically served by Express (with an easy environment upgrade to Cloudinary).
* **AI Parser**: Unstructured resume text is parsed into structured details (Candidate Name, Email, Skills, Experience, Education) using Gemini.
* **SQLite Vector Store**: Resumes are chunked into 150-word sliding segments. Gemini generates 768-dimension vectors saved locally in SQLite (`vector_store.db`), eliminating heavy C-compiler environment dependencies on Windows.
* **RAG Ranking**: Performs vector similarity search on candidate chunks matching the Job Description. The top 3 relevant chunks are sent as context to Gemini for candidate evaluation, rather than the raw document.
* **Structured Evaluation Output**: Gemini evaluates candidates and outputs strict JSON ranking cards displaying strengths, missing skills, justification, and recommendations.

---

## Project Structure
```
Resume_Screener/
├── backend/            # Express JS Backend
│   ├── config/         # DB Connection
│   ├── controllers/    # Route controllers
│   ├── middleware/     # JWT Protection
│   ├── models/         # Mongoose Schemas (User, Resume, JobDescription, Comparison)
│   ├── routes/         # REST API Routing
│   └── server.js       # Entry point
│
├── fastapi/            # FastAPI Python AI Service
│   ├── parser/         # PDF & DOCX text extractors
│   ├── chunker/        # Overlapping text chunker
│   ├── embeddings/     # Gemini vector generation
│   ├── rag/            # SQLite vector storage and cosine similarity calculation
│   ├── retriever/      # Context aggregator
│   ├── prompts/        # ATS prompts
│   ├── schemas/        # Pydantic models
│   └── main.py         # Entry point
│
└── frontend/           # Vite + React Frontend
    ├── src/
    │   ├── components/ # Shared layouts (Sidebar & Header)
    │   ├── pages/      # Workspace Pages (Login, Register, Dashboard, Library, Upload, etc.)
    │   ├── services/   # Axios Client Mapping
    │   └── App.jsx     # Route router and guards
```

---

## Installation & Setup

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **Python** (v3.9 or higher recommended)
* **MongoDB** (Local instance running at `mongodb://localhost:27017` or MongoDB Atlas URI)
* **Gemini API Key** (Obtained from [Google AI Studio](https://aistudio.google.com/))

---

### Step 1: Set Up the FastAPI AI Service

1. Open a terminal and navigate to the `fastapi` directory:
   ```bash
   cd fastapi
   ```

2. Create a Python Virtual Environment:
   ```bash
   python -m venv venv
   ```

3. Activate the Virtual Environment:
   * **Windows Powershell**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **Windows Command Prompt (cmd)**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   * **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```

4. Install the python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Configure environment variables. Create a `.env` file in the `fastapi` folder and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY_HERE
   ```

6. Start the FastAPI development server:
   ```bash
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *Verify it's running by opening `http://127.0.0.1:8000/` in your browser.*

---

### Step 2: Set Up the Express Backend

1. Open a new terminal window and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install the node packages:
   ```bash
   npm install
   ```

3. Configure environment variables. Create a `.env` file in the `backend` folder:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/resume-screener
   JWT_SECRET=jwt_secret_key_123456
   FASTAPI_URL=http://127.0.0.1:8000

   # Optional Cloudinary Configuration (Uncomment to use cloud uploads instead of local uploads)
   # CLOUDINARY_CLOUD_NAME=your_cloud_name
   # CLOUDINARY_API_KEY=your_api_key
   # CLOUDINARY_API_SECRET=your_api_secret
   ```

4. Start the Express server:
   * **Development mode (auto-reload)**:
     ```bash
     npm run dev
     ```
   * **Production mode**:
     ```bash
     npm start
     ```
   *Verify the backend connects to MongoDB and starts on port 5000.*

---

### Step 3: Set Up the React Frontend

1. Open a new terminal window and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install the packages:
   ```bash
   npm install
   ```

3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *Verify the web interface loads by opening `http://localhost:5173/` in your browser.*

---

## API Endpoints List

### Express Backend Gateway (`http://localhost:5000/api`)

#### **Auth Endpoints**
* `POST /auth/register` - Create Recruiter account
* `POST /auth/login` - Authenticate and fetch JWT
* `POST /auth/logout` - Clear token session
* `GET /auth/me` - Fetch profile metadata (Protected)

#### **Resume Library Endpoints**
* `POST /resumes/upload` - Upload 1-15 files (PDF/DOCX), triggers FastAPI parser/indexing (Protected)
* `GET /resumes` - Fetch recruiter's uploads (Supports query filters `search` and `skill`) (Protected)
* `GET /resumes/:id` - Fetch resume metadata (Protected)
* `DELETE /resumes/:id` - Delete document, files, and vector indices (Protected)

#### **Job Description Endpoints**
* `POST /jobs` - Save a new job post (Protected)
* `GET /jobs` - List recruiter's job profiles (Protected)
* `GET /jobs/:id` - Get job profile details (Protected)
* `DELETE /jobs/:id` - Delete job profile (Protected)

#### **Comparison / Ranker Endpoints**
* `POST /comparisons` - Execute AI RAG ranking on selected resumes against a Job Description, save to history (Protected)
* `GET /comparisons` - List comparison logs (Protected)
* `GET /comparisons/:id` - View detailed ranked report (Protected)
* `DELETE /comparisons/:id` - Delete comparison report log (Protected)
* `POST /ai/rank` - Execute AI ranking directly without logging to history (Protected)

---

## RAG Flow Walkthrough
1. **Extraction**: When you upload a resume, Python parses text contents based on document format (`pypdf` for PDF, `python-docx` for Word tables/paragraphs).
2. **Structuring**: Gemini extracts core details (Name, Email, Skills, Experience highlights, Education) in structured JSON format back to MongoDB.
3. **Chunking & Indexing**: The resume text is chunked into 150-word sliding segments. For each chunk, a 768-float vector is generated via Gemini's `text-embedding-004` model. Chunks and embeddings are saved inside `vector_store.db` linked to the resume ID.
4. **Retrieval**: When trigger screening is activated, the Job Description query is embedded. The system retrieves all chunks belonging *only* to the selected resumes, calculates cosine similarity in Python using NumPy, and pulls the top 3 matching chunks per candidate.
5. **LLM Evaluation**: Retrieved text fragments are compiled into a comprehensive ranking prompt. Gemini processes the target requirements and contextual candidates to return scores, strengths, gaps, justifications, and recommendations.
