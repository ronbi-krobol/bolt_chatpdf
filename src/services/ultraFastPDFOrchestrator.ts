import { extractTextFromPDFStreaming, StreamingProgress } from './streamingPDFService';
import { semanticSplitIntoChunks, optimizedBatchForEmbedding, AdvancedTextChunk } from '../utils/advancedChunking';
import { generateEmbeddingsParallel } from './optimizedEmbeddingService';
import { storePDFFile, storeChunks } from './vectorSearchService';
import { cachePDFData } from './cacheService';

export interface UltraFastProgress {
  stage: 'extracting' | 'chunking' | 'embedding' | 'storing' | 'completed';
  progress: number;
  message: string;
  details?: {
    currentPage?: number;
    totalPages?: number;
    chunksProcessed?: number;
    totalChunks?: number;
    embeddingsGenerated?: number;
    totalEmbeddings?: number;
  };
  timestamp: number;
}

export interface ProcessingResult {
  fileId: string;
  extractedText: string;
  numPages: number;
  numChunks: number;
}

export async function processUltraFastPDF(
  file: File,
  onProgress?: (progress: UltraFastProgress) => void
): Promise<ProcessingResult> {
  const startTime = performance.now();

  try {
    let extractedText = '';
    let numPages = 0;

    await extractTextFromPDFStreaming(file, (streamProgress: StreamingProgress) => {
      onProgress?.({
        stage: 'extracting',
        progress: Math.floor(10 + (streamProgress.percentage * 0.3)),
        message: streamProgress.message,
        details: {
          currentPage: streamProgress.currentPage,
          totalPages: streamProgress.totalPages,
        },
        timestamp: Date.now(),
      });
    }).then((result) => {
      extractedText = result.text;
      numPages = result.numPages;
    });

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the PDF');
    }

    onProgress?.({
      stage: 'chunking',
      progress: 40,
      message: 'Creating smart chunks with semantic understanding...',
      timestamp: Date.now(),
    });

    const chunks = semanticSplitIntoChunks(extractedText);

    if (chunks.length === 0) {
      throw new Error('Failed to create chunks from extracted text');
    }

    onProgress?.({
      stage: 'chunking',
      progress: 45,
      message: `Created ${chunks.length} intelligent chunks`,
      details: {
        totalChunks: chunks.length,
      },
      timestamp: Date.now(),
    });

    onProgress?.({
      stage: 'embedding',
      progress: 50,
      message: `Generating embeddings for ${chunks.length} chunks...`,
      details: {
        totalEmbeddings: chunks.length,
        embeddingsGenerated: 0,
      },
      timestamp: Date.now(),
    });

    const chunkTexts = chunks.map((chunk) => chunk.text);
    const embeddings = await generateEmbeddingsParallel(
      chunkTexts,
      (completed, total) => {
        const embeddingProgress = 50 + Math.floor((completed / total) * 35);
        onProgress?.({
          stage: 'embedding',
          progress: embeddingProgress,
          message: `Generated ${completed} of ${total} embeddings...`,
          details: {
            totalEmbeddings: total,
            embeddingsGenerated: completed,
          },
          timestamp: Date.now(),
        });
      }
    );

    onProgress?.({
      stage: 'storing',
      progress: 85,
      message: 'Storing in vector database...',
      timestamp: Date.now(),
    });

    const pdfFileId = await storePDFFile(file.name, file.size);

    await cachePDFData(pdfFileId, file.name, extractedText, chunks);

    const chunksWithEmbeddings = chunks.map((chunk, index) => ({
      text: chunk.text,
      index: chunk.index,
      tokenCount: chunk.tokenCount,
      embedding: embeddings[index],
    }));

    await storeChunks(pdfFileId, chunksWithEmbeddings);

    const endTime = performance.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);

    onProgress?.({
      stage: 'completed',
      progress: 100,
      message: `Processing completed in ${totalTime}s!`,
      details: {
        totalPages: numPages,
        totalChunks: chunks.length,
      },
      timestamp: Date.now(),
    });

    return {
      fileId: pdfFileId,
      extractedText,
      numPages,
      numChunks: chunks.length,
    };
  } catch (error) {
    console.error('Error in ultra-fast PDF processing:', error);
    throw error;
  }
}

export async function batchProcessPDFs(
  files: File[],
  onProgress?: (fileIndex: number, fileProgress: UltraFastProgress) => void
): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await processUltraFastPDF(files[i], (progress) => {
      onProgress?.(i, progress);
    });
    results.push(result);
  }

  return results;
}
