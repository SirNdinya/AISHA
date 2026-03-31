import os
import subprocess

# Define diagrams
diagrams = {
    "1_Structural_Class_Diagram": {
        "title": "Class Diagram",
        "desc": "This class diagram illustrates the backend models and their relationships, detailing the properties and methods for primary entities: Users, Students, Companies, Institutions, and Opportunities.",
        "code": """classDiagram
    class User {
        +UUID id
        +String email
        +String role
        +login()
        +logout()
    }
    class Student {
        +UUID id
        +String admission_number
        +List skills
        +applyTo(Opportunity)
    }
    class Company {
        +UUID id
        +String name
        +String industry
        +postOpportunity()
        +reviewApplication()
    }
    class Institution {
        +UUID id
        +String name
        +String code
        +monitorStudents()
    }
    class Platform {
        <<Singleton>>
        +MatchingEngine match_engine
        +runAIRecommendations()
        +generateDocuments()
    }
    class Opportunity {
        +UUID id
        +String title
        +Number stipend
    }
    User <|-- Student
    User <|-- Company
    User <|-- Institution
    Company "1" *-- "many" Opportunity : posts
    Student "many" -- "many" Opportunity : applies
    Institution "1" -- "many" Student : oversees
    Platform -- Opportunity : manages
    Platform -- Student : recommends
"""
    },
    "2_Structural_Component_Diagram": {
        "title": "Component Diagram",
        "desc": "Shows the high-level structural components of the system, including the frontend UI components accessed by the actors, the API gateway, microservices, and databases.",
        "code": """graph TD
    subgraph Frontend Subsystems
        UI_Stu[Student Portal UI]
        UI_Comp[Company Portal UI]
        UI_Inst[Institution Portal UI]
    end
    subgraph Backend Core Platform
        Gateway[API Gateway]
        AuthC[Auth Component]
        UserC[User Profile Component]
        MatchC[Matching ML Component]
        DocGen[Document Generation Service]
    end
    subgraph Storage
        DB[(PostgreSQL)]
        Cache[(Redis Cache)]
    end
    UI_Stu --> Gateway
    UI_Comp --> Gateway
    UI_Inst --> Gateway
    Gateway --> AuthC
    Gateway --> UserC
    Gateway --> MatchC
    Gateway --> DocGen
    AuthC --> DB
    UserC --> DB
    MatchC --> Cache
    MatchC --> DB
    DocGen --> DB
"""
    },
    "3_Structural_Deployment_Diagram": {
        "title": "Deployment Diagram",
        "desc": "Demonstrates how software components are mapped to the physical or cloud hardware architecture for deployment.",
        "code": """graph TD
    subgraph Client Devices
        Web_Stu[Student Browser]
        Web_Comp[Company Browser]
        Web_Inst[Institution Browser]
    end
    subgraph Cloud Infrastructure (Platform)
        subgraph CDN
            Cloudflare[Cloudflare CDN]
        end
        subgraph Frontend Hosting
            FE[React Applications]
        end
        subgraph Backend Servers
            LB[Load Balancer]
            NodeAPI[Node.js API Server]
            PyAPI[Python ML API]
        end
        subgraph Databases
            DB[(PostgreSQL)]
            Redis[(Redis Cache)]
        end
    end
    
    Web_Stu --> Cloudflare
    Web_Comp --> Cloudflare
    Web_Inst --> Cloudflare
    Cloudflare --> FE
    Cloudflare --> LB
    LB --> NodeAPI
    LB --> PyAPI
    NodeAPI --> DB
    NodeAPI --> Redis
    PyAPI --> DB
"""
    },
    "4_Structural_Package_Diagram": {
        "title": "Package Diagram",
        "desc": "Illustrates the organization of the codebase packages and their dependencies, primarily focusing on the backend node/python packages.",
        "code": """graph TD
    subgraph AISHA_Platform
        pkg_auth[Auth Module]
        pkg_students[Student Module]
        pkg_companies[Company Module]
        pkg_inst[Institution Module]
        pkg_match[AI Matching Module]
        pkg_docs[Document Generator Module]
        pkg_db[Database Connector]
    end
    
    pkg_auth --> pkg_db
    pkg_students --> pkg_db
    pkg_companies --> pkg_db
    pkg_inst --> pkg_db
    pkg_match --> pkg_students
    pkg_match --> pkg_companies
    pkg_match --> pkg_db
    pkg_docs --> pkg_students
    pkg_docs --> pkg_companies
"""
    },
    "5_Structural_Object_Diagram": {
        "title": "Object Diagram",
        "desc": "Shows a snapshot of specific instances of classes at a moment in time (e.g., a student overseen by an institution, applying for a company opportunity).",
        "code": """classDiagram
    class jku_Institution {
        id = "inst-001"
        name = "JKUAT"
    }
    class johnDoe_Student {
        id = "std-123"
        name = "John Doe"
        skills = ["Python", "React"]
    }
    class aisha_Platform {
        status = "Active"
        version = "1.0"
    }
    class safaricom_Company {
        id = "comp-456"
        name = "Safaricom"
    }
    class swIntern_Opportunity {
        id = "opp-789"
        title = "Software Intern"
        status = "Open"
    }
    class app001_Application {
        id = "app-001"
        status = "Pending"
        match_score = 92
    }
    
    jku_Institution "1" -- "many" johnDoe_Student : oversees
    johnDoe_Student "1" -- "1" app001_Application : creates
    safaricom_Company "1" -- "1" swIntern_Opportunity : posts
    app001_Application "1" -- "1" swIntern_Opportunity : targets
    aisha_Platform -- app001_Application : processes
"""
    },
    "6_Structural_Composite_Structure_Diagram": {
        "title": "Composite Structure Diagram",
        "desc": "Shows the internal structure of the AI Matching Engine component and its interaction points (ports).",
        "code": """graph LR
    subgraph Platform_ML_Engine
        direction TB
        Port_In[Inbound Student/Opp Data]
        Port_Out[Outbound Rankings]
        
        subgraph Internal_Processing
            DataPrep[Data Preprocessor]
            XGB[XGBoost Model]
            Ranker[Scoring & Ranking]
        end
        
        Port_In --> DataPrep
        DataPrep --> XGB
        XGB --> Ranker
        Ranker --> Port_Out
    end
"""
    },
    "7_Structural_Profile_Diagram": {
        "title": "Profile Diagram",
        "desc": "Used in UML to define custom stereotypes. This diagram shows the custom profiles created for AI/ML services within the Platform.",
        "code": """classDiagram
    class PlatformComponent {
        <<stereotype>>
    }
    class ML_Model {
        <<stereotype>>
        +predict()
        +train()
    }
    class AISHA_Matcher {
        <<ML_Model>>
        +predictRankings()
    }
    class AISHA_DocGen {
        <<ML_Model>>
        +generateFormalLetters()
    }
    
    PlatformComponent <|-- ML_Model
    ML_Model <|-- AISHA_Matcher
    ML_Model <|-- AISHA_DocGen
"""
    },
    "8_Behavioral_Use_Case_Diagram": {
        "title": "Use Case Diagram",
        "desc": "Shows the different user actors (Student, Company, Institution) in the system and the broad actions or use cases they can perform via the Platform.",
        "code": """flowchart LR
    Actor1([Student])
    Actor2([Company])
    Actor3([Institution])
    
    subgraph AISHA Platform
        UC1(Register / Manage Profile)
        UC2(Apply for Attachment)
        UC3(Post Opportunity)
        UC4(Review Applicants)
        UC5(Monitor Student Progress)
        UC6(Generate Formal Docs)
    end
    
    Actor1 --> UC1
    Actor1 --> UC2
    Actor1 --> UC6
    
    Actor2 --> UC1
    Actor2 --> UC3
    Actor2 --> UC4
    
    Actor3 --> UC1
    Actor3 --> UC5
"""
    },
    "9_Behavioral_Activity_Diagram": {
        "title": "Activity Diagram",
        "desc": "Shows the flow of activities for the Student Application Process, highlighting the interaction between the Student, the Platform, and the Company.",
        "code": """flowchart TD
    Start((Start)) --> A[Student: Views Dashboard]
    A --> B[Student: Searches Opportunities]
    B --> C[Platform: Generates AI Matches]
    C --> D[Student: Reviews Recommendations]
    D --> E[Student: Applies for Opportunity]
    E --> F[Platform: Forwards Application]
    F --> G[Company: Reviews Application]
    G --> H{Company: Accept?}
    H -- No --> I[Platform: Sends Rejection Notice] --> End((End))
    H -- Yes --> J[Platform: Automatically Generates Contracts & Letters]
    J --> End
"""
    },
    "10_Behavioral_Sequence_Diagram": {
        "title": "Sequence Diagram",
        "desc": "Demonstrates the sequential flow of messages between the actors and the platform during an application submission.",
        "code": """sequenceDiagram
    actor Student
    participant Platform
    actor Company
    actor Institution
    
    Student->>Platform: Submit Application Details
    Platform->>Platform: Calculate Matching Score
    Platform-->>Student: Confirm Application Submitted
    Platform->>Company: Notify of New Applicant
    Company->>Platform: Review & Accept Applicant
    Platform->>Platform: Generate Official Documents
    Platform-->>Student: Notify Acceptance & Provide Docs
    Platform->>Institution: Update Student Placement Status
"""
    },
    "11_Behavioral_State_Machine_Diagram": {
        "title": "State Machine Diagram",
        "desc": "Shows the possible states and transitions for an Application entity within the Platform.",
        "code": """stateDiagram-v2
    [*] --> SUBMITTED : Student Applies
    SUBMITTED --> UNDER_REVIEW : Company opens application
    UNDER_REVIEW --> ACCEPTED : Company Approves
    UNDER_REVIEW --> REJECTED : Company Declines
    ACCEPTED --> ACTIVE_PLACEMENT : Placement Date Starts
    ACTIVE_PLACEMENT --> COMPLETED : End Date Reached (Institution Notified)
    REJECTED --> [*]
    COMPLETED --> [*]
"""
    },
    "12_Behavioral_Communication_Diagram": {
        "title": "Communication Diagram",
        "desc": "Highlights the network of communications between the key actors and platform subsystems.",
        "code": """flowchart TD
    Stu[(1: Student)]
    Comp[(2: Company)]
    Inst[(3: Institution)]
    App[(4: AISHA Core)]
    
    Stu -- "1.1: Submit Profile" --> App
    Comp -- "1.2: Post Role" --> App
    App -- "1.3: Recommend Roles" --> Stu
    App -- "1.4: Forward Applicant" --> Comp
    App -- "1.5: Sync Status" --> Inst
"""
    },
    "13_Behavioral_Timing_Diagram": {
        "title": "Timing Diagram",
        "desc": "Shows the typical timing and lifecycle length of a student participating in the attachment process via the platform.",
        "code": """gantt
    title Student Attachment Lifecycle
    dateFormat  YYYY-MM-DD
    section Preparation
    Institution Register Student :a1, 2026-04-01, 5d
    Student Complete Profile :a2, after a1, 3d
    section Matching
    Platform Recommends :b1, after a2, 1d
    Student Applies :b2, after b1, 2d
    Company Reviews :b3, after b2, 5d
    section Placement
    Generate Docs :c1, after b3, 1d
    Attachment Period :c2, after c1, 60d
"""
    },
    "14_Behavioral_Interaction_Overview_Diagram": {
        "title": "Interaction Overview Diagram",
        "desc": "A high-level view that ties together different activity states for the actors, visualizing how distinct interaction sequences combine into a broader flow.",
        "code": """stateDiagram-v2
    state "Institution Onboarding" as Inst_Flow
    state "Student Setup" as Stu_Flow
    state "Company Opportunity Flow" as Comp_Flow
    state "Platform Matching/Placement" as Match_Flow
    
    [*] --> Inst_Flow
    Inst_Flow --> Stu_Flow : Uploads Roster
    [*] --> Comp_Flow : Independent Setup
    Stu_Flow --> Match_Flow : Ready
    Comp_Flow --> Match_Flow : Roles Opened
    Match_Flow --> [*] : Placements Finalized
"""
    },
    "15_Data_Entity_Relationship_Diagram": {
        "title": "Entity-Relationship Diagram (ERD)",
        "desc": "Displays the relationship between core database tables representing the key players.",
        "code": """erDiagram
    PLATFORM_USERS ||--o{ STUDENTS : "is a"
    PLATFORM_USERS ||--o{ COMPANIES : "is a"
    PLATFORM_USERS ||--o{ INSTITUTIONS : "is a"
    
    INSTITUTIONS ||--o{ STUDENTS : "regulates"
    COMPANIES ||--o{ OPPORTUNITIES : "creates"
    STUDENTS ||--o{ APPLICATIONS : "submits"
    OPPORTUNITIES ||--o{ APPLICATIONS : "receives"
    
    PLATFORM_USERS {
        uuid id
        string email
        string role
    }
    STUDENTS {
        uuid id
        string admission_number
    }
    COMPANIES {
        uuid id
        string name
    }
    INSTITUTIONS {
        uuid id
        string code
    }
"""
    },
    "16_Data_Flow_Diagram": {
        "title": "Data Flow Diagram (DFD)",
        "desc": "Illustrates how unstructured student data (resumes) flow through the platform to be converted to vector embeddings for matching with company requirements.",
        "code": """graph TD
    A(Student) -->|Uploads CV| B(Platform Parser)
    B -->|Raw Text| C{Data Cleaner}
    C -->|Clean Text| D(Platform Embedding Engine)
    D -->|Float Array| E[(Vector DB)]
    F(Company) -->|Posts Job Desc| D
    D -->|Query Vector| G(Similarity Search)
    E --> G
    G -->|Ranked Matches| H(Frontend Dashboard)
    H -->|Views Matches| A
"""
    },
    "17_Architecture_System_Context": {
        "title": "System Context Diagram (C4 Context)",
        "desc": "A high-level view showing the AISHA software system in relation to the primary human actors (Student, Company, Institution). External non-human APIs have been omitted strictly to focus on the key human players.",
        "code": """C4Context
    title System Context diagram for AISHA
    
    Person(student, "Student", "A university student seeking an attachment.")
    Person(company, "Company", "An HR rep or manager looking for interns.")
    Person(institution, "Institution", "A university admin monitoring students.")
    System(aisha, "AISHA Platform", "AI-Powered Matching Engine and Document Generator.")
    
    Rel(student, aisha, "Applies for roles, views matches")
    Rel(company, aisha, "Posts roles, reviews applicants")
    Rel(institution, aisha, "Monitors student placements and progress")
"""
    },
    "18_Architecture_System_Architecture": {
        "title": "System Architecture Diagram",
        "desc": "Shows the logical architecture dividing the application into layered boundaries (Presentation, Business, Data) strictly interacting with the 3 main actors.",
        "code": """graph LR
    subgraph Actors
        S[Student]
        C[Company]
        I[Institution]
    end
    subgraph AISHA Platform
        subgraph Presentation Layer
            Web[Web Portals]
        end
        subgraph Business Logic Layer
            Auth[Auth Module]
            Core[AI Core Matching]
        end
        subgraph Data Layer
            RelDB[(PostgreSQL)]
        end
    end
    
    S --> Web
    C --> Web
    I --> Web
    Web --> Auth
    Web --> Core
    Auth --> RelDB
    Core --> RelDB
"""
    },
    "19_C4_Container_Diagram": {
        "title": "C4 Container Diagram",
        "desc": "Zooms into the AISHA Platform boundary to show the containers (SPA, API, ML Service) interacting with the key players.",
        "code": """C4Container
    title Container diagram for AISHA Platform
    
    Person(student, "Student", "Views matches")
    Person(company, "Company", "Posts roles")
    Person(institution, "Institution", "Monitors")
    System_Boundary(aisha, "AISHA Platform") {
        Container(spa, "Single Page App", "React, TypeScript", "Provides the main UI portals")
        Container(api, "API Application", "Node/Express", "Core business logic")
        Container(ml, "ML Microservice", "FastAPI/Python", "Handles matching")
        ContainerDb(db, "Database", "PostgreSQL", "Stores user and system data")
    }
    
    Rel(student, spa, "Visits", "HTTPS")
    Rel(company, spa, "Visits", "HTTPS")
    Rel(institution, spa, "Visits", "HTTPS")
    Rel(spa, api, "API calls", "JSON/HTTPS")
    Rel(api, ml, "Requests ML inferences", "gRPC/HTTP")
    Rel(api, db, "Reads/writes", "TCP/SQL")
    Rel(ml, db, "Reads historical data", "TCP/SQL")
"""
    },
    "20_C4_Component_Diagram": {
        "title": "C4 Component Diagram",
        "desc": "Zooms into the API Application container to show its internal components.",
        "code": """C4Component
    title Component diagram for Platform API
    
    Container(spa, "Frontend Apps", "React", "UI Portals for Actors")
    
    Container_Boundary(api, "Platform API") {
        Component(ctrl, "Controllers", "Express Router", "Routes requests from actors")
        Component(service_stu, "Student Services", "TypeScript", "Logic for students")
        Component(service_comp, "Company Services", "TypeScript", "Logic for companies")
        Component(service_inst, "Institution Services", "TypeScript", "Logic for institutions")
        Component(repo, "Repositories", "Prisma ORM", "DB access")
    }
    
    ContainerDb(db, "Database", "PostgreSQL", "Stores data")
    
    Rel(spa, ctrl, "API calls", "JSON/HTTPS")
    Rel(ctrl, service_stu, "Delegates")
    Rel(ctrl, service_comp, "Delegates")
    Rel(ctrl, service_inst, "Delegates")
    Rel(service_stu, repo, "Uses")
    Rel(service_comp, repo, "Uses")
    Rel(service_inst, repo, "Uses")
    Rel(repo, db, "Reads/Writes", "SQL")
"""
    },
    "21_Architecture_BPMN": {
        "title": "Business Process Model and Notation (BPMN)",
        "desc": "A standard flowchart representation representing the business process strictly between the 3 actors and the platform.",
        "code": """flowchart TD
    Start((Start)) --> A[Institution: Registers Student Data to Platform]
    A --> B[Student: Completes Profile on Platform]
    B --> C[Platform: Generates AI Matches]
    C --> D[Student: Applies to Match]
    D --> E[Company: Reviews Applicant on Platform]
    E --> F{Company: Accept?}
    F -- No --> C
    F -- Yes --> G[Platform: Finalizes Placement & Notifies Institution]
    G --> End((End))
"""
    }
}

def generate_diagrams():
    output_dir = "diagrams_output"
    os.makedirs(output_dir, exist_ok=True)
    
    # We will only generate PNGs here as build_sdd.py does the Word compilation
    for key, info in diagrams.items():
        print(f"Generating {key}...")
        mmd_path = os.path.join(output_dir, f"{key}.mmd")
        png_path = os.path.join(output_dir, f"{key}.png")
        
        # Write mermaid code to file
        with open(mmd_path, "w") as f:
            f.write(info["code"])
        
        # Call mermaid-cli
        # Suppress output to avoid spamming the console
        subprocess.run(["npx", "-y", "@mermaid-js/mermaid-cli@10.8.0", "-i", mmd_path, "-o", png_path, "-b", "transparent"], check=False)
        
    print(f"\\nAll diagrams successfully generated in the {output_dir}/ folder.")

if __name__ == "__main__":
    generate_diagrams()
