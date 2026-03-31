# AISHA Logic Flows

This document contains visual representations of key system logic flows using Mermaid diagrams.

## 1. Student Registration Sync (Institutional Database)

This flow illustrates how the system synchronizes student identity data from an institutional database (tenant schema) using a registration number.

```mermaid
sequenceDiagram
    participant U as User
    participant S as StudentSettings (Frontend)
    participant B as StudentController (Backend)
    participant I as InstitutionSync (Tenant DB)

    U->>S: Enters Reg Number
    S->>B: POST /students/sync-profile
    B->>I: Fetch from tenant schema
    alt Success
        I-->>B: Return Student Data
        B->>B: Update main DB (SYNCED)
        B-->>S: 200 OK + Updated Profile
        S->>U: Show Success Toast & Update Names
    else Not Found
        I-->>B: Return 404
        B-->>S: 404 Error
        S->>U: Show Error Toast "Registration number not found"
    end
```
