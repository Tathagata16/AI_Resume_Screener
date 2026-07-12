import sqlite3
import json
import numpy as np
import os

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vector_store.db")

def init_db():
    """
    Initializes the SQLite database schema for storing resume chunks and embeddings.
    """
    db_dir = os.path.dirname(DB_FILE)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
        
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS resume_chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resume_id TEXT NOT NULL,
            chunk_index INTEGER NOT NULL,
            chunk_text TEXT NOT NULL,
            embedding TEXT NOT NULL
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_resume_id ON resume_chunks(resume_id)")
    conn.commit()
    conn.close()

def save_chunks(resume_id: str, chunks: list[str], embeddings: list[list[float]]):
    """
    Saves chunks and their corresponding embeddings for a specific resume.
    """
    init_db()
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    for idx, (chunk, emb) in enumerate(zip(chunks, embeddings)):
        cursor.execute(
            "INSERT INTO resume_chunks (resume_id, chunk_index, chunk_text, embedding) VALUES (?, ?, ?, ?)",
            (resume_id, idx, chunk, json.dumps(emb))
        )
    conn.commit()
    conn.close()

def delete_chunks(resume_id: str):
    """
    Deletes all chunks and embeddings associated with a resume_id.
    """
    init_db()
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM resume_chunks WHERE resume_id = ?", (resume_id,))
    conn.commit()
    conn.close()

def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    """
    Computes cosine similarity between two vectors.
    """
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return float(dot_product / (norm_v1 * norm_v2))

def retrieve_top_k(query_embedding: list[float], resume_ids: list[str], k: int = 3) -> dict[str, list[dict]]:
    """
    Retrieves the top-k most similar chunks for each specified resume ID.
    Returns:
        dict: Mapping from resume_id to a list of dicts containing "text" and "score".
    """
    init_db()
    if not resume_ids:
        return {}
        
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Query database for all chunks of the specified resume IDs
    placeholders = ",".join("?" for _ in resume_ids)
    query = f"SELECT resume_id, chunk_text, embedding FROM resume_chunks WHERE resume_id IN ({placeholders})"
    
    cursor.execute(query, resume_ids)
    rows = cursor.fetchall()
    conn.close()
    
    # Initialize groups
    by_resume = {r_id: [] for r_id in resume_ids}
    query_vec = np.array(query_embedding)
    
    for resume_id, chunk_text, emb_str in rows:
        if resume_id not in by_resume:
            continue
        try:
            emb = np.array(json.loads(emb_str))
            score = cosine_similarity(query_vec, emb)
            by_resume[resume_id].append({
                "text": chunk_text,
                "score": score
            })
        except Exception:
            continue
            
    # Sort and slice top-k for each resume
    results = {}
    for r_id, items in by_resume.items():
        items.sort(key=lambda x: x["score"], reverse=True)
        results[r_id] = items[:k]
        
    return results
