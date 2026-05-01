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

// Parse function calls from AI response (handles both proper tool_calls and malformed text)
function parseFunctionCalls(content: string): { name: string; args: any }[] | null {
  const calls: { name: string; args: any }[] = [];

  if (!content || typeof content !== 'string') {
    return null;
  }

  // Try to parse <function=name [{...}]> format (malformed)
  const functionRegex = /<function=(\w+)\s*\[?([^\]]*)\]?>?<\/function>?/g;
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    const name = match[1];
    const argsStr = match[2] || '{}';
    if (!name) continue;
    try {
      const args = argsStr ? JSON.parse(argsStr) : {};
      calls.push({ name, args });
    } catch (e) {
      console.warn('Failed to parse function args:', argsStr);
    }
  }

  // Also try <function=name>JSON</function> format
  const altRegex = /<function=(\w+)>([^<]*)<\/function>/g;
  while ((match = altRegex.exec(content)) !== null) {
    const name = match[1];
    const argsStr = match[2];
    if (!name) continue;
    try {
      const args = argsStr ? JSON.parse(argsStr.trim()) : {};
      calls.push({ name, args });
    } catch (e) {
      console.warn('Failed to parse alt function args:', argsStr);
    }
  }

  // Handle malformed cases like {"limit": "100"}></function>
  const malformedRegex = /\{[^}]*\}><\/function>/g;
  while ((match = malformedRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    // Extract just the JSON part
    const jsonMatch = fullMatch.match(/(\{[^}]*\})/);
    if (jsonMatch) {
      try {
        const args = JSON.parse(jsonMatch[1]);
        // Infer function name from context or use default
        calls.push({ name: 'queryStudents', args });
      } catch (e) {
        console.warn('Failed to parse malformed function args:', jsonMatch[1]);
      }
    }
  }

  // Handle cases like <function=queryCourses={"courseId": "KNEC"}></function>
  const embeddedJsonRegex = /<function=(\w+)=({[^}]*})\s*\/?><\/function>?/g;
  while ((match = embeddedJsonRegex.exec(content)) !== null) {
    const name = match[1];
    const argsStr = match[2];
    if (!name) continue;
    try {
      const args = JSON.parse(argsStr);
      calls.push({ name, args });
    } catch (e) {
      console.warn('Failed to parse embedded JSON function args:', argsStr);
    }
  }

  return calls.length > 0 ? calls : null;
}

// Error types with actionable suggestions
const errorTypes: { [key: string]: { message: string; suggestion: string } } = {
  'PGRST116': {
    message: 'No records found matching your criteria.',
    suggestion: 'Try adjusting your search filters or check if the data exists in the system. If this is a new student/course, you may need to add them first.',
  },
  'PGRST301': {
    message: 'Database table does not exist.',
    suggestion: 'The required database table or view is missing. Please contact the system administrator to run the database migrations.',
  },
  '42703': {
    message: 'Database column not found.',
    suggestion: 'The database schema may be outdated. Please update the database structure or contact support.',
  },
  '23505': {
    message: 'Duplicate record detected.',
    suggestion: 'A record with this information already exists. Check the existing records before creating a new one.',
  },
  '23503': {
    message: 'Foreign key constraint violation.',
    suggestion: 'The referenced record (student, course, or class) does not exist. Please create the parent record first before adding related data.',
  },
  'connection_error': {
    message: 'Unable to connect to the database.',
    suggestion: 'Please check your internet connection and try again. If the problem persists, the database server may be temporarily unavailable.',
  },
  'timeout_error': {
    message: 'Database query timed out.',
    suggestion: 'The query is taking too long. Try narrowing your search criteria or try again later when the system is less busy.',
  },
};

