export interface TextChunk {
  text: string;
  index: number;
  tokenCount: number;
}

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

export function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function splitIntoChunks(text: string): TextChunk[] {
  const chunks: TextChunk[] = [];

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let currentChunk = '';
  let currentTokens = 0;
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const sentenceTokens = countTokens(sentence);

    if (currentTokens + sentenceTokens > CHUNK_SIZE && currentChunk) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex,
        tokenCount: currentTokens,
      });

      const overlapText = getOverlapText(currentChunk, CHUNK_OVERLAP);
      currentChunk = overlapText + sentence;
      currentTokens = countTokens(currentChunk);
      chunkIndex++;
    } else {
      currentChunk += sentence;
      currentTokens += sentenceTokens;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex,
      tokenCount: currentTokens,
    });
  }

  return chunks;
}

function getOverlapText(text: string, overlapTokens: number): string {
  const words = text.split(' ');
  const overlapWords = words.slice(-Math.ceil(overlapTokens / 4));
  return overlapWords.join(' ') + ' ';
}
