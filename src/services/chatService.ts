import { getOpenAIClient } from './embeddingService';
import { searchRelevantChunks, RelevantChunk } from './vectorSearchService';

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

  const client = getOpenAIClient();

  const stream = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuestion },
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 1000,
  });

  let fullResponse = '';

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullResponse += content;
      if (onStream) {
        onStream(content);
      }
    }
  }

  return fullResponse;
}
