import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

// Intent detection - check if user is asking about a problem/debug issue
function isDiagnosticQuestion(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const problemKeywords = [
    'why', 'error', 'issue', 'not working', 'problem', 'incorrect',
    'wrong', 'missing', 'fail', 'failed', 'broken', 'bug',
    'not adding', 'not showing', 'not loading', 'not saving',
    'disappear', 'gone', 'zero', 'empty', 'blank'
  ];
  return problemKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Dynamic data fetching based on question type
// ONLY use existing system tables and views - NEVER query non-existent tables
async function fetchRelevantData(message: string): Promise<{ data: any; dataType: string }> {
  const lowerMessage = message.toLowerCase();
  let data: any = null;
  let dataType = '';

  // Fee/payment related - use views and existing tables only
  if (lowerMessage.includes('fee') || lowerMessage.includes('payment') || lowerMessage.includes('balance') || lowerMessage.includes('adding')) {
    // Prefer views over raw tables when available
    const { data: studentFinancials } = await supabase
      .from('v_student_financials')
      .select('*')
      .limit(20);

    const { data: studentBalances } = await supabase
      .from('v_student_balance')
      .select('*')
      .limit(20);
    
    const { data: payments } = await supabase
      .from('fee_payments')
      .select('*')
      .order('payment_date', { ascending: false })
      .limit(20);

    const { data: installments } = await supabase
      .from('payment_installments')
      .select('*')
      .order('due_date', { ascending: false })
      .limit(20);

    data = { studentFinancials, studentBalances, payments, installments };
    dataType = 'fee_payment';
  }
  // Student related - use views only, never assume table names
  else if (lowerMessage.includes('student') || lowerMessage.includes('enroll') || lowerMessage.includes('admission')) {
    const { data: studentFinancials } = await supabase
      .from('v_student_financials')
      .select('*')
      .limit(20);

    const { data: studentBalances } = await supabase
      .from('v_student_balance')
      .select('*')
      .limit(20);

    data = { studentFinancials, studentBalances };
    dataType = 'student';
  }
  // Course related - use system-provided schema only
  else if (lowerMessage.includes('course') || lowerMessage.includes('unit') || lowerMessage.includes('module')) {
    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .limit(20);

    const { data: courseTypes } = await supabase
      .from('course_types')
      .select('*')
      .limit(20);

    data = { courses, courseTypes };
    dataType = 'course';
  }
  // Lecturer related
  else if (lowerMessage.includes('lecturer') || lowerMessage.includes('teacher')) {
    const { data: lecturers } = await supabase
      .from('lecturers')
      .select('*')
      .limit(20);

    data = { lecturers };
    dataType = 'lecturer';
  }
  // General - fetch overview data using views
  else {
    const { data: studentBalances } = await supabase
      .from('v_student_balance')
      .select('*')
      .limit(10);

    const { data: payments } = await supabase
      .from('fee_payments')
      .select('*')
      .order('payment_date', { ascending: false })
      .limit(10);

    data = { studentBalances, payments };
    dataType = 'general';
  }

  return { data, dataType };
}

// Fetch AI memory data for a user
async function fetchAIMemory(userId: string, isDiagnostic: boolean) {
  // Get user registry by auth_user_id
  const { data: userRegistry } = await supabase
    .from('ai_user_registry')
    .select('*')
    .eq('auth_user_id', userId)
    .single();

  const registryId = userRegistry?.id;

  // Get long-term memory
  const { data: longTermMemory } = await supabase
    .from('ai_long_term_memory')
    .select('*')
    .eq('user_id', registryId)
    .limit(20);

  // Get chat history (last 10 messages)
  const { data: chatHistory } = await supabase
    .from('ai_chat_history')
    .select('*')
    .eq('user_id', registryId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get user facts
  const { data: userFacts } = await supabase
    .from('ai_user_facts')
    .select('*')
    .eq('user_id', registryId)
    .limit(20);

  // Get system logs if diagnostic mode
  let systemLogs = null;
  let issueMemory = null;

  if (isDiagnostic) {
    const { data: logs } = await supabase
      .from('system_logs')
      .select('*')
      .in('log_type', ['error', 'warning'])
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: issues } = await supabase
      .from('ai_issue_memory')
      .select('*')
      .order('last_seen', { ascending: false })
      .limit(20);

    systemLogs = logs;
    issueMemory = issues;
  }

  return {
    userRegistry,
    longTermMemory,
    chatHistory: chatHistory?.reverse() || [], // Reverse to get chronological order
    userFacts,
    systemLogs,
    issueMemory
  };
}

// Save conversation to chat history
async function saveChatHistory(registryId: string, userMessage: string, aiResponse: string) {
  // Save user message
  await supabase.from('ai_chat_history').insert({
    user_id: registryId,
    role: 'user',
    message: userMessage
  });

  // Save AI response
  await supabase.from('ai_chat_history').insert({
    user_id: registryId,
    role: 'assistant',
    message: aiResponse
  });

  // Clean up old chat history (keep only last 50 messages per user)
  const { data: oldMessages } = await supabase
    .from('ai_chat_history')
    .select('id')
    .eq('user_id', registryId)
    .order('created_at', { ascending: false })
    .range(50, 1000);

  if (oldMessages && oldMessages.length > 0) {
    const idsToDelete = oldMessages.map(m => m.id);
    await supabase.from('ai_chat_history').delete().in('id', idsToDelete);
  }
}

// Extract and save important facts to long-term memory
async function extractAndSaveFacts(registryId: string, userMessage: string, aiResponse: string) {
  // Simple heuristic: if message contains "remember", "note", or AI confirms a fact
  const lowerMessage = userMessage.toLowerCase();
  const shouldRemember = lowerMessage.includes('remember') || 
                          lowerMessage.includes('note') ||
                          lowerMessage.includes('my ') ||
                          aiResponse.toLowerCase().includes('i\'ll remember');

  if (shouldRemember) {
    // Extract key-value pairs (simple implementation)
    const factKey = userMessage.substring(0, 50);
    await supabase.from('ai_user_facts').insert({
      user_id: registryId,
      fact_key: factKey,
      fact_value: aiResponse
    });
  }
}

// Update issue memory if discussing a problem
async function updateIssueMemory(message: string, aiResponse: string) {
  if (isDiagnosticQuestion(message)) {
    // Check if similar issue exists
    const { data: existingIssues } = await supabase
      .from('ai_issue_memory')
      .select('*')
      .ilike('description', `%${message.substring(0, 30)}%`)
      .limit(5);

    if (existingIssues && existingIssues.length > 0) {
      // Update occurrence count
      await supabase
        .from('ai_issue_memory')
        .update({ 
          occurrences: existingIssues[0].occurrences + 1,
          last_seen: new Date().toISOString()
        })
        .eq('id', existingIssues[0].id);
    } else {
      // Create new issue entry
      await supabase.from('ai_issue_memory').insert({
        issue_type: 'system_error',
        description: message.substring(0, 200),
        root_cause: aiResponse.substring(0, 200),
        solution: aiResponse.substring(0, 200),
        occurrences: 1
      });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId, campus, userRole, userName } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Use provided userId and campus (admin is already authenticated in dashboard)
    // For testing, use defaults if not provided
    const finalUserId = userId || '00000000-0000-0000-0000-000000000000';
    const finalCampus = campus || 'main';
    const isDiagnostic = isDiagnosticQuestion(message);
    const { data, dataType } = await fetchRelevantData(message);

    // Fetch AI memory
    const aiMemory = await fetchAIMemory(finalUserId, isDiagnostic);

    // Create or update user registry if doesn't exist
    if (!aiMemory.userRegistry) {
      await supabase.from('ai_user_registry').insert({
        auth_user_id: finalUserId,
        full_name: 'Admin',
        email: 'admin@eavi.ac.ke',
        user_role: 'admin',
        campus: finalCampus
      });
    }

    // Build system prompt with memory context
    let memoryContext = '';
    
    if (aiMemory.userFacts && aiMemory.userFacts.length > 0) {
      memoryContext += '\n\nUser Facts I Remember:\n';
      aiMemory.userFacts.forEach((mem: any) => {
        memoryContext += `- ${mem.fact_key}: ${mem.fact_value}\n`;
      });
    }

    if (aiMemory.longTermMemory && aiMemory.longTermMemory.length > 0) {
      memoryContext += '\n\nLong-term Memory:\n';
      aiMemory.longTermMemory.forEach((mem: any) => {
        memoryContext += `- ${mem.memory_key}: ${mem.memory_value}\n`;
      });
    }

    if (aiMemory.chatHistory && aiMemory.chatHistory.length > 0) {
      memoryContext += '\n\nRecent Conversation:\n';
      aiMemory.chatHistory.forEach((msg: any) => {
        memoryContext += `${msg.role}: ${msg.message}\n`;
      });
    }

    if (isDiagnostic && aiMemory.systemLogs) {
      memoryContext += `\n\nRecent System Logs (${aiMemory.systemLogs.length} entries):\n`;
      aiMemory.systemLogs.slice(0, 10).forEach((log: any) => {
        memoryContext += `[${log.log_type}] ${log.module}: ${log.message}\n`;
      });
    }

    if (isDiagnostic && aiMemory.issueMemory) {
      memoryContext += `\n\nPast Similar Issues:\n`;
      aiMemory.issueMemory.slice(0, 5).forEach((issue: any) => {
        memoryContext += `- ${issue.description} (occurred ${issue.occurrences} times)\n`;
      });
    }

    let systemPrompt = '';
    let responseLabel = '';
    const usedMemory = (aiMemory.longTermMemory?.length ?? 0) > 0 || (aiMemory.chatHistory?.length ?? 0) > 0;

    // Build user context for the AI
    const userContext = userRole || userName 
      ? `\n\nCURRENT USER CONTEXT:\n- Role: ${userRole || 'Unknown'}\n- Name: ${userName || 'Unknown'}\n- Campus: ${finalCampus}\n- User ID: ${finalUserId}\n\nIMPORTANT: You already know this user's role. DO NOT ask them to identify themselves or their role. Address them directly based on their role.`
      : '';

    // Build the comprehensive EAVI system prompt
    const basePrompt = `====================================================
EAST AFRICA VISION INSTITUTE (EAVI) – AI SYSTEM PROMPT
====================================================

YOU ARE: EAVI (AI CHATBOT FOR EAVI COLLEGE)${userContext}

----------------------------------------------------
1. INSTITUTION KNOWLEDGE BASE (STATIC CONTEXT)
----------------------------------------------------

East Africa Vision Institute (EAVI), commonly referred to as EAVI College, is a private technical training institution located in Eldoret, Kenya. It is accredited by TVETA (Technical and Vocational Education and Training Authority) and provides various certificate and diploma programs.

CAMPUS LOCATIONS:
- Main Campus: City Plaza, next to Bandaptai Hotel
- West Campus: Mailinne, next to Kapyemit Dispensary
- Town Office: Skymart Building, 1st Floor (Room F45), behind Equity Bank (Market Branch)

COURSES OFFERED:
- Health Sciences: Clinical Medicine (3 years), Community Health & Nutrition, Counseling Psychology
- Engineering & Technology: Electrical Engineering, Civil Engineering, Computer Engineering, Plumbing, ICT
- Business & Management: Business Administration, Supply Chain Management, Storekeeping, Accountancy
- Social Sciences: Creative Arts & Design, Social Work, Community Development
- Vocational Courses: Fashion Design, Beauty Therapy, Hairdressing, First Aid (Red Cross partnership)

ADMISSIONS:
- Diploma requirement: KCSE C- or above
- Certificate requirement: KCSE D or above
- Intakes: January, May, September (also July & November for selected courses)
- Flexible learning: full-time, part-time, online/distance learning
- Bursaries available upon application

CONTACT:
- Phone/WhatsApp: 0726 044 022 / 0748 022 044
- Email: registrar@eavi.ac.ke / support@eastafricavisioninstitute.ac.ke
- Website: https://eastafricavisioninstitute.ac.ke/

----------------------------------------------------
2. SYSTEM ROLE
----------------------------------------------------

You are an internal AI assistant for EAVI College school management system.

You help:
- Students
- Lecturers
- Admin staff

You handle:
- admissions
- fees
- attendance
- courses
- system issues
- reports
- student records

----------------------------------------------------
3. SYSTEM STACK AWARENESS
----------------------------------------------------

You operate using:
- Next.js frontend + API routes
- Supabase database
- Groq AI engine

You NEVER access database directly.
You only analyze data sent to you by backend.

----------------------------------------------------
4. STRICT RULE: CLOSED SYSTEM ONLY
----------------------------------------------------

YOU MUST FOLLOW:

- You ONLY use provided system data
- You NEVER use external knowledge or internet facts
- You NEVER guess or assume missing data
- You NEVER hallucinate records

If data is missing, respond:
"I don't have that information in the system. Please provide the relevant records."

----------------------------------------------------
5. MEMORY SYSTEM (SUPABASE)
----------------------------------------------------

You may use:

- ai_user_registry (user identity: admin, lecturer, staff, student)
- ai_long_term_memory (preferences, notes, behavior)
- ai_chat_history (recent chat context)
- system_logs (errors, warnings, system info)
- ai_issue_memory (known system issues + solutions)
- ai_user_facts (quick facts)

${memoryContext ? `CURRENT MEMORY CONTEXT:\n${memoryContext}` : ''}

----------------------------------------------------
6. AUTO DEBUG MODE
----------------------------------------------------

${isDiagnostic ? `DEBUG MODE IS ACTIVE - Analyzing system issue.

The user asked: "${message}"

RELEVANT SYSTEM DATA:
${JSON.stringify(data, null, 2)}

OUTPUT FORMAT:
Possible Issue:
Cause:
Evidence:
Suggested Fix:

If uncertain:
"I need to verify this in the system data."` : ''}

----------------------------------------------------
7. MEMORY WRITING RULES
----------------------------------------------------

ALWAYS:
- Save user preferences → ai_long_term_memory
- Save chat → ai_chat_history (last 10–20 messages only)
- Save system issues → ai_issue_memory
- Save errors → system_logs

NEVER:
- store unnecessary data
- duplicate memory
- store full raw dumps

----------------------------------------------------
8. UI BEHAVIOR (NEXT.JS CHATBOT)
----------------------------------------------------

Show:
- "Analyzing system..." during processing
- "Checking memory..." when using memory
- "System analysis mode active" in debug mode

FORMAT:
- Normal answers → chat bubbles
- Debug responses → structured blocks

----------------------------------------------------
9. DATA PRIVACY RULES
----------------------------------------------------

- All student/staff data is confidential
- Never expose raw database structure
- Only return relevant filtered results
- Never leak system internals unless admin requests

----------------------------------------------------
10. RESPONSE STYLE
----------------------------------------------------

- Clear, short, professional
- No unnecessary explanations
- Structured answers for system issues
- Simple language unless technical user

----------------------------------------------------
11. FINAL SYSTEM RULE
----------------------------------------------------

EAVI is a CLOSED intelligent school system assistant.

It exists ONLY to:
- manage internal school operations
- analyze system data
- support admin decisions
- debug system issues

It MUST NEVER answer external or general world knowledge questions.

====================================================
END OF PROMPT
====================================================`;

    if (isDiagnostic) {
      responseLabel = 'System Analysis';
      systemPrompt = basePrompt;
    } else {
      responseLabel = 'Information';
      systemPrompt = basePrompt + `\n\nUSER QUESTION: "${message}"\n\nRELEVANT SYSTEM DATA:\n${JSON.stringify(data, null, 2)}`;
    }

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: isDiagnostic ? 0.3 : 0.5,
        max_tokens: isDiagnostic ? 800 : 500,
      }),
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.text();
      console.error('Groq API error:', error);
      return NextResponse.json({ error: 'Failed to get response from AI' }, { status: 500 });
    }

    const groqData = await groqResponse.json();
    const aiResponse = groqData.choices[0]?.message?.content || 'No response from AI';

    // Save to memory (async, don't await)
    const registryId = aiMemory.userRegistry?.id;
    if (registryId) {
      saveChatHistory(registryId, message, aiResponse);
      extractAndSaveFacts(registryId, message, aiResponse);
    }
    updateIssueMemory(message, aiResponse);

    return NextResponse.json({ 
      response: aiResponse,
      isDiagnostic,
      responseLabel,
      dataType,
      usedMemory
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
