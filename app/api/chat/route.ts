// app/api/chat/route.ts
// Drop this file into your existing Next.js app at the same path.
// It handles all chatbot messages, persists history in ai_chat_history,
// and queries your Supabase DB for live data.
//
// Uses NVIDIA NIM API (OpenAI-compatible) — set NVIDIA_API_KEY in .env.local

import { NextRequest, NextResponse } from "next/server";

// NVIDIA NIM uses an OpenAI-compatible endpoint
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODEL = "meta/llama-3.1-70b-instruct";

// System prompt built from your actual EAVI schema
const SYSTEM_PROMPT = `You are EAVI College Assistant — a helpful, friendly, and professional AI chatbot for EAVI College management system.

You will be given structured data fetched from the college database as context alongside user questions. Use it to answer accurately.

## YOUR CAPABILITIES
- Check fee balances, payment history, and installment status for the currently logged in student
- Retrieve course and department information
- Check academic calendar, term dates, exam schedules
- Show announcements relevant to the user
- Answer questions about course requirements and qualification levels
- Provide general college information (contacts, location, application process)

## DATABASE SCHEMA (for context)
- applications: student records (admission_number, full_name, course_id, total_balance, student_status, current_module, current_semester, financial_hold)
- fee_payments: payment records (amount, payment_date, payment_type, status, receipt_number)
- payment_installments: fee schedule (due_date, amount, status, paid_date)
- courses: course catalog (name, department_id, exam_body, fee_per_semester)
- departments: department list
- academic_calendar: term dates, exam dates, intake periods
- lecturers: lecturer info
- announcements: college notices
- classes: class info per course/intake

## RESPONSE RULES
1. Always be warm but professional — you represent EAVI College
2. For financial queries, always show KES amounts clearly (e.g. "KES 12,500")
3. **SECURITY — STRICT PRIVACY RULE:** You can ONLY show personal/financial data about the CURRENTLY AUTHENTICATED user. You CANNOT look up or reveal any data about other students by name, admission number, or any other identifier. If someone asks about another student, say: "I can only show information for the currently logged in account. Please contact the admin office for other students' records."
4. **IDENTITY VERIFICATION:** If someone asks for their own data, you must ask for their admission number AND phone number to verify before revealing any balance or fee information. Say: "For security, please confirm your admission number and phone number."
5. If you can't find data, say so clearly and suggest who to contact (e.g. "Please visit the finance office")
6. Keep responses concise and scannable — use short bullet points for lists
7. For any sensitive action (payments, enrollment changes), direct them to the appropriate office
8. Always confirm what data you found before giving advice based on it

## TONE
Friendly, helpful, and efficient. Like a knowledgeable college registrar who genuinely wants to help students succeed.

## COLLEGE CONTACT INFO
- Main Campus: City Plaza next to Bandaptai hotel, Eldoret. Phone: 0726044022
- West Campus: Mailinne next to Kapyemit Dispensary, Eldoret. Phone: 0748022044
- Town Office: Skymart Building, 1st Floor Room F45, Next to Raiya Supermarket, Eldoret town
- Website: eastafricavisioninstitute.ac.ke
- Email: info@eastafricavisioninstitute.ac.ke (or admin for specific inquiries)
- Intake is ongoing — minimum grade D- and above can apply
- Apply online: visit /apply on the college portal and fill the application form
- Apply via WhatsApp: send name, course, grade, and phone number to 0726044022`;

