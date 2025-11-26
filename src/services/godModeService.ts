import { chatCompletion } from './openaiProxyService';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

export interface GodModeFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  action: (documentText: string, fileName: string) => Promise<void>;
}

export async function summarizeEntireDocument(
  documentText: string,
  onProgress?: (progress: string) => void
): Promise<string> {

  onProgress?.('Analyzing document structure...');

  const maxChunkSize = 12000;
  const chunks: string[] = [];

  for (let i = 0; i < documentText.length; i += maxChunkSize) {
    chunks.push(documentText.slice(i, i + maxChunkSize));
  }

  onProgress?.(`Processing ${chunks.length} sections...`);

  const summaries: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(`Summarizing section ${i + 1}/${chunks.length}...`);

    const response = await chatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating concise, comprehensive summaries. Extract key points and main ideas.',
        },
        {
          role: 'user',
          content: `Summarize the following text concisely:\n\n${chunks[i]}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    summaries.push(response.choices[0]?.message?.content || '');
  }

  if (summaries.length > 1) {
    onProgress?.('Creating final summary...');

    const finalResponse = await chatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Synthesize these section summaries into one comprehensive executive summary.',
        },
        {
          role: 'user',
          content: summaries.join('\n\n'),
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    return finalResponse.choices[0]?.message?.content || summaries.join('\n\n');
  }

  return summaries[0] || 'Unable to generate summary.';
}

export async function extractTablesToExcel(
  documentText: string,
  fileName: string
): Promise<void> {
  const response = await chatCompletion({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Extract all tables from the text and format them as JSON arrays. Return format: {"tables": [{"title": "...", "data": [[row1], [row2], ...]}]}',
      },
      {
        role: 'user',
        content: `Extract all tables from this document:\n\n${documentText.slice(0, 15000)}`,
      },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0]?.message?.content || '{"tables":[]}');

  if (!result.tables || result.tables.length === 0) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['No tables found in document']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Info');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `${fileName}-tables.xlsx`);
    return;
  }

  const wb = XLSX.utils.book_new();

  result.tables.forEach((table: any, index: number) => {
    const sheetName = table.title?.slice(0, 30) || `Table ${index + 1}`;
    const ws = XLSX.utils.aoa_to_sheet(table.data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `${fileName}-tables.xlsx`);
}

export async function generateQuizMCQ(
  documentText: string,
  numberOfQuestions: number = 10
): Promise<any> {
  const sampleText = documentText.slice(0, 10000);

  const response = await chatCompletion({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Generate ${numberOfQuestions} multiple choice questions based on the document. Include 4 options per question and indicate the correct answer. Format as JSON: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "..."}]}`,
      },
      {
        role: 'user',
        content: `Create quiz questions from:\n\n${sampleText}`,
      },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0]?.message?.content || '{"questions":[]}');
}

export async function createPresentationSlides(
  documentText: string,
  fileName: string
): Promise<void> {
  const response = await chatCompletion({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Create a presentation outline with 8-12 slides. Each slide should have a title and 3-5 bullet points. Format as JSON: {"slides": [{"title": "...", "bullets": ["...", "..."]}]}',
      },
      {
        role: 'user',
        content: `Create presentation slides from:\n\n${documentText.slice(0, 10000)}`,
      },
    ],
    temperature: 0.5,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0]?.message?.content || '{"slides":[]}');

  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  result.slides.forEach((slide: any, index: number) => {
    if (index > 0) doc.addPage();

    doc.setFillColor(240, 240, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(slide.title, pageWidth / 2, 40, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    let yPos = 80;

    slide.bullets.forEach((bullet: string) => {
      const lines = doc.splitTextToSize(`• ${bullet}`, pageWidth - 60);
      doc.text(lines, 30, yPos);
      yPos += lines.length * 10 + 5;
    });

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`${index + 1} / ${result.slides.length}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  });

  doc.save(`${fileName}-presentation.pdf`);
}

export async function extractEntities(documentText: string): Promise<any> {
  const response = await chatCompletion({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Extract all emails, phone numbers, dates, monetary amounts, and names from the text. Format as JSON: {"emails": [], "phones": [], "dates": [], "amounts": [], "names": []}',
      },
      {
        role: 'user',
        content: `Extract entities from:\n\n${documentText.slice(0, 15000)}`,
      },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0]?.message?.content || '{}');
}

export async function comparePDFs(text1: string, text2: string): Promise<string> {
  const response = await chatCompletion({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Compare these two documents and identify: 1) Key differences, 2) Common themes, 3) Unique points in each. Be specific and concise.',
      },
      {
        role: 'user',
        content: `Document 1:\n${text1.slice(0, 8000)}\n\nDocument 2:\n${text2.slice(0, 8000)}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  });

  return response.choices[0]?.message?.content || 'Unable to compare documents.';
}

export async function generateAnkiFlashcards(documentText: string): Promise<any> {
  const response = await chatCompletion({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Create 15-20 Anki flashcards from the content. Format as JSON: {"cards": [{"front": "question", "back": "answer"}]}',
      },
      {
        role: 'user',
        content: `Create flashcards from:\n\n${documentText.slice(0, 10000)}`,
      },
    ],
    temperature: 0.6,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0]?.message?.content || '{"cards":[]}');
}

export async function generateMindMap(documentText: string): Promise<string> {
  const response = await chatCompletion({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Create a mind map in Mermaid syntax showing the main topic, subtopics, and key points.',
      },
      {
        role: 'user',
        content: `Create a mind map from:\n\n${documentText.slice(0, 8000)}`,
      },
    ],
    temperature: 0.5,
  });

  return response.choices[0]?.message?.content || '';
}

export async function explainLikeIm10(documentText: string): Promise<string> {
  const response = await chatCompletion({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Explain this document in simple language that a 10-year-old would understand. Use analogies and examples.',
      },
      {
        role: 'user',
        content: documentText.slice(0, 10000),
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content || '';
}

export async function convertToMarkdown(documentText: string): Promise<string> {
  const response = await chatCompletion({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Convert this document to clean, well-formatted Markdown with proper headers, lists, and emphasis.',
      },
      {
        role: 'user',
        content: documentText.slice(0, 15000),
      },
    ],
    temperature: 0.2,
  });

  return response.choices[0]?.message?.content || '';
}

export async function findContradictions(documentText: string): Promise<string> {
  const response = await chatCompletion({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Analyze this document for contradictions, inconsistencies, risks, and potential legal issues. Be thorough and specific.',
      },
      {
        role: 'user',
        content: documentText.slice(0, 15000),
      },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  });

  return response.choices[0]?.message?.content || '';
}
