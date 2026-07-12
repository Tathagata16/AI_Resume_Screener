def chunk_text(text: str, chunk_size_words: int = 150, chunk_overlap_words: int = 30) -> list[str]:
    """
    Chunks text by words to prevent cutting words or sentences in half.
    - chunk_size_words: Maximum number of words in a chunk.
    - chunk_overlap_words: Number of overlapping words between consecutive chunks.
    """
    words = text.split()
    if not words:
        return []
        
    chunks = []
    i = 0
    while i < len(words):
        chunk_words = words[i : i + chunk_size_words]
        chunks.append(" ".join(chunk_words))
        
        # Advance by step
        step = chunk_size_words - chunk_overlap_words
        if step <= 0:
            step = 1 # Avoid infinite loop
        i += step
        
        # If we have reached the end of the text, stop
        if i + chunk_overlap_words >= len(words) and len(chunks) > 0:
            # If remaining words are very few, we can add them to the last chunk, or just break if done
            remaining = words[i:]
            if remaining:
                chunks.append(" ".join(remaining))
            break
            
    return chunks
