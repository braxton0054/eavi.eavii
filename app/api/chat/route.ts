import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

// Supabase query functions for function calling
const supabaseFunctions = {
  queryStudents: {
    description: 'Query student information including financial data, balances, and enrollment status',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of records to return (default: 20)',
        },
        campus: {
          type: 'string',
          description: 'Filter by campus (main, west, or all)',
        },
        status: {
          type: 'string',
          description: 'Filter by status (enrolled, pending, rejected)',
        },
      },
    },
  },
  queryFees: {
    description: 'Query fee payments, balances, and installment information',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of records to return (default: 20)',
        },
        studentId: {
          type: 'string',
          description: 'Filter by specific student ID',
        },
      },
    },
  },
  queryCourses: {
    description: 'Query course information, types, and availability',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of records to return (default: 20)',
        },
        courseId: {
          type: 'string',
          description: 'Filter by specific course ID',
        },
      },
    },
  },
  queryLecturers: {
    description: 'Query lecturer information and assignments',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of records to return (default: 20)',
        },
        campus: {
          type: 'string',
          description: 'Filter by campus (main, west, or all)',
        },
      },
    },
  },
  queryApplications: {
    description: 'Query student applications and enrollment data',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of records to return (default: 20)',
        },
        status: {
          type: 'string',
          description: 'Filter by status (enrolled, pending, rejected)',
        },
        campus: {
          type: 'string',
          description: 'Filter by campus (main, west, or all)',
        },
      },
    },
  },
  querySystemLogs: {
    description: 'Query system logs for errors, warnings, and information',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of records to return (default: 50)',
        },
        logType: {
          type: 'string',
          description: 'Filter by log type (error, warning, info)',
        },
      },
    },
  },
};

