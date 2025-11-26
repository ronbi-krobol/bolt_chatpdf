import {
  cacheEmbedding,
  getCachedEmbedding,
  batchCacheEmbeddings,
  batchGetCachedEmbeddings,
} from './cacheService';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callEmbeddingFunction(texts: string[]): Promise<number[][]> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ texts }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Edge Function error: ${response.status}`);
  }

  const data = await response.json();
  return data.embeddings;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const cached = await getCachedEmbedding(text);
  if (cached) {
    return cached;
  }

  try {
    const embeddings = await callEmbeddingFunction([text]);
    const embedding = embeddings[0];
    await cacheEmbedding(text, embedding);
    return embedding;
  } catch (error: any) {
    console.error('Embedding API Error:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

export async function generateEmbeddingsOptimized(
  texts: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<number[][]> {
  const cachedEmbeddings = await batchGetCachedEmbeddings(texts);

  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];

  cachedEmbeddings.forEach((cached, index) => {
    if (!cached) {
      uncachedIndices.push(index);
      uncachedTexts.push(texts[index]);
    }
  });

  if (uncachedTexts.length === 0) {
    onProgress?.(texts.length, texts.length);
    return cachedEmbeddings as number[][];
  }

  const BATCH_SIZE = 100;
  const newEmbeddings: number[][] = [];

  for (let i = 0; i < uncachedTexts.length; i += BATCH_SIZE) {
    const batch = uncachedTexts.slice(i, i + BATCH_SIZE);

    try {
      const batchEmbeddings = await callEmbeddingFunction(batch);
      newEmbeddings.push(...batchEmbeddings);

      await batchCacheEmbeddings(batch, batchEmbeddings);

      const completed = Math.min(i + BATCH_SIZE, uncachedTexts.length);
      const totalCached = texts.length - uncachedTexts.length;
      onProgress?.(totalCached + completed, texts.length);
    } catch (error: any) {
      console.error('Error generating embeddings batch:', error);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  const finalEmbeddings: number[][] = [];
  let newEmbeddingIndex = 0;

  for (let i = 0; i < texts.length; i++) {
    if (cachedEmbeddings[i]) {
      finalEmbeddings.push(cachedEmbeddings[i]!);
    } else {
      finalEmbeddings.push(newEmbeddings[newEmbeddingIndex]);
      newEmbeddingIndex++;
    }
  }

  return finalEmbeddings;
}

export async function generateEmbeddingsParallel(
  texts: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<number[][]> {
  if (texts.length <= 100) {
    return generateEmbeddingsOptimized(texts, onProgress);
  }

  const PARALLEL_BATCHES = 3;
  const BATCH_SIZE = Math.ceil(texts.length / PARALLEL_BATCHES);
  const batches: string[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    batches.push(texts.slice(i, i + BATCH_SIZE));
  }

  let completedCount = 0;

  const batchPromises = batches.map((batch) =>
    generateEmbeddingsOptimized(batch, (completed, total) => {
      completedCount += completed;
      onProgress?.(completedCount, texts.length);
    })
  );

  const results = await Promise.all(batchPromises);

  return results.flat();
}
