import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface PDFExtractionResult {
  text: string;
  numPages: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modDate?: Date;
  };
  tables?: string[];
  images?: number;
}

export interface StreamingProgress {
  stage: 'loading' | 'extracting' | 'parsing' | 'completed';
  currentPage: number;
  totalPages: number;
  percentage: number;
  message: string;
}

export async function extractTextFromPDFStreaming(
  file: File,
  onProgress?: (progress: StreamingProgress) => void
): Promise<PDFExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.({
    stage: 'loading',
    currentPage: 0,
    totalPages: 0,
    percentage: 5,
    message: 'Loading PDF document...',
  });

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const metadata = await pdf.getMetadata();
  const pdfMetadata = extractMetadata(metadata);

  onProgress?.({
    stage: 'extracting',
    currentPage: 0,
    totalPages: pdf.numPages,
    percentage: 10,
    message: `Extracting text from ${pdf.numPages} pages...`,
  });

  const extractionPromises: Promise<string>[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    extractionPromises.push(
      (async () => {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
          .map((item: any) => {
            if ('str' in item) {
              return item.str;
            }
            return '';
          })
          .join(' ');

        onProgress?.({
          stage: 'extracting',
          currentPage: pageNum,
          totalPages: pdf.numPages,
          percentage: 10 + Math.floor((pageNum / pdf.numPages) * 70),
          message: `Extracted page ${pageNum} of ${pdf.numPages}...`,
        });

        return pageText;
      })()
    );
  }

  const pageTexts = await Promise.all(extractionPromises);

  onProgress?.({
    stage: 'parsing',
    currentPage: pdf.numPages,
    totalPages: pdf.numPages,
    percentage: 85,
    message: 'Parsing and organizing content...',
  });

  const fullText = pageTexts.join('\n\n');

  onProgress?.({
    stage: 'completed',
    currentPage: pdf.numPages,
    totalPages: pdf.numPages,
    percentage: 100,
    message: 'Text extraction completed!',
  });

  return {
    text: fullText,
    numPages: pdf.numPages,
    metadata: pdfMetadata,
  };
}

function extractMetadata(metadata: any): PDFExtractionResult['metadata'] {
  const info = metadata?.info || {};

  return {
    title: info.Title || undefined,
    author: info.Author || undefined,
    subject: info.Subject || undefined,
    keywords: info.Keywords || undefined,
    creator: info.Creator || undefined,
    producer: info.Producer || undefined,
    creationDate: info.CreationDate ? parseDate(info.CreationDate) : undefined,
    modDate: info.ModDate ? parseDate(info.ModDate) : undefined,
  };
}

function parseDate(dateString: string): Date | undefined {
  try {
    const match = dateString.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
    if (match) {
      const [, year, month, day, hour, minute, second] = match;
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    }
  } catch (error) {
    console.error('Error parsing PDF date:', error);
  }
  return undefined;
}

export async function extractTablesFromPDF(file: File): Promise<string[]> {
  const tables: string[] = [];

  return tables;
}

export async function analyzeImagesInPDF(file: File): Promise<number> {
  return 0;
}
