from embeddings import get_embedding
from rag import retrieve_top_k

def retrieve_context_for_ranking(job_description_query: str, resume_ids: list[str], k: int = 3) -> dict[str, list[str]]:
    """
    Embeds the job description query and retrieves the top-k text chunks for each resume.
    Returns:
        dict: Mapping of resume_id -> list of chunk text strings.
    """
    if not resume_ids or not job_description_query.strip():
        return {r_id: [] for r_id in resume_ids}
        
    # Generate query embedding
    query_emb = get_embedding(job_description_query, task_type="retrieval_query")
    
    # Retrieve top-k matching chunks from SQLite vector store
    retrieved_data = retrieve_top_k(query_emb, resume_ids, k=k)
    
    # Clean and structure to return just lists of chunk texts
    context = {}
    for r_id, items in retrieved_data.items():
        context[r_id] = [item["text"] for item in items]
        
    return context
