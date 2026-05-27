# EAVI — East Africa Vision Institute

> **College Management System** built with Next.js 16 + Supabase

## ⚡ Quick Context

- **Project path:** `/root/eavi.eavii`
- **App URL:** `https://office-dashboard.vercel.app`
- **Supabase URL:** `https://wgbaadgxtjyhpnntogzf.supabase.co`
- **Supabase MCP:** Configured in `/root/.mcp.json` → project ref `wgbaadgxtjyhpnntogzf`
- **Landing page:** `https://eavi.shop` (separate from the dashboard)

## 🏗️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, shadcn/Radix UI |
| Backend | Supabase (Postabase Auth, Postgres 17) |
| AI | Groq SDK, NVIDIA NIM API (campus chatbot) |
| Email | Nodemailer (Gmail SMTP) + Resend |
| Storage | MinIO (`files.eavi.shop`) for images, Vercel Blob for docs |
| PDF | jsPDF, pdfmake (admission letters) |
| Auth | Supabase cookies + middleware (role-based) |
| Deploy | Vercel |

## 👥 User Roles

1. **Admin** → `/admin/*` — Full dashboard (students, courses, finance, reports, etc.)
2. **Student** → `/student/*` — Dashboard (fees, payments, calendar, archive)
3. **Lecturer** → `/lecturer/*` — Dashboard (calendar, marks entry)

## 📁 Key Directories

```
app/
  page.tsx              — Marketing landing page
  apply/page.tsx        — Student application/enrollment form (~38KB)
  login/{admin,student,lecturer}/ — Role-based login portals
  admin/                — 23 admin subsections
    dashboard/          — Admin overview
    students/           — Student management
    courses/            — Course management
    finance/            — Financial dashboard
    financial-reports/  — Reports
    classes/            — Class management
    units/              — Unit management
    lecturers/          — Lecturer management
    notifications/      — Notification system
    payments/           — Payment tracking
    results/            — Exam results
    bridge-management/  — Bridge programme management
    calendar/           — Academic calendar
    db-analyzer/        — Database analysis tool
    ...
  student/              — Student dashboard
    dashboard/
    fees/
    payments/
    calendar/
    archive/
  lecturer/             — Lecturer dashboard
    dashboard/
    calendar/
  api/                  — 17 API route groups
    chat/               — AI chatbot endpoint
    admission-pdf/      — PDF generation
    applications/       — Application processing
    bridge-groups/      — Bridge programme APIs
    bursary/            — Bursary management
    notifications/      — Notification sending
    upload/             — File upload
    payments/payhero/   — Pay Hero M-Pesa integration (initiate, status, callback)
    ...

components/
  StudentEnrollmentForm.tsx — Main enrollment form
  AdmissionLetter.tsx       — Admission letter PDF
  Chatbot.tsx               — AI chatbot UI
  SendNotification.tsx      — Notification sender
  PaymentReceipt.tsx        — Payment receipt
  DocumentUpload.tsx        — Document upload
  GuardianManager.tsx       — Guardian management
  PayHeroModal.tsx          — Pay Hero M-Pesa payment modal (STK push flow)
  MpesaPayButton.tsx        — Reusable M-Pesa pay button
  ...

lib/
  client.ts           — Supabase client
  server.ts           — Supabase server client
  middleware.ts       — Auth middleware (rate limiting, role checks)
  course-structure.ts — Course structure logic
  fee-calculation.ts  — Fee calculation engine
  email-service.ts    — Email service
  supabase-schema.ts  — Schema fetcher for AI context
  service-client.ts   — Supabase service role client (for webhooks/API routes)

supabase/
  functions/          — Edge functions
  migrations/         — DB migrations

migrations/           — 19 SQL migration files
tests/                — Playwright E2E tests
```

## 🎓 Academic Programmes

CDACC & JP accredited:
- Health Records & Information Technology (HIT) — L4, L5, L6
- Perioperative Theatre Technology (PTT) — L5, L6
- Medical Engineering (MED) — L4, L5, L6
- Community Health Assistant (CHA) — L5, L6
- Orthopedic & Trauma Technology (OTT) — L5
- Counselling & Psychology (CNP) — L6

## 🏫 Campuses (Eldoret, Kenya)

1. **Main Campus** — City Plaza, `0724 269 099`
2. **West Campus** — Mailinne, Near Kapyemit, `0748 022 044`
3. **Town Campus** — Skymart Building, `0726 044 022`

## 🔑 Key Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server-only) |
| `GROQ_API_KEY` | Groq AI API |
| `MISTRAL_API_KEY` | Mistral AI API |
| `RESEND_API_KEY` | Resend email API |
| `SMTP_*` | Gmail SMTP config |
| `MINIO_*` | MinIO S3-compatible storage |
| `NEXTAUTH_SECRET` | NextAuth secret |
| `NVIDIA_API_KEY` | NVIDIA NIM API |
| `PAYHERO_USERNAME` | Pay Hero API username |
| `PAYHERO_PASSWORD` | Pay Hero API password |

## 🔐 Auth Flow

1. User visits `/login/{role}` → Supabase auth
2. `proxy.ts` middleware checks session + role on every request
3. Unauthenticated users redirected to appropriate login
4. Role mismatch → redirected to correct login page
5. Public routes: `/`, `/apply`, `/login/*`, `/api/apply`, `/api/chat`

## 📊 Database Notes

- Uses Supabase Auth with `user_metadata.role` for role storage
- 19 migration files in `/migrations/` for schema evolution
- Report views defined in `20260513_create_19_report_views.sql`
- Fee payment triggers in `validate_fee_payment_trigger.sql`
- Bridge programme has dedicated tables and group management
- Pay Hero integration: `payhero_config` (per-campus channel/paybill), `payhero_transactions` (STK push tracking)
- Payment flow: Pay Hero STK push → callback webhook → fee_payments + payment_installments + applications updated atomically

## 🧪 Testing

- Playwright tests in `/tests/`
- Run: `npx playwright test`
- Tests cover: bulk import, enrollment flow, E2E, DB connection

## 📝 MCP Setup

Supabase MCP is configured in `/root/.mcp.json` (global config).
- If MCP shows wrong project, check/update `/root/.mcp.json`

## 🚀 Common Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

## 📌 Important Notes

- **TVETA Accredited:** TVETA/PRIVATE/TVC/0062/2017
- **CDACC Registered**
- Min. KCSE grade: D-
- Bursary available for eligible students
- The `proxy.ts` file is the main middleware — handles auth, rate limiting, and role-based routing
- Neumorphic UI design system (see `NEUMORPHISM_GUIDE.md`)
- Chart.js for financial dashboards and reports
