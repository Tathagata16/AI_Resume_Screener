import os
from google import genai

def _get_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set")
    return genai.Client(api_key=api_key)

def get_embedding(text: str, task_type: str = "retrieval_document") -> list[float]:
    """
    Generates a single vector embedding for the given text using gemini-embedding-2.
    """
    if not text.strip():
        return [0.0] * 3072
        
    client = _get_client()
    response = client.models.embed_content(
        model="gemini-embedding-2",
        contents=text,
    )
    return response.embeddings[0].values

def get_embeddings_batch(texts: list[str], task_type: str = "retrieval_document") -> list[list[float]]:
    """
    Generates embeddings in batch for performance.
    """
    if not texts:
        return []
        
    client = _get_client()
    cleaned_texts = [t if t.strip() else "Empty chunk" for t in texts]
    
    response = client.models.embed_content(
        model="gemini-embedding-2",
        contents=cleaned_texts,
    )
    
    return [emb.values for emb in response.embeddings]