// ---------- Supabase helper (server-side direct REST queries) ----------
async function querySupabase(table: string, params: string): Promise<unknown[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];

  const res = await fetch(`${url}/rest/v1/${table}?${params}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return [];
  return res.json();
}

// Fetch relevant DB context based on the user's message and userId
async function fetchDbContext(message: string, userId: string): Promise<string> {
  const lower = message.toLowerCase();
  const parts: string[] = [];

  try {
    // Always pull the student's own record if they exist in applications
    if (
      lower.includes("fee") || lower.includes("balance") || lower.includes("payment") ||
      lower.includes("owe") || lower.includes("installment") || lower.includes("due") ||
      lower.includes("my") || lower.includes("status") || lower.includes("course") ||
      lower.includes("semester") || lower.includes("module")
    ) {
      const students = await querySupabase(
        "applications",
        `select=admission_number,full_name,course_id,total_balance,student_status,current_module,current_semester,financial_hold,last_payment_date,campus&id=eq.${userId}&limit=1`
      );
      if (students.length) {
        parts.push(`STUDENT RECORD:\n${JSON.stringify(students[0], null, 2)}`);

        // Fee payments
        if (lower.includes("payment") || lower.includes("paid") || lower.includes("receipt") || lower.includes("history")) {
          const payments = await querySupabase(
            "fee_payments",
            `select=amount,payment_date,payment_type,status,receipt_number,payment_method&application_id=eq.${userId}&order=payment_date.desc&limit=10`
          );
          if (payments.length) parts.push(`RECENT PAYMENTS:\n${JSON.stringify(payments, null, 2)}`);
        }

        // Installments
        if (lower.includes("installment") || lower.includes("due") || lower.includes("schedule") || lower.includes("next")) {
          const installments = await querySupabase(
            "payment_installments",
            `select=installment_number,due_date,amount,status,paid_date,late_fee&application_id=eq.${userId}&order=due_date.asc&limit=10`
          );
          if (installments.length) parts.push(`PAYMENT SCHEDULE:\n${JSON.stringify(installments, null, 2)}`);
        }
      }
    }

    // Courses
    if (lower.includes("course") || lower.includes("department") || lower.includes("program") || lower.includes("study")) {
      const courses = await querySupabase(
        "courses",
        `select=name,exam_body,fee_per_semester,is_active&is_active=eq.true&limit=20`
      );
      if (courses.length) parts.push(`AVAILABLE COURSES:\n${JSON.stringify(courses, null, 2)}`);
    }

    // Academic calendar
    if (lower.includes("term") || lower.includes("calendar") || lower.includes("exam") || lower.includes("intake") || lower.includes("cat") || lower.includes("date")) {
      const calendar = await querySupabase(
        "academic_calendar",
        `select=academic_year,term,term_name,term_start_date,term_end_date,intake_start_date,intake_end_date,cat_opening_date,cat_closing_date,end_term_exam_date&order=term_start_date.desc&limit=6`
      );
      if (calendar.length) parts.push(`ACADEMIC CALENDAR:\n${JSON.stringify(calendar, null, 2)}`);
    }

    // Announcements
    if (lower.includes("announcement") || lower.includes("notice") || lower.includes("news") || lower.includes("update")) {
      const announcements = await querySupabase(
        "announcements",
        `select=title,body,category,publish_at&order=publish_at.desc&limit=5`
      );
      if (announcements.length) parts.push(`ANNOUNCEMENTS:\n${JSON.stringify(announcements, null, 2)}`);
    }
  } catch (err) {
    console.error("DB context fetch error:", err);
  }

  return parts.length
    ? `\n\n--- LIVE DATABASE CONTEXT ---\n${parts.join("\n\n")}\n--- END CONTEXT ---`
    : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, userId, history = [] } = body;

    if (!message || !userId) {
      return NextResponse.json(
        { error: "message and userId are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "NVIDIA_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Fetch relevant DB data and inject as context
    const dbContext = await fetchDbContext(message, userId);
    const userMessageWithContext = dbContext
      ? `${message}\n\n[System note: Use the following live data to answer accurately]${dbContext}`
      : message;

    // Build OpenAI-format messages
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((h: { role: string; message: string }) => ({
        role: h.role as "user" | "assistant",
        content: h.message,
      })),
      { role: "user", content: userMessageWithContext },
    ];

    // Call NVIDIA NIM API (OpenAI-compatible)
    const response = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages,
        max_tokens: 1024,
        temperature: 0.5,
        top_p: 0.9,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("NVIDIA API error:", err);
      return NextResponse.json(
        { error: "AI service unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();

    // OpenAI-compatible response format
    const assistantMessage =
      data.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a response. Please try again.";

    // Persist to ai_chat_history via Supabase REST (server-side)
    // This uses your existing Supabase env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/ai_chat_history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify([
          { user_id: userId, role: "user", message },
          { user_id: userId, role: "assistant", message: assistantMessage },
        ]),
      });
    }

    return NextResponse.json({ reply: assistantMessage });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: load chat history for a user
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ history: [] });
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/ai_chat_history?user_id=eq.${userId}&order=created_at.asc&limit=50`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  const history = await res.json();
  return NextResponse.json({ history: history || [] });
}
