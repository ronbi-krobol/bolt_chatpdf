export interface AdvancedTextChunk {
  text: string;
  index: number;
  tokenCount: number;
  type: 'paragraph' | 'section' | 'list' | 'code' | 'table';
  metadata?: {
    pageNumber?: number;
    heading?: string;
    importance?: number;
  };
}

const OPTIMAL_CHUNK_SIZE = 800;
const MIN_CHUNK_SIZE = 100;
const MAX_CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 150;

export function accurateTokenCount(text: string): number {
  const tokens = text.match(/\b\w+\b|[^\w\s]/g);
  return tokens ? tokens.length : Math.ceil(text.length / 4);
}

export function semanticSplitIntoChunks(text: string): AdvancedTextChunk[] {
  const chunks: AdvancedTextChunk[] = [];

  const sections = splitIntoSections(text);

  let globalIndex = 0;

  for (const section of sections) {
    const sectionChunks = chunkSection(section, globalIndex);
    chunks.push(...sectionChunks);
    globalIndex += sectionChunks.length;
  }

  return chunks;
}

function splitIntoSections(text: string): string[] {
  const sections: string[] = [];

  const headingPattern = /^(#{1,6}\s+.+|[A-Z][^.!?]*:|\d+\.\s+[A-Z].+)$/gm;
  const parts = text.split(headingPattern);

  for (let i = 0; i < parts.length; i++) {
    if (parts[i]?.trim()) {
      sections.push(parts[i].trim());
    }
  }

  return sections.length > 0 ? sections : [text];
}

function chunkSection(section: string, startIndex: number): AdvancedTextChunk[] {
  const chunks: AdvancedTextChunk[] = [];

  const paragraphs = section.split(/\n\s*\n/);

  let currentChunk = '';
  let currentTokens = 0;
  let chunkIndex = startIndex;

  for (const paragraph of paragraphs) {
    const cleanPara = paragraph.trim();
    if (!cleanPara) continue;

    const paraTokens = accurateTokenCount(cleanPara);

    if (paraTokens > MAX_CHUNK_SIZE) {
      if (currentChunk) {
        chunks.push(createChunk(currentChunk, chunkIndex));
        chunkIndex++;
      }

      const sentenceChunks = chunkBySentences(cleanPara, chunkIndex);
      chunks.push(...sentenceChunks);
      chunkIndex += sentenceChunks.length;
      currentChunk = '';
      currentTokens = 0;
      continue;
    }

    if (currentTokens + paraTokens > OPTIMAL_CHUNK_SIZE && currentChunk) {
      chunks.push(createChunk(currentChunk, chunkIndex));
      chunkIndex++;

      const overlap = getSemanticOverlap(currentChunk);
      currentChunk = overlap + '\n\n' + cleanPara;
      currentTokens = accurateTokenCount(currentChunk);
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + cleanPara;
      currentTokens += paraTokens;
    }
  }

  if (currentChunk.trim() && currentTokens >= MIN_CHUNK_SIZE) {
    chunks.push(createChunk(currentChunk, chunkIndex));
  }

  return chunks;
}

function chunkBySentences(text: string, startIndex: number): AdvancedTextChunk[] {
  const chunks: AdvancedTextChunk[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let currentChunk = '';
  let currentTokens = 0;
  let chunkIndex = startIndex;

  for (const sentence of sentences) {
    const sentenceTokens = accurateTokenCount(sentence);

    if (currentTokens + sentenceTokens > OPTIMAL_CHUNK_SIZE && currentChunk) {
      chunks.push(createChunk(currentChunk, chunkIndex));
      chunkIndex++;

      const overlap = getLastSentences(currentChunk, 2);
      currentChunk = overlap + sentence;
      currentTokens = accurateTokenCount(currentChunk);
    } else {
      currentChunk += sentence;
      currentTokens += sentenceTokens;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(createChunk(currentChunk, chunkIndex));
  }

  return chunks;
}

function createChunk(text: string, index: number): AdvancedTextChunk {
  const type = detectChunkType(text);
  const importance = calculateImportance(text);

  return {
    text: text.trim(),
    index,
    tokenCount: accurateTokenCount(text),
    type,
    metadata: {
      importance,
    },
  };
}

function detectChunkType(text: string): AdvancedTextChunk['type'] {
  if (/^(```|~~~)/.test(text)) return 'code';
  if (/^\|.+\|/.test(text)) return 'table';
  if (/^[\s-]*[-*+]\s/.test(text)) return 'list';
  if (/^#{1,6}\s+/.test(text)) return 'section';
  return 'paragraph';
}

function calculateImportance(text: string): number {
  let score = 0;

  if (/^#{1,3}\s+/.test(text)) score += 3;
  if (/\b(important|critical|key|essential|note)\b/i.test(text)) score += 2;
  if (text.length > 500) score += 1;
  if (/\d+/.test(text)) score += 0.5;

  return Math.min(score, 5);
}

function getSemanticOverlap(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length === 0) return '';

  const overlapSentences = sentences.slice(-2);
  const overlap = overlapSentences.join('');
  const overlapTokens = accurateTokenCount(overlap);

  return overlapTokens <= CHUNK_OVERLAP ? overlap : getLastWords(text, CHUNK_OVERLAP);
}

function getLastSentences(text: string, count: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.slice(-count).join('');
}

function getLastWords(text: string, tokenLimit: number): string {
  const words = text.split(/\s+/);
  return words.slice(-Math.ceil(tokenLimit * 0.75)).join(' ');
}

export function optimizedBatchForEmbedding(
  chunks: AdvancedTextChunk[],
  maxBatchSize: number = 100
): AdvancedTextChunk[][] {
  const batches: AdvancedTextChunk[][] = [];
  let currentBatch: AdvancedTextChunk[] = [];
  let currentTokenCount = 0;
  const maxTokensPerBatch = 8000;

  for (const chunk of chunks) {
    if (
      currentBatch.length >= maxBatchSize ||
      currentTokenCount + chunk.tokenCount > maxTokensPerBatch
    ) {
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
      }
      currentBatch = [chunk];
      currentTokenCount = chunk.tokenCount;
    } else {
      currentBatch.push(chunk);
      currentTokenCount += chunk.tokenCount;
    }
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}
