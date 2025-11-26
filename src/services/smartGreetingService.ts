import { getOpenAIClient } from './optimizedEmbeddingService';

export interface SmartGreeting {
  summary: string;
  suggestedQuestions: Array<{
    question: string;
    icon: string;
    category: 'overview' | 'details' | 'analysis';
  }>;
  metadata: {
    documentType: string;
    keyTopics: string[];
    estimatedReadTime: number;
  };
}

export async function generateSmartGreeting(
  documentText: string,
  fileName: string
): Promise<SmartGreeting> {
  const client = getOpenAIClient();

  const sampleText = documentText.slice(0, 8000);

  const systemPrompt = `You are an expert document analyst. Your task is to:
1. Generate a brutally concise, information-dense summary (exactly 4-6 sentences) that captures the CORE essence
2. Generate exactly 3 perfect, specific questions that users would want to ask about this document
3. Identify the document type and key topics

Never be generic. Be surgical and precise. Focus on actionable insights.`;

  const userPrompt = `Document Title: ${fileName}

Content Preview:
${sampleText}

Generate:
1. A precise 4-6 sentence summary
2. Exactly 3 specific questions (not generic)
3. Document type (e.g., "Research Paper", "Contract", "Report", etc.)
4. Top 5 key topics

Format as JSON:
{
  "summary": "...",
  "questions": ["...", "...", "..."],
  "documentType": "...",
  "keyTopics": ["...", "...", "...", "...", "..."]
}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(content);

    const wordCount = documentText.split(/\s+/).length;
    const estimatedReadTime = Math.ceil(wordCount / 200);

    return {
      summary: parsed.summary,
      suggestedQuestions: [
        {
          question: parsed.questions[0],
          icon: '📊',
          category: 'overview',
        },
        {
          question: parsed.questions[1],
          icon: '🔍',
          category: 'details',
        },
        {
          question: parsed.questions[2],
          icon: '💡',
          category: 'analysis',
        },
      ],
      metadata: {
        documentType: parsed.documentType || 'Document',
        keyTopics: parsed.keyTopics || [],
        estimatedReadTime,
      },
    };
  } catch (error) {
    console.error('Error generating smart greeting:', error);

    return {
      summary: `This document titled "${fileName}" has been successfully processed and is ready for analysis. You can now ask any questions about its content.`,
      suggestedQuestions: [
        {
          question: 'What are the main topics covered in this document?',
          icon: '📊',
          category: 'overview',
        },
        {
          question: 'Can you summarize the key findings or conclusions?',
          icon: '🔍',
          category: 'details',
        },
        {
          question: 'What are the most important takeaways?',
          icon: '💡',
          category: 'analysis',
        },
      ],
      metadata: {
        documentType: 'Document',
        keyTopics: [],
        estimatedReadTime: Math.ceil(documentText.split(/\s+/).length / 200),
      },
    };
  }
}
