# AISHA PROJECT: COMPREHENSIVE TABLES AND MATRICES

## 1. Project Scope and Completion
### Table: Feature Traceability Matrix
| Req ID | Feature Name | Status | Module Implementation | Description |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01** | Multi Role Authentication | **Complete** | `AuthService`, `AuthRoutes` | Secure JWT login for Students, Institutions, and Companies. |
| **FR-02** | Profile Synchronization | **Complete** | `InstitutionSyncService` | Automated importing of academic data from MMUST databases. |
| **FR-03** | AI Best Fit Matching | **Complete** | `AIService`, `LLMService` | Gemini powered single match engine with 24h window logic. |
| **FR-04** | Letter Automation | **Complete** | `AutomationService` | Auto generation of PDF Acceptance and Assignment Letters. |
| **FR-05** | M Pesa STK Push | **Complete** | `PaymentService` | Integration with Safaricom Daraja API for fee handling. |
| **FR-06** | Digital Student Logbook | **Complete** | `LogbookEntries`, `LogbookService` | Daily activity logging with supervisor signing precedence. |
| **FR-07** | Real time Notifications | **Complete** | `EmailService`, `SocketService` | Gmail API integration and in app WebSocket alerts. |
| **FR-08** | Persistent File Storage | **Complete** | `StorageService` | Supabase Bucket integration for permanent document storage. |
| **FR-09** | Digital Signature | **Partial** | `SignatureService` | HMAC based signing logic implemented; full UI integration ongoing. |

## 2. System Configuration
### Table: Environment & Tech Stack Directory
| Component | Technology | Version | Hosting Provider | Environment Link |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | React (Vite) | 19.2.0 | Vercel / Netlify | `https://aisha-portal.vercel.app` |
| **Backend** | Node.js (Express) | 5.2.1 | Render | `https://aisha-api.onrender.com` |
| **AI Service** | Python (FastAPI) | 3.12 | Render / Cloud | `https://aisha-ai.onrender.com` |
| **Database** | PostgreSQL | 15.x | Supabase | Managed Cloud Instance |
| **Cache/Queue** | Redis / Bull | 5.10 | Upstash / Local | Managed Cloud Instance |
| **Storage** | Supabase Buckets | 2.x | Supabase | `aisha-documents` Bucket |

## 3. Database Architecture
### Table: Data Dictionary (Core Tables)
| Table Name | Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| **users** | id | UUID | Primary Key, Not Null | Unique identifier for every system user. |
| | email | String | Unique, Not Null | User's professional/academic email. |
| | role | Enum | Not Null | Roles: STUDENT, INSTITUTION, COMPANY, ADMIN. |
| **students** | id | UUID | Primary Key, Not Null | Unique identifier for a student profile. |
| | skills | Array (Str) | | List of technical skills (e.g., Python, React). |
| | academic_analysis| JSONB | | AI generated summary of student performance. |
| **opportunities** | id | UUID | Primary Key, Not Null | Unique identifier for an attachment opening. |
| | company_id | UUID | Foreign Key | Link to the hiring company. |
| | requirements | Text | Not Null | Detailed job description and skills needed. |
| **applications** | id | UUID | Primary Key, Not Null | Tracks the link between student and company. |
| | match_score | Numeric | | AI calculated relevancy (0-100). |
| | window_expires | Timestamp | | Expiration of the 24 hour preference window. |
| | status | String | | PENDING, MATCHED, ACCEPTED, REJECTED. |
| **logbook_entries**| id | UUID | Primary Key, Not Null | Unique daily work record. |
| | placement_id | UUID | Foreign Key | Link to the active attachment. |
| | status | String | | PENDING, VERIFIED, COMPLETED. |

## 4. Security and Access Control
### Table: User Role & Permissions Matrix
| Role | Access Level | System Modules Accessible | Key Permissions |
| :--- | :--- | :--- | :--- |
| **Student** | Read/Write/Update | Profile, Matching, Logbook, Payments | Adjust preferences, Fill logbook, Pay fees. |
| **Company** | Read/Write/Update | Opportunity Mgr, App Review, Logbook Audit | List jobs, Sign logbooks, Issue Acceptance Letter. |
| **Institution**| Read/Audit | Student Monitor, Department Admin, Reports | Sync students, Audit logbooks, Issue Status reports. |
| **Admin** | Full (CRUD) | User Management, API Config, System Logs | Manage users, Monitor AI quotas, System health. |
| **Guest** | Read Only | Landing Page, AI Assistant | Use AISHA Chat, Browse public opportunities. |

## 5. Quality Assurance
### Table: Test Execution Log
| Test ID | Feature Tested | Input Data | Expected Outcome | Actual Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Student Matching | MMUST Student Profile | Single best fit placement returned | Best match shown with 24h clock | **Pass** |
| **TC-02** | M Pesa STK Push | 0794987200, 100 KES | Phone PIN Prompt | STK Prompt triggered | **Pass** |
| **TC-03** | Acceptance Letter | Finalized Placement | PDF with company details | Letter generated with signature | **Pass** |
| **TC-04** | Gmail Notification| New Matching Event | Email in student inbox | OAuth2 mail delivered | **Pass** |
| **TC-05** | Preference Window | Time Expiry Event | Automatic placement finalization | Status changed after 24h | **Pass** |

## 6. Defect Management
### Table: Bug Tracking Registry
| Bug ID | Severity | Description | Resolution Status | Developer Assigned |
| :--- | :--- | :--- | :--- | :--- |
| **BG-001** | **Critical** | M Pesa 500 Error (Decimal Amount) | **Fixed**: Rounding logic added | Lead Backend Dev |
| **BG-002** | **Critical** | Render File Loss (Ephemeral FS) | **Fixed**: Migrated to Supabase | DevOps Engineer |
| **BG-003** | **High** | Invisible Text in Notification Cards | **Fixed**: Chakra UI theme tokens | Frontend Dev |
| **BG-004** | **Medium** | Gemini Quota Exhaustion Timeout | **Fixed**: Redis cache implemented | AI Specialist |

## 7. API and Integrations
### Table: Endpoint Specification Table
| Endpoint URL | Method | Payload / Parameters | Response Format | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | `{email, password}` | JSON (JWT Token) | User authentication. |
| `/api/ai/match` | GET | `?student_id={id}` | JSON (Single Match Object) | Trigger AI best fit engine. |
| `/api/pay/stk` | POST | `{amount, phone_number}` | JSON (CheckoutID) | Initiate M Pesa payment. |
| `/api/log/entry` | POST | `{activities, challenges}` | JSON (Entry Object) | Submit daily logbook record. |
| `/api/docs/letters` | GET | `?app_id={id}` | PDF (Binary) | Download Acceptance/Assignment letters. |

## 8. Project Timeline and Handoff
### Table: Milestone & Delivery Schedule
| Phase Name | Planned Completion | Actual Completion | Sign-off Responsible |
| :--- | :--- | :--- | :--- |
| **Proposal & Research** | 2026-02-15 | 2026-02-10 | Dr. Charles Muango |
| **Database Design** | 2026-03-01 | 2026-02-28 | Technical Lead |
| **Backend Integration** | 2026-04-10 | 2026-04-15 | Lead Developer |
| **AI Matching Engine** | 2026-04-20 | 2026-04-22 | AI Specialist |
| **Final UAT & Testing** | 2026-05-01 | 2026-05-02 | MMUST Coordinator |
| **Handoff & Deployment** | 2026-05-05 | **In Progress** | Project Manager |