// Execute Supabase query based on function call
async function executeSupabaseQuery(functionName: string, args: any) {
  try {
    switch (functionName) {
      case 'queryStudents':
        let studentQuery = supabase
          .from('v_student_financials')
          .select('*')
          .limit(args.limit || 20);
        
        if (args.campus && args.campus !== 'all') {
          studentQuery = studentQuery.eq('campus', args.campus);
        }
        if (args.status) {
          studentQuery = studentQuery.eq('status', args.status);
        }
        
        const { data: students } = await studentQuery;
        const { data: balances } = await supabase
          .from('v_student_balance')
          .select('*')
          .limit(args.limit || 20);
        
        return { students, balances };

      case 'queryFees':
        const { data: payments } = await supabase
          .from('fee_payments')
          .select('*')
          .order('payment_date', { ascending: false })
          .limit(args.limit || 20);
        
        const { data: installments } = await supabase
          .from('payment_installments')
          .select('*')
          .order('due_date', { ascending: false })
          .limit(args.limit || 20);
        
        const { data: financials } = await supabase
          .from('v_student_financials')
          .select('*')
          .limit(args.limit || 20);
        
        return { payments, installments, financials };

      case 'queryCourses':
        let courseQuery = supabase
          .from('courses')
          .select('*')
          .limit(args.limit || 20);
        
        if (args.courseId) {
          courseQuery = courseQuery.eq('id', args.courseId);
        }
        
        const { data: courses } = await courseQuery;
        const { data: courseTypes } = await supabase
          .from('course_types')
          .select('*')
          .limit(args.limit || 20);
        
        return { courses, courseTypes };

      case 'queryLecturers':
        let lecturerQuery = supabase
          .from('lecturers')
          .select('*')
          .limit(args.limit || 20);
        
        if (args.campus && args.campus !== 'all') {
          lecturerQuery = lecturerQuery.eq('campus', args.campus);
        }
        
        const { data: lecturers } = await lecturerQuery;
        return { lecturers };

      case 'queryApplications':
        let appQuery = supabase
          .from('applications')
          .select('*, courses(name), course_types(level)')
          .order('application_date', { ascending: false })
          .limit(args.limit || 20);
        
        if (args.status) {
          appQuery = appQuery.eq('status', args.status);
        }
        if (args.campus && args.campus !== 'all') {
          const campusVariants = [
            args.campus,
            args.campus === 'main' ? 'Main Campus' : args.campus === 'west' ? 'West Campus' : args.campus,
          ];
          appQuery = appQuery.in('campus', campusVariants);
        }
        
        const { data: applications } = await appQuery;
        return { applications };

      case 'querySystemLogs':
        let logQuery = supabase
          .from('system_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(args.limit || 50);
        
        if (args.logType) {
          logQuery = logQuery.eq('log_type', args.logType);
        }
        
        const { data: logs } = await logQuery;
        return { logs };

      default:
        return { error: 'Unknown function' };
    }
  } catch (error) {
    console.error('Supabase query error:', error);
    return { error: 'Query failed' };
  }
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
  const lowerMessage = message.toLowerCase();
  const problemKeywords = ['why', 'error', 'issue', 'not working', 'problem', 'incorrect', 'wrong', 'missing', 'fail', 'failed', 'broken', 'bug'];
  const isDiagnostic = problemKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (isDiagnostic) {
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

    const finalUserId = userId || '00000000-0000-0000-0000-000000000000';
    const finalCampus = campus || 'main';

    // Fetch AI memory
    const aiMemory = await fetchAIMemory(finalUserId, false);

    // Create or update user registry if doesn't exist
    if (!aiMemory.userRegistry) {
      await supabase.from('ai_user_registry').insert({
        auth_user_id: finalUserId,
        full_name: userName || 'Admin',
        email: 'admin@eavi.ac.ke',
        user_role: userRole || 'admin',
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

    if (aiMemory.chatHistory && aiMemory.chatHistory.length > 0) {
      memoryContext += '\n\nRecent Conversation:\n';
      aiMemory.chatHistory.forEach((msg: any) => {
        memoryContext += `${msg.role}: ${msg.message}\n`;
      });
    }

    const userContext = userRole || userName 
      ? `\n\nCURRENT USER CONTEXT:\n- Role: ${userRole || 'Unknown'}\n- Name: ${userName || 'Unknown'}\n- Campus: ${finalCampus}\n- User ID: ${finalUserId}\n\nIMPORTANT: You already know this user's role. DO NOT ask them to identify themselves or their role. Address them directly based on their role.`
      : '';

    const systemPrompt = `You are EAVI, an AI assistant for East Africa Vision Institute (EAVI) College school management system.${userContext}

You have direct access to the Supabase database through function calls. When users ask questions about students, fees, courses, lecturers, or any system data, use the available functions to query the database directly and provide accurate, real-time information.

${memoryContext ? `MEMORY CONTEXT:\n${memoryContext}` : ''}

Always use the provided functions to get accurate data from the database before answering questions. Do not make up or guess information.`;

    // Convert supabaseFunctions to OpenAI function format
    const tools = Object.entries(supabaseFunctions).map(([name, def]) => ({
      type: 'function' as const,
      function: {
        name,
        description: def.description,
        parameters: def.parameters,
      },
    }));

    // Call Groq API with function calling
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
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.text();
      console.error('Groq API error:', error);
      return NextResponse.json({ error: 'Failed to get response from AI' }, { status: 500 });
    }

    const groqData = await groqResponse.json();
    const aiMessage = groqData.choices[0]?.message;
    let aiResponse = aiMessage?.content || 'No response from AI';
    let toolResults: any[] = [];

    // Handle function calls
    if (aiMessage?.tool_calls) {
      for (const toolCall of aiMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        const result = await executeSupabaseQuery(functionName, functionArgs);
        toolResults.push({ name: functionName, result });
      }

      // Make second call with tool results
      const secondGroqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
            aiMessage,
            ...toolResults.map(tr => ({
              role: 'tool' as const,
              tool_call_id: aiMessage.tool_calls?.[0].id || '',
              content: JSON.stringify(tr.result),
            })),
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (secondGroqResponse.ok) {
        const secondGroqData = await secondGroqResponse.json();
        aiResponse = secondGroqData.choices[0]?.message?.content || aiResponse;
      }
    }

    // Save to memory (async, don't await)
    const registryId = aiMemory.userRegistry?.id;
    if (registryId) {
      saveChatHistory(registryId, message, aiResponse);
      extractAndSaveFacts(registryId, message, aiResponse);
    }
    updateIssueMemory(message, aiResponse);

    return NextResponse.json({ 
      response: aiResponse,
      toolResults,
      usedMemory: (aiMemory.longTermMemory?.length ?? 0) > 0 || (aiMemory.chatHistory?.length ?? 0) > 0,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
