import { supabase } from '../lib/supabase';
import { generateEmbedding } from './embeddingService';

export interface RelevantChunk {
  id: string;
  chunk_text: string;
  chunk_index: number;
  similarity: number;
}

export async function searchRelevantChunks(
  pdfFileId: string,
  query: string,
  limit: number = 8
): Promise<RelevantChunk[]> {
  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc('match_pdf_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: 0.1,
    match_count: limit,
    filter_pdf_id: pdfFileId,
  });

  if (error) {
    console.error('Error searching chunks:', error);
    throw error;
  }

  return data || [];
}

export async function storePDFFile(
  fileName: string,
  fileSize: number
): Promise<string> {
  const { data, error } = await supabase
    .from('pdf_files')
    .insert({
      file_name: fileName,
      file_size: fileSize,
      processing_status: 'processing',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error storing PDF file:', error);
    throw error;
  }

  return data.id;
}

export async function storeChunks(
  pdfFileId: string,
  chunks: Array<{ text: string; index: number; tokenCount: number; embedding: number[] }>
): Promise<void> {
  const chunkRecords = chunks.map((chunk) => ({
    pdf_file_id: pdfFileId,
    chunk_index: chunk.index,
    chunk_text: chunk.text,
    token_count: chunk.tokenCount,
    embedding: chunk.embedding,
  }));

  const { error } = await supabase.from('pdf_chunks').insert(chunkRecords);

  if (error) {
    console.error('Error storing chunks:', error);
    throw error;
  }

  const { error: updateError } = await supabase
    .from('pdf_files')
    .update({
      processing_status: 'completed',
      total_chunks: chunks.length,
    })
    .eq('id', pdfFileId);

  if (updateError) {
    console.error('Error updating PDF status:', updateError);
    throw updateError;
  }
}

export async function storeChatMessage(
  pdfFileId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  const { error } = await supabase.from('chat_messages').insert({
    pdf_file_id: pdfFileId,
    role,
    content,
  });

  if (error) {
    console.error('Error storing chat message:', error);
    throw error;
  }
}

export async function getChatHistory(pdfFileId: string): Promise<Array<{ role: string; content: string }>> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('pdf_file_id', pdfFileId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }

  return data || [];
}
