import OpenAI from 'openai';
import {
  cacheEmbedding,
  getCachedEmbedding,
  batchCacheEmbeddings,
  batchGetCachedEmbeddings,
} from './cacheService';

let openaiClient: OpenAI | null = null;

export function initializeOpenAI(apiKey?: string) {
  const key = apiKey || import.meta.env.VITE_OPENAI_API_KEY;
  if (!key) {
    throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file.');
  }
  openaiClient = new OpenAI({
    apiKey: key,
    dangerouslyAllowBrowser: true,
  });
}

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    initializeOpenAI();
  }
  return openaiClient!;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const cached = await getCachedEmbedding(text);
  if (cached) {
    return cached;
  }

  const client = getOpenAIClient();
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  const embedding = response.data[0].embedding;
  await cacheEmbedding(text, embedding);

  return embedding;
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

  const client = getOpenAIClient();
  const BATCH_SIZE = 100;
  const newEmbeddings: number[][] = [];

  for (let i = 0; i < uncachedTexts.length; i += BATCH_SIZE) {
    const batch = uncachedTexts.slice(i, i + BATCH_SIZE);

    try {
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
      });

      const batchEmbeddings = response.data.map((item) => item.embedding);
      newEmbeddings.push(...batchEmbeddings);

      await batchCacheEmbeddings(batch, batchEmbeddings);

      const completed = Math.min(i + BATCH_SIZE, uncachedTexts.length);
      const totalCached = texts.length - uncachedTexts.length;
      onProgress?.(totalCached + completed, texts.length);
    } catch (error) {
      console.error('Error generating embeddings batch:', error);
      throw error;
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
