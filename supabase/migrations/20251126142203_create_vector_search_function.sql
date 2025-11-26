/*
  # Create Vector Search Function

  1. Function
    - `match_pdf_chunks` - Finds the most similar chunks to a query embedding using cosine similarity
    
  2. Parameters
    - `query_embedding` (vector) - The embedding of the user's question
    - `match_threshold` (float) - Minimum similarity score (0-1)
    - `match_count` (int) - Number of results to return
    - `filter_pdf_id` (uuid) - Filter results to specific PDF file
    
  3. Returns
    - Array of matching chunks with similarity scores
*/

CREATE OR REPLACE FUNCTION match_pdf_chunks(
  query_embedding vector(3072),
  match_threshold float DEFAULT 0.1,
  match_count int DEFAULT 8,
  filter_pdf_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  pdf_file_id uuid,
  chunk_text text,
  chunk_index int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.pdf_file_id,
    pc.chunk_text,
    pc.chunk_index,
    1 - (pc.embedding <=> query_embedding) AS similarity
  FROM pdf_chunks pc
  WHERE 
    (filter_pdf_id IS NULL OR pc.pdf_file_id = filter_pdf_id)
    AND pc.embedding IS NOT NULL
    AND 1 - (pc.embedding <=> query_embedding) > match_threshold
  ORDER BY pc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
