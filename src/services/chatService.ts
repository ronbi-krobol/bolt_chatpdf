import { streamChatCompletion } from './openaiProxyService';
import { searchRelevantChunks } from './vectorSearchService';

export async function generateChatResponse(
  pdfFileId: string,
  userQuestion: string,
  onStream?: (chunk: string) => void
): Promise<string> {
  const relevantChunks = await searchRelevantChunks(pdfFileId, userQuestion, 8);

  const context = relevantChunks
    .map((chunk, index) => `[Chunk ${index + 1}]\n${chunk.chunk_text}`)
    .join('\n\n');

  const systemPrompt = `You are a helpful assistant that answers questions about the uploaded PDF document.
Use only the information from the provided context below.
If the answer cannot be found in the context, say so clearly.
Answer in clear bullet points when possible.

Context:
${context}`;

  let fullResponse = '';

  for await (const chunk of streamChatCompletion({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuestion },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  })) {
    fullResponse += chunk;
    if (onStream) {
      onStream(chunk);
    }
  }

  return fullResponse;
}
