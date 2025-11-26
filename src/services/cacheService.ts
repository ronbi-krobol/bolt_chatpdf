import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PDFCacheDB extends DBSchema {
  embeddings: {
    key: string;
    value: {
      text: string;
      embedding: number[];
      timestamp: number;
    };
  };
  pdfs: {
    key: string;
    value: {
      id: string;
      name: string;
      text: string;
      chunks: Array<{ text: string; index: number; tokenCount: number }>;
      timestamp: number;
    };
  };
}

let db: IDBPDatabase<PDFCacheDB> | null = null;

async function getDB() {
  if (!db) {
    db = await openDB<PDFCacheDB>('pdf-cache', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('embeddings')) {
          db.createObjectStore('embeddings');
        }
        if (!db.objectStoreNames.contains('pdfs')) {
          db.createObjectStore('pdfs');
        }
      },
    });
  }
  return db;
}

export async function cacheEmbedding(text: string, embedding: number[]): Promise<void> {
  const database = await getDB();
  const key = hashText(text);
  await database.put('embeddings', {
    text,
    embedding,
    timestamp: Date.now(),
  }, key);
}

export async function getCachedEmbedding(text: string): Promise<number[] | null> {
  const database = await getDB();
  const key = hashText(text);
  const cached = await database.get('embeddings', key);

  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < 7 * 24 * 60 * 60 * 1000) {
      return cached.embedding;
    } else {
      await database.delete('embeddings', key);
    }
  }

  return null;
}

export async function cachePDFData(
  id: string,
  name: string,
  text: string,
  chunks: Array<{ text: string; index: number; tokenCount: number }>
): Promise<void> {
  const database = await getDB();
  await database.put('pdfs', {
    id,
    name,
    text,
    chunks,
    timestamp: Date.now(),
  }, id);
}

export async function getCachedPDFData(id: string) {
  const database = await getDB();
  const cached = await database.get('pdfs', id);

  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < 30 * 24 * 60 * 60 * 1000) {
      return cached;
    } else {
      await database.delete('pdfs', id);
    }
  }

  return null;
}

export async function batchCacheEmbeddings(
  texts: string[],
  embeddings: number[][]
): Promise<void> {
  const database = await getDB();
  const tx = database.transaction('embeddings', 'readwrite');

  await Promise.all([
    ...texts.map((text, index) => {
      const key = hashText(text);
      return tx.store.put({
        text,
        embedding: embeddings[index],
        timestamp: Date.now(),
      }, key);
    }),
    tx.done,
  ]);
}

export async function batchGetCachedEmbeddings(
  texts: string[]
): Promise<(number[] | null)[]> {
  const database = await getDB();
  const results: (number[] | null)[] = [];

  for (const text of texts) {
    const cached = await getCachedEmbedding(text);
    results.push(cached);
  }

  return results;
}

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export async function clearOldCache(): Promise<void> {
  const database = await getDB();
  const now = Date.now();
  const maxAge = 30 * 24 * 60 * 60 * 1000;

  const embeddingKeys = await database.getAllKeys('embeddings');
  for (const key of embeddingKeys) {
    const item = await database.get('embeddings', key);
    if (item && (now - item.timestamp) > maxAge) {
      await database.delete('embeddings', key);
    }
  }

  const pdfKeys = await database.getAllKeys('pdfs');
  for (const key of pdfKeys) {
    const item = await database.get('pdfs', key);
    if (item && (now - item.timestamp) > maxAge) {
      await database.delete('pdfs', key);
    }
  }
}
