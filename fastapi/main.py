from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os

# Pure python env variables loader
def load_env_file():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip()
                    if val.startswith(('"', "'")) and val.endswith(('"', "'")):
                        val = val[1:-1]
                    os.environ[key] = val

load_env_file()

from parser import extract_text
from chunker import chunk_text
from embeddings import get_embeddings_batch
from rag import save_chunks, delete_chunks, init_db
from retriever import retrieve_context_for_ranking
from services import parse_resume_text, rank_candidates_llm
from schemas import ResumeParsedData, RankRequest, RankResponse

app = FastAPI(title="AI Resume Screen AI Service", version="1.0.0")

# Setup CORS to allow backend API communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    """
    Runs on startup to initialize SQLite database tables.
    """
    init_db()

@app.get("/")
def read_root():
    return {
        "status": "healthy", 
        "service": "AI Resume Screener AI Service",
        "gemini_configured": "GEMINI_API_KEY" in os.environ
    }

@app.post("/ai/parse", response_model=ResumeParsedData)
async def ai_parse(
    resume_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Uploads a resume file, extracts text, chunks it, generates embeddings,
    saves embeddings in SQLite, and parses profile metadata with Gemini.
    """
    try:
        # Read file bytes
        file_bytes = await file.read()
        
        # 1. Extract text from file bytes
        text = extract_text(file_bytes, file.filename)
        
        if not text.strip():
            raise HTTPException(
                status_code=400, 
                detail="Could not extract any readable text from the uploaded document."
            )
            
        # 2. Parse profile metadata using Gemini LLM
        parsed_data = parse_resume_text(text)
        
        # 3. Chunk text into word-based segments
        chunks = chunk_text(text, chunk_size_words=150, chunk_overlap_words=30)
        
        # 4. Generate embeddings and save to vector store
        if chunks:
            try:
                embeddings = get_embeddings_batch(chunks)
                save_chunks(resume_id, chunks, embeddings)
            except Exception as e:
                # Log embedding error, but don't fail parsing (still return metadata)
                print(f"Failed to generate embeddings: {e}")
                
        return parsed_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")

@app.post("/ai/rank", response_model=RankResponse)
def ai_rank(request: RankRequest):
    """
    Ranks multiple candidates against a job description.
    Uses RAG to retrieve candidate-specific resume snippets relevant to the JD,
    and then sends the context-rich prompt to Gemini.
    """
    try:
        jd_dict = request.jobDescription.dict()
        resume_ids = [c.resumeId for c in request.candidates]
        candidate_map = {c.resumeId: c.name for c in request.candidates}
        
        # 1. Embed job description details to formulate vector query
        jd_query = f"{request.jobDescription.jobTitle} " + " ".join(request.jobDescription.requiredSkills)
        
        # 2. Retrieve top-k (3) relevant snippets for each candidate
        contexts = retrieve_context_for_ranking(
            job_description_query=jd_query,
            resume_ids=resume_ids,
            k=3
        )
        
        # 3. Formulate RAG evaluation structure
        candidates_input = []
        for r_id in resume_ids:
            candidates_input.append({
                "resumeId": r_id,
                "name": candidate_map.get(r_id, "Unknown"),
                "context": contexts.get(r_id, [])
            })
            
        # 4. Prompt Gemini for structured rankings and overall summary
        rank_response = rank_candidates_llm(jd_dict, candidates_input)
        return rank_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to rank candidates: {str(e)}")

@app.delete("/ai/resumes/{resume_id}")
def delete_resume_vectors(resume_id: str):
    """
    Cleans up chunks and embeddings for a deleted resume.
    """
    try:
        delete_chunks(resume_id)
        return {"status": "success", "message": f"Vectors for resume {resume_id} deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete vectors: {str(e)}")
