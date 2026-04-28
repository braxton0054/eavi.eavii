# Student Management

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [app/admin/applications/page.tsx](file://app/admin/applications/page.tsx)
- [app/admin/students/page.tsx](file://app/admin/students/page.tsx)
- [app/admin/dashboard/page.tsx](file://app/admin/dashboard/page.tsx)
- [app/apply/page.tsx](file://app/apply/page.tsx)
- [app/student/dashboard/page.tsx](file://app/student/dashboard/page.tsx)
- [app/student/payments/page.tsx](file://app/student/payments/page.tsx)
- [app/api/admission-pdf/route.ts](file://app/api/admission-pdf/route.ts)
- [components/AdmissionLetter.tsx](file://components/AdmissionLetter.tsx)
- [lib/client.ts](file://lib/client.ts)
- [lib/server.ts](file://lib/server.ts)
- [lib/course-structure.ts](file://lib/course-structure.ts)
- [lib/fee-calculation.ts](file://lib/fee-calculation.ts)
- [database.sql](file://database.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document describes the Student Management system, focusing on admissions processing, student records, and academic progress tracking. It covers the complete admissions workflow from application submission through enrollment confirmation, the student record management system including personal information, academic history, and financial status tracking, and the student dashboard functionality providing access to academic records, payment status, and course enrollment. It also documents the admission letter generation system and PDF document creation processes, explains the relationships between applications, enrollments, and academic records, and provides practical examples of common student management scenarios including new student onboarding, transfer processing, and graduation tracking. Finally, it addresses student portal features and self-service capabilities and offers troubleshooting guidance for student data management issues and enrollment problems.

## Project Structure
The system is a Next.js application with TypeScript, using Supabase for authentication and database access. Key areas:
- Admin portal for admissions, student records, course enrollment, results, and financial reporting
- Public application form for prospective students
- Student portal for viewing academic records, payments, and downloading transcripts
- Shared libraries for client-side Supabase access, course structure normalization, and fee calculations
- Database schema defining core entities and relationships

```mermaid
graph TB
subgraph "Admin Portal"
A1["Admin Dashboard<br/>app/admin/dashboard/page.tsx"]
A2["Applications<br/>app/admin/applications/page.tsx"]
A3["Students<br/>app/admin/students/page.tsx"]
end
subgraph "Public"
P1["Apply Form<br/>app/apply/page.tsx"]
P2["Admission Letter Component<br/>components/AdmissionLetter.tsx"]
P3["Admission PDF API<br/>app/api/admission-pdf/route.ts"]
end
subgraph "Student Portal"
S1["Student Dashboard<br/>app/student/dashboard/page.tsx"]
S2["Payments<br/>app/student/payments/page.tsx"]
end
subgraph "Libraries"
L1["Client Supabase<br/>lib/client.ts"]
L2["Server Supabase<br/>lib/server.ts"]
L3["Course Structure<br/>lib/course-structure.ts"]
L4["Fee Calculation<br/>lib/fee-calculation.ts"]
end
subgraph "Database Schema"
D1["applications"]
D2["courses"]
D3["course_types"]
D4["modules"]
D5["semesters"]
D6["short_courses"]
D7["fee_payments"]
D8["payment_installments"]
D9["exam_marks"]
D10["academic_calendar"]
D11["bridge_groups"]
D12["reporting_dates"]
end
A1 --> L1
A2 --> L1
A3 --> L1
P1 --> L1
P2 --> L1
P3 --> L1
S1 --> L1
S2 --> L1
A2 --> D1
A3 --> D1
P1 --> D1
S1 --> D1
S2 --> D1
D1 --> D2
D1 --> D3
D3 --> D4
D4 --> D5
D2 --> D6
S2 --> D7
S2 --> D8
S1 --> D9
A1 --> D10
A1 --> D11
A1 --> D12
```

**Diagram sources**
- [app/admin/dashboard/page.tsx:11-655](file://app/admin/dashboard/page.tsx#L11-L655)
- [app/admin/applications/page.tsx:30-1086](file://app/admin/applications/page.tsx#L30-L1086)
- [app/admin/students/page.tsx:27-290](file://app/admin/students/page.tsx#L27-L290)
- [app/apply/page.tsx:15-815](file://app/apply/page.tsx#L15-L815)
- [components/AdmissionLetter.tsx:24-500](file://components/AdmissionLetter.tsx#L24-L500)
- [app/api/admission-pdf/route.ts:4-38](file://app/api/admission-pdf/route.ts#L4-L38)
- [app/student/dashboard/page.tsx:12-1419](file://app/student/dashboard/page.tsx#L12-L1419)
- [app/student/payments/page.tsx:41-378](file://app/student/payments/page.tsx#L41-L378)
- [lib/client.ts:5-42](file://lib/client.ts#L5-L42)
- [lib/server.ts:8-34](file://lib/server.ts#L8-L34)
- [lib/course-structure.ts:58-237](file://lib/course-structure.ts#L58-L237)
- [lib/fee-calculation.ts:42-584](file://lib/fee-calculation.ts#L42-L584)
- [database.sql:25-341](file://database.sql#L25-L341)

**Section sources**
- [README.md:1-2](file://README.md#L1-L2)
- [app/admin/dashboard/page.tsx:11-655](file://app/admin/dashboard/page.tsx#L11-L655)
- [app/admin/applications/page.tsx:30-1086](file://app/admin/applications/page.tsx#L30-L1086)
- [app/admin/students/page.tsx:27-290](file://app/admin/students/page.tsx#L27-L290)
- [app/apply/page.tsx:15-815](file://app/apply/page.tsx#L15-L815)
- [components/AdmissionLetter.tsx:24-500](file://components/AdmissionLetter.tsx#L24-L500)
- [app/api/admission-pdf/route.ts:4-38](file://app/api/admission-pdf/route.ts#L4-L38)
- [app/student/dashboard/page.tsx:12-1419](file://app/student/dashboard/page.tsx#L12-L1419)
- [app/student/payments/page.tsx:41-378](file://app/student/payments/page.tsx#L41-L378)
- [lib/client.ts:5-42](file://lib/client.ts#L5-L42)
- [lib/server.ts:8-34](file://lib/server.ts#L8-L34)
- [lib/course-structure.ts:58-237](file://lib/course-structure.ts#L58-L237)
- [lib/fee-calculation.ts:42-584](file://lib/fee-calculation.ts#L42-L584)
- [database.sql:25-341](file://database.sql#L25-L341)

## Core Components
- Admissions processing: Application submission, review, enrollment, and class assignment
- Student records: Personal information, academic history, and financial status
- Academic progress: Units, semesters, modules, and exam results
- Financial management: Fee calculation, installments, payments, and holds
- Reporting and PDFs: Admission letters, transcripts, and fee structures

Key implementation highlights:
- Admin pages for managing applications and students with filtering by campus
- Student dashboard with results, transcripts, and payment status
- Admission letter generation with dynamic fee structure and branding assets
- Fee calculation supporting multiple exam bodies and study modes
- Course structure normalization for flexible curriculum modeling

**Section sources**
- [app/admin/applications/page.tsx:30-1086](file://app/admin/applications/page.tsx#L30-L1086)
- [app/admin/students/page.tsx:27-290](file://app/admin/students/page.tsx#L27-L290)
- [app/apply/page.tsx:15-815](file://app/apply/page.tsx#L15-L815)
- [app/student/dashboard/page.tsx:12-1419](file://app/student/dashboard/page.tsx#L12-L1419)
- [components/AdmissionLetter.tsx:24-500](file://components/AdmissionLetter.tsx#L24-L500)
- [lib/fee-calculation.ts:42-584](file://lib/fee-calculation.ts#L42-L584)
- [lib/course-structure.ts:58-237](file://lib/course-structure.ts#L58-L237)

## Architecture Overview
The system follows a layered architecture:
- Presentation layer: Next.js pages and components
- Business logic: Shared libraries for course structure and fee calculation
- Data access: Supabase client/server utilities
- Data model: Relational schema with normalized entities

```mermaid
sequenceDiagram
participant User as "Prospective Student"
participant Apply as "Apply Page<br/>app/apply/page.tsx"
participant Supabase as "Supabase Client<br/>lib/client.ts"
participant DB as "PostgreSQL Schema<br/>database.sql"
User->>Apply : Fill application form
Apply->>Supabase : Insert application record
Supabase->>DB : INSERT INTO applications
DB-->>Supabase : OK
Supabase-->>Apply : Application ID
Apply-->>User : Submission confirmation
```

**Diagram sources**
- [app/apply/page.tsx:276-447](file://app/apply/page.tsx#L276-L447)
- [lib/client.ts:5-42](file://lib/client.ts#L5-L42)
- [database.sql:25-58](file://database.sql#L25-L58)

**Section sources**
- [app/apply/page.tsx:276-447](file://app/apply/page.tsx#L276-L447)
- [lib/client.ts:5-42](file://lib/client.ts#L5-L42)
- [database.sql:25-58](file://database.sql#L25-L58)

## Detailed Component Analysis

### Admissions Workflow
End-to-end admissions processing:
- Application submission with course selection, exam body, and campus
- Automatic admission number generation
- Admin review and enrollment actions
- Class assignment and initial balance calculation
- Admission letter generation

```mermaid
sequenceDiagram
participant Pros as "Prospective Student"
participant Apply as "Apply Page"
participant Admin as "Admin Applications"
participant Dash as "Student Dashboard"
participant PDF as "AdmissionLetter Component"
Pros->>Apply : Submit application
Apply->>DB : INSERT applications
Admin->>DB : VIEW pending applications
Admin->>DB : UPDATE status=enrolled
Admin->>DB : SET admission_number, class_name
Pros->>Dash : Login and view status
Pros->>PDF : Download admission letter
PDF->>DB : Fetch course fee structure
PDF-->>Pros : PDF download
```

**Diagram sources**
- [app/apply/page.tsx:276-447](file://app/apply/page.tsx#L276-L447)
- [app/admin/applications/page.tsx:281-376](file://app/admin/applications/page.tsx#L281-L376)
- [app/student/dashboard/page.tsx:116-146](file://app/student/dashboard/page.tsx#L116-L146)
- [components/AdmissionLetter.tsx:347-489](file://components/AdmissionLetter.tsx#L347-L489)
- [database.sql:25-58](file://database.sql#L25-L58)

**Section sources**
- [app/apply/page.tsx:15-815](file://app/apply/page.tsx#L15-L815)
- [app/admin/applications/page.tsx:30-1086](file://app/admin/applications/page.tsx#L30-L1086)
- [components/AdmissionLetter.tsx:24-500](file://components/AdmissionLetter.tsx#L24-L500)
- [database.sql:25-58](file://database.sql#L25-L58)

### Student Records Management
Student records include personal information, academic history, and financial status:
- Personal details: name, contact, gender, KCSE grade
- Academic profile: course, type, campus, class, module/semester progression
- Financial profile: total balance, financial hold, payment history, installments

```mermaid
classDiagram
class Application {
+uuid id
+string full_name
+string phone
+string email
+string gender
+string kcse_grade
+string course_id
+uuid course_type_id
+string campus
+string admission_number
+date application_date
+string status
+string stream_type
+date bridge_start_date
+int current_module
+int current_semester
+string class_name
+boolean financial_hold
+number total_balance
+boolean transcript_unlocked
}
class Course {
+string id
+string name
+string exam_body
+boolean is_active
}
class CourseType {
+uuid id
+string course_id
+string level
+boolean enabled
+string study_mode
+int duration_months
}
class FeePayment {
+uuid id
+uuid application_id
+string payment_type
+number amount
+string payment_method
+date payment_date
+int semester
+int module
+string status
+string receipt_number
}
class PaymentInstallment {
+uuid id
+uuid application_id
+int installment_number
+date due_date
+number amount
+string status
+date paid_date
+number late_fee
}
class ExamMark {
+uuid id
+uuid application_id
+string campus
+string course_id
+string unit_code
+int semester
+string exam_type
+number cat_marks
+number end_term_marks
+int marks
}
Application --> Course : "belongs to"
Application --> CourseType : "has type"
Application --> FeePayment : "has payments"
Application --> PaymentInstallment : "has installments"
Application --> ExamMark : "has results"
```

**Diagram sources**
- [database.sql:25-341](file://database.sql#L25-L341)

**Section sources**
- [app/admin/students/page.tsx:27-290](file://app/admin/students/page.tsx#L27-L290)
- [app/student/dashboard/page.tsx:116-146](file://app/student/dashboard/page.tsx#L116-L146)
- [app/student/payments/page.tsx:82-156](file://app/student/payments/page.tsx#L82-L156)
- [database.sql:25-341](file://database.sql#L25-L341)

### Academic Progress Tracking
Tracking academic progress involves units, semesters, modules, and exam results:
- Course structure normalization supports semester, module, and short-course modes
- Units mapped per module/semester
- Exam results stored with CAT and end-term components
- Progression controlled by module/semester increments

```mermaid
flowchart TD
Start(["Load Student"]) --> GetCourse["Get Course & Type"]
GetCourse --> Normalize["Normalize Course Type<br/>lib/course-structure.ts"]
Normalize --> Mode{"Study Mode?"}
Mode --> |Semester| Sem["Use Semesters"]
Mode --> |Module| Mod["Use Modules"]
Mode --> |Short-Course| SC["Use Short Course Units"]
Sem --> Units["Get Units for Period"]
Mod --> Units
SC --> Units
Units --> Results["Load Exam Marks"]
Results --> Progress["Compute Progress<br/>Module/Semester"]
Progress --> End(["Display in Dashboard"])
```

**Diagram sources**
- [app/student/dashboard/page.tsx:269-367](file://app/student/dashboard/page.tsx#L269-L367)
- [lib/course-structure.ts:212-261](file://lib/course-structure.ts#L212-L261)
- [database.sql:131-150](file://database.sql#L131-L150)

**Section sources**
- [app/student/dashboard/page.tsx:269-367](file://app/student/dashboard/page.tsx#L269-L367)
- [lib/course-structure.ts:212-261](file://lib/course-structure.ts#L212-L261)
- [database.sql:131-150](file://database.sql#L131-L150)

### Admission Letter Generation
Admission letter generation includes dynamic fee structure and branded assets:
- Dynamic pdfmake initialization
- Fetch reporting date and course fee structure
- Generate combined admission letter and fee structure PDF
- Downloadable PDF with header and stamp images

```mermaid
sequenceDiagram
participant Student as "Student"
participant Dashboard as "Student Dashboard"
participant Letter as "AdmissionLetter Component"
participant PDFM as "pdfmake"
participant DB as "Supabase"
Student->>Dashboard : Access dashboard
Dashboard->>Letter : Render component
Letter->>PDFM : Initialize runtime
Letter->>DB : SELECT reporting_dates
Letter->>DB : SELECT courses + course_types
Letter->>PDFM : Build document with content
PDFM-->>Student : Download PDF
```

**Diagram sources**
- [app/student/dashboard/page.tsx:402-546](file://app/student/dashboard/page.tsx#L402-L546)
- [components/AdmissionLetter.tsx:347-489](file://components/AdmissionLetter.tsx#L347-L489)
- [database.sql:273-281](file://database.sql#L273-L281)

**Section sources**
- [components/AdmissionLetter.tsx:24-500](file://components/AdmissionLetter.tsx#L24-L500)
- [app/student/dashboard/page.tsx:402-546](file://app/student/dashboard/page.tsx#L402-L546)
- [database.sql:273-281](file://database.sql#L273-L281)

### Financial Management
Financial management encompasses fee calculation, installments, payments, and holds:
- Fee calculation varies by exam body and study mode
- Installment plans with due dates and statuses
- Payment recording with receipts and methods
- Financial holds based on outstanding balances

```mermaid
flowchart TD
A["Student Info"] --> B["Fetch Course Type"]
B --> C{"Exam Body & Mode"}
C --> |Short Course| S["Sum First + Subsequent + Practical"]
C --> |CDACC Once/Stage| D["Sum Module Fee + Exam Fee"]
C --> |Standard Modular| E["Sum Semester Fee + Practical + Exam + Additional"]
S --> F["Total Fees"]
D --> F
E --> F
F --> G["Create Installments"]
G --> H["Record Payments"]
H --> I["Update Balance & Hold"]
```

**Diagram sources**
- [lib/fee-calculation.ts:42-211](file://lib/fee-calculation.ts#L42-L211)
- [lib/fee-calculation.ts:379-397](file://lib/fee-calculation.ts#L379-L397)
- [lib/fee-calculation.ts:482-534](file://lib/fee-calculation.ts#L482-L534)
- [database.sql:151-167](file://database.sql#L151-L167)
- [database.sql:253-267](file://database.sql#L253-L267)

**Section sources**
- [lib/fee-calculation.ts:42-211](file://lib/fee-calculation.ts#L42-L211)
- [lib/fee-calculation.ts:216-285](file://lib/fee-calculation.ts#L216-L285)
- [lib/fee-calculation.ts:379-397](file://lib/fee-calculation.ts#L379-L397)
- [lib/fee-calculation.ts:482-534](file://lib/fee-calculation.ts#L482-L534)
- [app/student/payments/page.tsx:107-156](file://app/student/payments/page.tsx#L107-L156)
- [database.sql:151-167](file://database.sql#L151-L167)
- [database.sql:253-267](file://database.sql#L253-L267)

### Student Portal Features
Student portal provides self-service capabilities:
- Academic records and transcripts
- Payment status and history
- Installment tracking
- Financial hold notifications
- Downloadable receipts and fee structures

```mermaid
sequenceDiagram
participant Student as "Student"
participant Dash as "Student Dashboard"
participant Pay as "Payments Page"
participant PDF as "PDF Utilities"
Student->>Dash : View profile, results, balance
Student->>Pay : View payments, installments
Pay->>PDF : Generate receipt
Dash->>PDF : Generate transcript (when unlocked)
PDF-->>Student : Download PDF
```

**Diagram sources**
- [app/student/dashboard/page.tsx:116-146](file://app/student/dashboard/page.tsx#L116-L146)
- [app/student/dashboard/page.tsx:402-546](file://app/student/dashboard/page.tsx#L402-L546)
- [app/student/payments/page.tsx:158-161](file://app/student/payments/page.tsx#L158-L161)
- [app/student/payments/page.tsx:344-374](file://app/student/payments/page.tsx#L344-L374)

**Section sources**
- [app/student/dashboard/page.tsx:116-146](file://app/student/dashboard/page.tsx#L116-L146)
- [app/student/dashboard/page.tsx:402-546](file://app/student/dashboard/page.tsx#L402-L546)
- [app/student/payments/page.tsx:158-161](file://app/student/payments/page.tsx#L158-L161)
- [app/student/payments/page.tsx:344-374](file://app/student/payments/page.tsx#L344-L374)

## Dependency Analysis
Component and data dependencies:
- Pages depend on Supabase client for data access
- Libraries encapsulate shared logic (course structure, fee calculation)
- Database schema defines foreign keys and referential integrity
- PDF generation depends on runtime initialization and database queries

```mermaid
graph TB
Apply["app/apply/page.tsx"] --> Client["lib/client.ts"]
AdminApps["app/admin/applications/page.tsx"] --> Client
AdminStudents["app/admin/students/page.tsx"] --> Client
StudDash["app/student/dashboard/page.tsx"] --> Client
StudPay["app/student/payments/page.tsx"] --> Client
AdmitComp["components/AdmissionLetter.tsx"] --> Client
FeeCalc["lib/fee-calculation.ts"] --> Client
CourseNorm["lib/course-structure.ts"]
Apply --> DB["database.sql"]
AdminApps --> DB
AdminStudents --> DB
StudDash --> DB
StudPay --> DB
AdmitComp --> DB
FeeCalc --> DB
CourseNorm --> DB
```

**Diagram sources**
- [app/apply/page.tsx:15-815](file://app/apply/page.tsx#L15-L815)
- [app/admin/applications/page.tsx:30-1086](file://app/admin/applications/page.tsx#L30-L1086)
- [app/admin/students/page.tsx:27-290](file://app/admin/students/page.tsx#L27-L290)
- [app/student/dashboard/page.tsx:12-1419](file://app/student/dashboard/page.tsx#L12-L1419)
- [app/student/payments/page.tsx:41-378](file://app/student/payments/page.tsx#L41-L378)
- [components/AdmissionLetter.tsx:24-500](file://components/AdmissionLetter.tsx#L24-L500)
- [lib/client.ts:5-42](file://lib/client.ts#L5-L42)
- [lib/fee-calculation.ts:42-584](file://lib/fee-calculation.ts#L42-L584)
- [lib/course-structure.ts:58-237](file://lib/course-structure.ts#L58-L237)
- [database.sql:25-341](file://database.sql#L25-L341)

**Section sources**
- [app/apply/page.tsx:15-815](file://app/apply/page.tsx#L15-L815)
- [app/admin/applications/page.tsx:30-1086](file://app/admin/applications/page.tsx#L30-L1086)
- [app/admin/students/page.tsx:27-290](file://app/admin/students/page.tsx#L27-L290)
- [app/student/dashboard/page.tsx:12-1419](file://app/student/dashboard/page.tsx#L12-L1419)
- [app/student/payments/page.tsx:41-378](file://app/student/payments/page.tsx#L41-L378)
- [components/AdmissionLetter.tsx:24-500](file://components/AdmissionLetter.tsx#L24-L500)
- [lib/client.ts:5-42](file://lib/client.ts#L5-L42)
- [lib/fee-calculation.ts:42-584](file://lib/fee-calculation.ts#L42-L584)
- [lib/course-structure.ts:58-237](file://lib/course-structure.ts#L58-L237)
- [database.sql:25-341](file://database.sql#L25-L341)

## Performance Considerations
- Database queries use targeted selects with filters (campus, status, dates) to minimize payload
- Client-side caching of normalized course structures reduces repeated computations
- PDF generation is deferred to runtime to avoid SSR issues
- Auto-refresh intervals for financial status reduce manual polling overhead
- Pagination and limits applied to recent activity feeds

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Authentication failures: Ensure user roles are set correctly (admin, lecturer, student) and session persistence is intact
- Missing campus context: Admin dashboards filter by campus; verify user metadata and local storage
- Financial holds preventing transcript access: Resolve outstanding balances or unpaid installments
- Course type resolution errors: Verify course_types linkage and normalization logic
- PDF generation failures: Confirm runtime initialization of pdfmake and availability of branding assets
- Enrollment errors: Validate course type selection and prerequisite conditions

**Section sources**
- [app/admin/dashboard/page.tsx:164-201](file://app/admin/dashboard/page.tsx#L164-L201)
- [app/student/dashboard/page.tsx:102-114](file://app/student/dashboard/page.tsx#L102-L114)
- [lib/fee-calculation.ts:539-555](file://lib/fee-calculation.ts#L539-L555)
- [lib/course-structure.ts:212-237](file://lib/course-structure.ts#L212-L237)
- [components/AdmissionLetter.tsx:34-80](file://components/AdmissionLetter.tsx#L34-L80)

## Conclusion
The Student Management system provides a comprehensive solution for admissions processing, student records, academic progress tracking, and financial management. Its modular architecture, shared libraries, and robust database schema enable scalable administration and self-service capabilities for students. The system supports multiple exam bodies and study modes, integrates PDF generation for official documents, and maintains clear relationships between applications, enrollments, and academic records.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Practical Scenarios

#### New Student Onboarding
- Submit application with course and campus selection
- Admin approves and enrolls student
- Assign admission number, class, and initial module/semester
- Generate admission letter and fee structure PDF
- Student accesses dashboard and pays fees

**Section sources**
- [app/apply/page.tsx:276-447](file://app/apply/page.tsx#L276-L447)
- [app/admin/applications/page.tsx:281-376](file://app/admin/applications/page.tsx#L281-L376)
- [components/AdmissionLetter.tsx:347-489](file://components/AdmissionLetter.tsx#L347-L489)
- [app/student/dashboard/page.tsx:116-146](file://app/student/dashboard/page.tsx#L116-L146)

#### Transfer Processing
- Review transfer student's previous academic records
- Validate course equivalency and prerequisites
- Adjust module/semester placement based on prior learning
- Update academic history and progress tracking

[No sources needed since this section provides general guidance]

#### Graduation Tracking
- Monitor completion of all modules/semesters
- Verify payment clearance and academic requirements
- Generate final transcripts and certificates
- Update student status to alumni

[No sources needed since this section provides general guidance]

### API Definitions

#### Admission PDF API
- Endpoint: GET /api/admission-pdf
- Query parameters: admission_number (required)
- Response: JSON placeholder indicating implementation status

**Section sources**
- [app/api/admission-pdf/route.ts:4-38](file://app/api/admission-pdf/route.ts#L4-L38)