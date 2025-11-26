import { extractTextFromPDF } from './pdfService';
import { splitIntoChunks } from '../utils/textChunking';
import { generateEmbeddings } from './embeddingService';
import { storePDFFile, storeChunks } from './vectorSearchService';

export interface ProcessingProgress {
  stage: 'extracting' | 'chunking' | 'embedding' | 'storing' | 'completed';
  progress: number;
  message: string;
}

export async function processPDF(
  file: File,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<string> {
  try {
    onProgress?.({
      stage: 'extracting',
      progress: 10,
      message: 'Extracting text from PDF...',
    });

    const { text } = await extractTextFromPDF(file);

    onProgress?.({
      stage: 'chunking',
      progress: 30,
      message: 'Splitting text into chunks...',
    });

    const chunks = splitIntoChunks(text);

    if (chunks.length === 0) {
      throw new Error('No text could be extracted from the PDF');
    }

    onProgress?.({
      stage: 'embedding',
      progress: 50,
      message: `Generating embeddings for ${chunks.length} chunks...`,
    });

    const chunkTexts = chunks.map((chunk) => chunk.text);
    const embeddings = await generateEmbeddings(chunkTexts);

    onProgress?.({
      stage: 'storing',
      progress: 80,
      message: 'Storing chunks in database...',
    });

    const pdfFileId = await storePDFFile(file.name, file.size);

    const chunksWithEmbeddings = chunks.map((chunk, index) => ({
      text: chunk.text,
      index: chunk.index,
      tokenCount: chunk.tokenCount,
      embedding: embeddings[index],
    }));

    await storeChunks(pdfFileId, chunksWithEmbeddings);

    onProgress?.({
      stage: 'completed',
      progress: 100,
      message: 'Processing completed!',
    });

    return pdfFileId;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw error;
  }
}