// Validate data completeness
function validateDataCompleteness(data: any[], dataType: string): { isValid: boolean; issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (!data || data.length === 0) {
    return { isValid: true, issues: [], suggestions: [] };
  }

  data.forEach((record, index) => {
    // Check for null/undefined critical fields
    if (dataType === 'students' || dataType === 'applications') {
      if (!record.full_name) {
        issues.push(`Record ${index + 1}: Missing student name`);
        suggestions.push('Update the student profile with their full name.');
      }
      if (!record.admission_number && record.status === 'enrolled') {
        issues.push(`Record ${index + 1}: Enrolled student missing admission number`);
        suggestions.push('Assign an admission number to this enrolled student.');
      }
      if (record.status === 'enrolled' && !record.class_id) {
        issues.push(`Record ${index + 1}: Enrolled student not assigned to a class`);
        suggestions.push('Assign this student to a class using the class enrollment feature.');
      }
    }

    if (dataType === 'fees' || dataType === 'financials') {
      if (record.total_balance === null || record.total_balance === undefined) {
        issues.push(`Record ${index + 1}: Missing balance information`);
        suggestions.push('Update the student fee structure to calculate their balance.');
      }
      if (record.total_paid === null || record.total_paid === undefined) {
        issues.push(`Record ${index + 1}: Missing payment history`);
        suggestions.push('Record the student fee payments to track their payment status.');
      }
    }

    if (dataType === 'courses') {
      if (!record.name) {
        issues.push(`Record ${index + 1}: Course missing name`);
        suggestions.push('Update the course with a proper name.');
      }
      if (!record.course_types || record.course_types.length === 0) {
        issues.push(`Record ${index + 1}: Course has no types configured`);
        suggestions.push('Add course types (Diploma, Certificate, etc.) to this course.');
      }
    }
  });

  return {
    isValid: issues.length === 0,
    issues,
    suggestions: [...new Set(suggestions)], // Remove duplicates
  };
}

