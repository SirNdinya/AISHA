# AISHA: Software Design Document (SDD) & Architecture

This document contains the comprehensive system design for the AISHA (AI-Powered Industrial Attachment Matching Platform) project, including architectural diagrams, component relationships, and database Entity-Relationship Diagrams (ERDs).

## 1. System Conceptual Diagram

```mermaid
graph TD
    subgraph Presentation Layer
        SW[Student Web]
        IW[Institution Web]
        CW[Company Web]
        AW[Admin Web]
        SM[Student Mobile]
        CM[Company Mobile]
    end

    subgraph API Gateway
        GW[API Gateway<br>Auth, Rate Limit, Routing]
    end

    subgraph Application Services Layer
        US[User Service]
        MS[Matching Service]
        DS[Document Service]
        NS[Notification Service]
        AS[Application Service]
        An_S[Analytics Service]
        IS[Integration Service]
        CS[Chatbot Service]
    end

    subgraph AI/ML Services Layer
        ME[Matching Engine]
        NLP[NLP Engine]
        PA[Predictive Analytics]
        AI_C[Chatbot AI]
    end

    subgraph Data Layer
        PG[(PostgreSQL Primary)]
        RD[(Redis Cache)]
        S3[(S3/Storage)]
        VDB[(Vector DB)]
    end

    SW & IW & CW & AW & SM & CM --> GW
    GW --> US & MS & DS & NS & AS & An_S & IS & CS
    MS & CS & AS & An_S <--> ME & NLP & PA & AI_C
    US & MS & DS & NS & AS & An_S & IS & CS <--> PG & RD & S3 & VDB
```

## 2. Component Architecture Diagram

```mermaid
classDiagram
    class Frontend {
        +React 18+ (TypeScript)
        +Redux Toolkit / Zustand
        +Chakra UI / shadcn/ui
        +Vite
    }
    
    class BackendAPI {
        +Node.js (Express) / Python (FastAPI)
        +RESTful + GraphQL
        +JWT + OAuth 2.0
    }
    
    class AIML {
        +TensorFlow / PyTorch / Scikit-learn
        +Hugging Face Transformers
        +FastAPI Model Serving
    }
    
    class Database {
        +PostgreSQL 15+
        +Redis 7+
        +Pinecone Vector DB
    }
    
    Frontend <..> BackendAPI : HTTP/REST
    BackendAPI <..> AIML : Internal API GRPC/REST
    BackendAPI <..> Database : SQL / TCP
```

## 3. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ INSTITUTIONS : "has (1:1)"
    USERS ||--o{ COMPANIES : "has (1:1)"
    USERS ||--o{ STUDENTS : "has (1:1)"
    USERS ||--o{ AUDIT_LOGS : "generates"
    USERS ||--o{ NOTIFICATIONS : "receives"
    
    INSTITUTIONS ||--o{ STUDENTS : "enrolls"
    INSTITUTIONS ||--o{ DEPARTMENTS : "contains"
    
    COMPANIES ||--o{ OPPORTUNITIES : "posts"
    
    STUDENTS ||--o{ APPLICATIONS : "submits"
    STUDENTS ||--o{ STUDENT_LEARNING_PROGRESS : "tracks"
    
    OPPORTUNITIES ||--o{ APPLICATIONS : "receives"
    OPPORTUNITIES ||--o{ PAYMENTS : "generates"
    
    LEARNING_RESOURCES ||--o{ STUDENT_LEARNING_PROGRESS : "used_by"
    
    USERS {
        uuid id PK
        string email
        string password_hash
        enum role
        boolean is_verified
    }
    
    STUDENTS {
        uuid id PK
        uuid user_id FK
        string admission_number
        jsonb skills
        jsonb interests
    }
    
    COMPANIES {
        uuid id PK
        uuid user_id FK
        string name
        string industry
        string location
    }
    
    INSTITUTIONS {
        uuid id PK
        uuid user_id FK
        string name
        string code
    }
    
    OPPORTUNITIES {
        uuid id PK
        uuid company_id FK
        string title
        string description
        numeric stipend_amount
        string status
    }
    
    APPLICATIONS {
        uuid id PK
        uuid student_id FK
        uuid opportunity_id FK
        numeric match_score
        string status
    }
    
    PAYMENTS {
        uuid id PK
        uuid student_id FK
        uuid opportunity_id FK
        uuid company_id FK
        numeric amount
        string status
    }
```

## 4. Document Hub & AI Document Verification Diagram

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> AI_Verification_Process : Document Uploaded
    
    state AI_Verification_Process {
        [*] --> TextExtraction
        TextExtraction --> NLPAnalysis : OCR & Pattern Matching
        NLPAnalysis --> ValidationCheck
    }
    
    AI_Verification_Process --> Verified : Confidence > 85%
    AI_Verification_Process --> Rejected : Flagged as Fraud/Invalid
    AI_Verification_Process --> ManualReview : Confidence < 85%
    
    ManualReview --> Verified : Admin Approved
    ManualReview --> Rejected : Admin Rejected
    
    Verified --> [*]
    Rejected --> [*]
```

## 5. Software Design Conclusion

- **Design Pattern**: Microservices Architecture
- **Multi-Tenancy**: Handled via schema separation per institution (`inst_[slug]`) ensuring institutional data isolation and performance optimizations for academic units tracking.
- **AI Matching**: XGBoost/LightGBM model fed by parsed resumes (`resume_text`), students' `skills`, and opportunity requirements.
- **Payments Integration**: Tightly coupled with the M-Pesa API to distribute stipends to student endpoints efficiently.
