import { Groq } from 'groq-sdk';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

interface AIResponse {
  content: string;
  error?: string;
}

const SYSTEM_PROMPT = `You are an assistant for a school management system. Only use the provided context to answer. Do not guess or fabricate data. Keep responses short and conversational.`;

export async function generateResponse(
  userQuery: string,
  context: string,
  attempt: number = 1
): Promise<AIResponse> {
  const prompt = `${context}\n\nUser question: ${userQuery}`;

  // Try Groq first
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return {
        content: completion.choices[0]?.message?.content || 'No response generated',
      };
    } catch (err: any) {
      console.error('Groq error (attempt', attempt, '):', err.message);
      
      // Check if we should retry or fallback
      const isRateLimit = err.message?.includes('rate') || err.status === 429;
      if (isRateLimit && attempt < 3) {
        // Exponential backoff
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        return generateResponse(userQuery, context, attempt + 1);
      }
    }
  }

  // Fallback to Mistral
  if (process.env.MISTRAL_API_KEY) {
    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          content: data.choices[0]?.message?.content || 'No response generated',
        };
      }
    } catch (err: any) {
      console.error('Mistral fallback error:', err.message);
    }
  }

  // Both failed - return context directly
  return {
    content: context,
    error: 'AI services unavailable. Showing raw data.',
  };
}