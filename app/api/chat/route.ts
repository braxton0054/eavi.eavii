import { NextRequest, NextResponse } from 'next/server';
import { detectIntent } from '@/lib/chat/intent-detector';
import { getDataForIntent } from '@/lib/chat/data-retriever';
import { generateResponse } from '@/lib/chat/ai-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message: userMessage, userId, campus } = body;

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Step 1: Detect intent
    const intentResult = detectIntent(userMessage);

    // Step 2: Retrieve relevant data (not full database)
    const { context, data } = await getDataForIntent(intentResult.intent, intentResult.entities);

    // Step 3: Generate AI response with minimal context
    const aiResponse = await generateResponse(userMessage, context);

    return NextResponse.json({
      response: aiResponse.content,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      data,
      ...(aiResponse.error && { warning: aiResponse.error }),
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}