// Execute Supabase query based on function call with comprehensive error handling
async function executeSupabaseQuery(functionName: string, args: any) {
  try {
    let result: any = {};
    let dataType = '';

    switch (functionName) {
      case 'queryStudents':
        dataType = 'students';
        
        // Normalize campus value
        const normalizedCampus = args.campus?.toLowerCase().trim();
        
        let studentQuery = supabase
          .from('v_student_financials')
          .select('*, courses(name)')
          .limit(args.limit || 50);
        
        // Handle both 'main'/'west' and 'Main Campus'/'West Campus' formats
        if (normalizedCampus && normalizedCampus !== 'all') {
          const campusVariants = normalizedCampus.includes('west') 
            ? ['west', 'West Campus'] 
            : ['main', 'Main Campus'];
          studentQuery = studentQuery.in('campus', campusVariants);
        }
        if (args.status) {
          studentQuery = studentQuery.eq('status', args.status);
        }
        
        const { data: students, error: studentsError } = await studentQuery;
        
        if (studentsError) {
          const errorCode = (studentsError as any).code || 'unknown';
          const errorInfo = errorTypes[errorCode] || {
            message: `Database error: ${studentsError.message}`,
            suggestion: 'Please try again or contact support if the problem persists.',
          };
          return {
            error: true,
            errorType: 'database_error',
            message: errorInfo.message,
            suggestion: errorInfo.suggestion,
            technicalDetails: studentsError.message,
          };
        }

        // Calculate totals
        const totalBalance = students?.reduce((sum, s) => sum + (s.total_balance || 0), 0) || 0;
        const totalPaid = students?.reduce((sum, s) => sum + (s.total_paid || 0), 0) || 0;
        const totalFees = students?.reduce((sum, s) => sum + (s.total_fees || 0), 0) || 0;
        const studentCount = students?.length || 0;

        // Transform students to show course names instead of IDs
        const transformedStudents = students?.map(s => ({
          ...s,
          course_name: s.courses?.name || s.course_id || 'Unknown Course',
          course_id: undefined, // Remove raw ID
          courses: undefined, // Remove nested object
        }));

        result = { 
          students: transformedStudents, 
          summary: {
            totalStudents: studentCount,
            totalBalance,
            totalPaid,
            totalFees,
            campus: normalizedCampus || 'all',
          }
        };
        break;

      case 'queryFees':
        dataType = 'financials';
        const { data: payments, error: paymentsError } = await supabase
          .from('fee_payments')
          .select('*')
          .order('payment_date', { ascending: false })
          .limit(args.limit || 20);
        
        if (paymentsError) {
          return {
            error: true,
            errorType: 'database_error',
            message: 'Unable to retrieve payment records.',
            suggestion: 'Check if the fee_payments table exists and has the correct permissions.',
            technicalDetails: paymentsError.message,
          };
        }
        
        const { data: installments, error: installmentsError } = await supabase
          .from('payment_installments')
          .select('*')
          .order('due_date', { ascending: false })
          .limit(args.limit || 20);
        
        if (installmentsError) {
          console.warn('Installments query warning:', installmentsError);
        }
        
        const { data: financials, error: financialsError } = await supabase
          .from('v_student_financials')
          .select('*')
          .limit(args.limit || 20);
        
        if (financialsError) {
          console.warn('Financials view query warning:', financialsError);
        }
        
        result = { payments, installments, financials };
        break;

      case 'queryCourses':
        dataType = 'courses';
        let courseQuery = supabase
          .from('courses')
          .select('*, course_types(*)')
          .limit(args.limit || 20);
        
        if (args.courseId) {
          courseQuery = courseQuery.eq('id', args.courseId);
        }
        
        const { data: courses, error: coursesError } = await courseQuery;
        
        if (coursesError) {
          return {
            error: true,
            errorType: 'database_error',
            message: 'Unable to retrieve course information.',
            suggestion: 'Verify that the courses table exists and has the correct structure.',
            technicalDetails: coursesError.message,
          };
        }
        
        result = { courses };
        break;

      case 'queryLecturers':
        dataType = 'lecturers';
        let lecturerQuery = supabase
          .from('lecturers')
          .select('*')
          .limit(args.limit || 20);
        
        if (args.campus && args.campus !== 'all') {
          lecturerQuery = lecturerQuery.eq('campus', args.campus);
        }
        
        const { data: lecturers, error: lecturersError } = await lecturerQuery;
        
        if (lecturersError) {
          return {
            error: true,
            errorType: 'database_error',
            message: 'Unable to retrieve lecturer information.',
            suggestion: 'Check if the lecturers table exists and has proper permissions.',
            technicalDetails: lecturersError.message,
          };
        }
        
        result = { lecturers };
        break;

      case 'queryApplications':
        dataType = 'applications';
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
        
        const { data: applications, error: appError } = await appQuery;
        
        if (appError) {
          return {
            error: true,
            errorType: 'database_error',
            message: 'Unable to retrieve application records.',
            suggestion: 'Verify the applications table structure and permissions.',
            technicalDetails: appError.message,
          };
        }
        
        result = { applications };
        break;

      case 'querySystemLogs':
        let logQuery = supabase
          .from('system_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(args.limit || 50);
        
        if (args.logType) {
          logQuery = logQuery.eq('log_type', args.logType);
        }
        
        const { data: logs, error: logsError } = await logQuery;
        
        if (logsError) {
          return {
            error: true,
            errorType: 'database_error',
            message: 'Unable to retrieve system logs.',
            suggestion: 'Check if the system_logs table exists and has proper permissions.',
            technicalDetails: logsError.message,
          };
        }
        
        result = { logs };
        break;

      default:
        return {
          error: true,
          errorType: 'unknown_function',
          message: `Unknown query type: ${functionName}`,
          suggestion: 'Please try a different query or contact support.',
        };
    }

    // Validate data completeness
    const firstKey = Object.keys(result)[0];
    if (firstKey && Array.isArray(result[firstKey])) {
      const validation = validateDataCompleteness(result[firstKey], dataType);
      if (!validation.isValid) {
        result._validationIssues = validation.issues;
        result._validationSuggestions = validation.suggestions;
      }
    }

    // Check if data is empty
    const hasData = Object.values(result).some(
      (val) => Array.isArray(val) && val.length > 0
    );

    if (!hasData) {
      return {
        ...result,
        _info: {
          message: 'No records found.',
          suggestion: 'The database query completed successfully but returned no results. This could mean:\n1. No data exists matching your criteria\n2. The data has not been entered into the system yet\n3. You may need to add the missing information first.',
        },
      };
    }

    return result;
  } catch (error: any) {
    console.error('Supabase query error:', error);
    
    // Determine error type
    let errorType = 'unknown_error';
    let message = 'An unexpected error occurred while querying the database.';
    let suggestion = 'Please try again or contact support if the problem persists.';

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorType = 'connection_error';
      message = 'Unable to connect to the database server.';
      suggestion = 'Please check your internet connection and try again. The database server may be temporarily unavailable.';
    } else if (error.message?.includes('timeout')) {
      errorType = 'timeout_error';
      message = 'The database query took too long to complete.';
      suggestion = 'Try narrowing your search criteria or try again later when the system is less busy.';
    }

    return {
      error: true,
      errorType,
      message,
      suggestion,
      technicalDetails: error.message,
    };
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

ERROR HANDLING AND VALIDATION INSTRUCTIONS:

When you receive data from the database functions, carefully check for the following:

1. ERROR RESPONSES: If the function returns an error object (error: true), you MUST:
   - Explain the error to the user in plain, friendly language
   - Include the specific error message provided
   - Provide the actionable suggestion included in the response
   - Never say "I don't know" - explain what went wrong and how to fix it

2. VALIDATION ISSUES: If the response includes _validationIssues and _validationSuggestions:
   - List each specific issue found in the data
   - Explain what data is missing or incomplete
   - Provide the specific suggestions for fixing each issue
   - Guide the user on exactly what needs to be corrected in the system

3. EMPTY RESULTS: If the response includes _info with "No records found":
   - Explain that the query completed successfully but found no data
   - Suggest why the data might be missing (not entered yet, filtered out, etc.)
   - Provide guidance on how to add the missing information
   - Use phrases like: "I searched the database but didn't find any records. This could mean..."

4. INCOMPLETE DATA: If records are missing critical fields:
   - Identify exactly which fields are missing for which records
   - Explain why these fields are important
   - Provide step-by-step instructions on how to update the records
   - Example: "I found the student, but their fee payment status is missing. To fix this, please go to the student's profile and add their payment information."

ALWAYS:
- Be specific about what data is missing or incorrect
- Provide actionable steps the user can take to fix the issue
- Never guess or make up information if data is missing
- Guide users to the correct part of the system to make corrections
- Use friendly, helpful language while being precise about the problem

Never say "contact support" unless it's a technical database error. For data issues, guide users on how to fix the data themselves in the system.

FUNCTION CALLING INSTRUCTIONS:
You have access to database query functions listed in the "tools" section. When you need to fetch data from the database:
1. Use the function calling mechanism - do NOT generate text like "<function=...>"
2. The system will automatically detect and execute your function calls
3. Wait for the function results to be provided to you before responding
4. Do not invent data - always wait for actual database results

IMPORTANT: Do NOT output text like '<function=queryStudents>' in your response. The function calling is handled automatically by the system when you indicate which tool to use.

DATA PRESENTATION GUIDELINES:
- When showing student data, use the 'course_name' field (not course_id) to display the course name
- When asked about totals or aggregates, use the 'summary' object which contains:
  - totalStudents: number of students
  - totalBalance: sum of all balances
  - totalPaid: sum of all payments
  - totalFees: sum of all fees
  - campus: which campus was queried
- Always report the campus name correctly based on what was requested (Main vs West)
- Present financial totals clearly with proper currency formatting`;

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
    let parsedCalls: { name: string; args: any }[] | null = null;

    // First try proper tool_calls format
    if (aiMessage?.tool_calls && aiMessage.tool_calls.length > 0) {
      parsedCalls = aiMessage.tool_calls.map((tc: any) => ({
        name: tc.function.name,
        args: JSON.parse(tc.function.arguments),
      }));
    }
    // Fallback: parse malformed function calls from content
    else if (aiMessage?.content) {
      parsedCalls = parseFunctionCalls(aiMessage.content);
    }

    if (parsedCalls && parsedCalls.length > 0) {
      for (const call of parsedCalls) {
        // Skip calls without valid names
        if (!call.name || !supabaseFunctions[call.name as keyof typeof supabaseFunctions]) {
          console.warn('Skipping invalid function call:', call);
          continue;
        }
        try {
          const result = await executeSupabaseQuery(call.name, call.args);
          toolResults.push({ name: call.name, result });
        } catch (execError) {
          console.error('Error executing query:', call.name, execError);
          toolResults.push({ 
            name: call.name, 
            result: { 
              error: true, 
              message: 'Failed to execute database query',
              suggestion: 'Please try again with a different query.'
            } 
          });
        }
      }

      // Only make second call if we have valid results
      if (toolResults.length > 0) {
        try {
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
                {
                  role: 'assistant',
                  content: aiMessage?.content || '',
                },
                ...toolResults.map(tr => ({
                  role: 'tool' as const,
                  tool_call_id: 'call_fallback',
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
          } else {
            console.error('Second Groq call failed:', await secondGroqResponse.text());
            // Still return the raw data if second call fails
            aiResponse = `I retrieved the data but had trouble formatting the response. Here are the results:\n\n${JSON.stringify(toolResults, null, 2)}`;
          }
        } catch (secondCallError) {
          console.error('Error in second Groq call:', secondCallError);
          aiResponse = `I found the data but encountered an error. Raw results: ${JSON.stringify(toolResults)}`;
        }
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
