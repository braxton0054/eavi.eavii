# EAVI School Management System — Timetable

## Working Hours
- **Morning:** 8:00 AM – 12:00 PM (EAT) = 4 hours
- **Lunch Break:** 12:00 PM – 2:00 PM = 2 hours rest
- **Afternoon:** 2:00 PM – 6:00 PM (EAT) = 4 hours
- **Daily Total:** 8 hours
- **Weekly Total:** 40 hours (Mon–Fri), 48 hours (Mon–Sat with half Saturday)

## Phase Estimates

| Phase | Module | Est. Hours | Est. Days | Status |
|-------|--------|-----------|-----------|--------|
| **1** | Neon DB setup + schema | 6h | Day 1 | ⬜ |
| **1** | Auth system | 8h | Day 2-3 | ⬜ |
| **1** | Base layout + design system | 6h | Day 3-4 | ⬜ |
| **2** | Student management | 10h | Day 5-6 | ⬜ |
| **2** | Course & Unit management | 8h | Day 7-8 | ⬜ |
| **2** | Lecturer management | 6h | Day 8-9 | ⬜ |
| **2** | Department management | 4h | Day 9 | ⬜ |
| **3** | Timetable module | 8h | Day 10-11 | ⬜ |
| **3** | Attendance tracking | 6h | Day 12 | ⬜ |
| **3** | Results/Grades | 8h | Day 13-14 | ⬜ |
| **3** | Academic calendar | 4h | Day 15 | ⬜ |
| **4** | Fee structure | 6h | Day 16-17 | ⬜ |
| **4** | Payments (M-Pesa) | 8h | Day 18-19 | ⬜ |
| **4** | Financial reports | 6h | Day 20 | ⬜ |
| **5** | Announcements | 4h | Day 21 | ⬜ |
| **5** | Notifications | 6h | Day 22 | ⬜ |
| **5** | Messaging | 6h | Day 23 | ⬜ |
| **6** | Super Admin dashboard | 8h | Day 24-25 | ⬜ |
| **6** | Role dashboards | 8h | Day 26-27 | ⬜ |
| **6** | Reports (PDF exports) | 6h | Day 28 | ⬜ |
| **7** | Mobile audit + fix | 4h | Day 29 | ⬜ |
| **7** | Accessibility audit | 4h | Day 29 | ⬜ |
| **7** | Testing & bug fixes | 8h | Day 30-31 | ⬜ |
| **7** | Production deployment | 4h | Day 32 | ⬜ |

## Summary
- **Total Hours:** ~152 hours
- **Total Days:** ~32 working days (~6.5 weeks at 5 days/week)
- **Working Schedule:** 8AM-6PM with 2hr lunch break
- **Cron Triggers:** Every 2 hours during working time (8AM, 10AM, 2PM, 4PM, 6PM)

## Rest Periods
- Lunch: 12PM-2PM (mandatory — no coding)
- Evenings: After 6PM (no coding unless紧急)
- Sundays: Rest day (no coding)
- After each phase completion: 30min break before next phase
