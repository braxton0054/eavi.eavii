# EAVI School Management System — Master Plan

## Project Overview
Institutional-grade school management system for EAVI (East African Vocational Institute).
Built with Next.js 16, Neon (PostgreSQL), Supabase (auth + real-time), deployed on Vercel.

**GitHub:** https://github.com/braxton0054/eavi-school-management

## Aesthetic Direction
**Institutional & Authoritative** — Professional, trustworthy, clean. Generous spacing, refined typography, consistent branding. Not boring — intentionally institutional like a university portal.

## Tech Stack
| Layer | Choice |
|-------|--------|
| Frontend | Next.js 16 + React 19 + Tailwind CSS 4 |
| Backend | Next.js API Routes + Server Actions |
| Database | Neon (PostgreSQL) — primary |
| Auth | Supabase Auth (JWT, role-based) |
| Storage | Supabase Storage / Vercel Blob |
| Payments | M-Pesa (Daraja API) |
| Email | Resend |
| Deploy | Vercel |
| Repo | GitHub (braxton0054/eavi-school-management) |

## Database Schema (Core Tables)
1. **users** — id, email, role (super_admin, admin, lecturer, student, parent), profile_data
2. **students** — id, user_id, admission_no, campus, course_id, year, semester, status
3. **courses** — id, name, code, department_id, duration, qualification_level, knec_code
4. **departments** — id, name, code, campus
5. **units** — id, course_id, name, code, year, semester, credits, lecturer_id
6. **lecturers** — id, user_id, department_id, qualification, specialization
7. **enrollments** — id, student_id, unit_id, academic_year, semester, status
8. **results** — id, enrollment_id, cat_score, exam_score, total, grade, published
9. **fee_structure** — id, course_id, year, semester, amount, description
10. **payments** — id, student_id, amount, method (M-Pesa/bank), reference, date
11. **timetable** — id, unit_id, day, start_time, end_time, room, lecturer_id
12. **announcements** — id, title, body, target_role, campus, created_by, created_at
13. **notifications** — id, user_id, title, body, read, created_at
14. **academic_calendar** — id, name, start_date, end_date, type (exam/holiday/term)
15. **attendance** — id, unit_id, student_id, date, status (present/absent/late)

## Modules (Build Order)

### Phase 1: Foundation (Days 1-3)
- [ ] Neon database setup + schema migration
- [ ] Auth system (login, register, role-based access, session management)
- [ ] Base layout (sidebar, header, mobile nav)
- [ ] Design system (typography, colors via CSS vars, spacing, components)

### Phase 2: Core Modules (Days 4-10)
- [ ] Student management (CRUD, profiles, enrollment, documents)
- [ ] Course & Unit management (CRUD, assignments, prerequisites)
- [ ] Lecturer management (CRUD, assignments, profiles)
- [ ] Department management

### Phase 3: Academic (Days 11-16)
- [ ] Timetable management (create, view, conflict detection)
- [ ] Attendance tracking (lecturer marks, student views)
- [ ] Results/Grade management (entry, approval, publishing)
- [ ] Academic calendar (terms, exams, holidays)

### Phase 4: Financial (Days 17-20)
- [ ] Fee structure management
- [ ] Payment recording (M-Pesa integration, bank)
- [ ] Financial reports (collections, outstanding, per student)
- [ ] Receipt generation (PDF)

### Phase 5: Communication (Days 21-23)
- [ ] Announcements (targeted by role/campus)
- [ ] Notifications system (in-app + email)
- [ ] Messaging (admin ↔ lecturer, admin ↔ student)

### Phase 6: Dashboard & Reports (Days 24-27)
- [ ] Super Admin dashboard (analytics, charts, KPIs)
- [ ] Admin dashboard (campus-level stats)
- [ ] Lecturer dashboard (my units, my students, attendance)
- [ ] Student dashboard (results, timetable, fees, announcements)
- [ ] Report generation (PDF exports)

### Phase 7: Polish & Deploy (Days 28-30)
- [ ] Mobile responsiveness audit
- [ ] Accessibility audit (WCAG AA)
- [ ] Performance optimization
- [ ] Testing & bug fixes
- [ ] Production deployment

## Design System
- **Display Font:** DM Serif Display (institutional feel)
- **Body Font:** Plus Jakarta Sans (clean, modern)
- **Color:** CSS variables only — Braxton picks the palette
- **Spacing:** 4px base scale (4, 8, 12, 16, 24, 32, 48, 64)
- **Components:** shadcn/ui base, heavily customized
- **Mobile-first:** 320px → 768px → 1024px → 1440px

## Role Permissions
| Role | Access |
|------|--------|
| Super Admin | Everything, all campuses |
| Admin | Campus-level management |
| Lecturer | My units, attendance, results entry |
| Student | My dashboard, results, timetable, fees |
| Parent | Linked student's data (read-only) |

## Build Rules
1. Every session starts by reading this PLAN.md
2. Work on the current phase only — don't skip ahead
3. Commit to GitHub after each completed module
4. Mobile-first, always
5. No generic fonts or purple gradients
6. Color CSS vars only — let Braxton customize
