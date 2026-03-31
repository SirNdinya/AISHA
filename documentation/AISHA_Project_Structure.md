# AISHA: Project Structure Overview

This document provides a high-level overview of the AISHA (Student Attachment Placement System) project directory structure and the role of each component.

## 📂 Directory Structure

### 🧠 [ai-services](file:///home/wakanda_forever/Desktop/AISHA/ai-services)
- **Role**: The "Brain" of the project.
- **Tech Stack**: Python, FastAPI, Ollama (Local LLM), Scikit-learn, XGBoost.
- **Core Functions**: 
  - AI Matchmaking: Connecting students to companies based on skills and profiles.
  - Chatbot: 24/7 student support using local llama3.
  - NLP: Extracting data from documents and intent classification.

### ⚙️ [backend](file:///home/wakanda_forever/Desktop/AISHA/backend)
- **Role**: Core business logic and database orchestration.
- **Tech Stack**: Node.js, TypeScript, Express, Prisma ORM.
- **Core Functions**:
  - API Gateway: Handling authentication (JWT) and routing.
  - Payment Integration: M-Pesa (Daraja API) for stipend processing.
  - Document Management: Generating NITA and Insurance forms.
  - User Portals: Managing Students, Companies, and Institutions.

### 💻 [frontend](file:///home/wakanda_forever/Desktop/AISHA/frontend)
- **Role**: Web interface for all stakeholders.
- **Tech Stack**: React 18, Vite, TypeScript, Tailwind CSS, Chakra UI.
- **Core Functions**:
  - Student Dashboard: Matching visualization and learning recommendations.
  - Company Portal: Opportunity management and candidate filtering.
  - Institution Panel: Real-time placement tracking and analytics.

### 📱 [mobile](file:///home/wakanda_forever/Desktop/AISHA/mobile)
- **Role**: Portable access for students.
- **Tech Stack**: React Native / Expo.
- **Core Functions**:
  - On-the-go application tracking.
  - Real-time notifications and chat support.
  - Profile management.

### 🗄️ [database](file:///home/wakanda_forever/Desktop/AISHA/database)
- **Role**: Data persistence and schema management.
- **Tech Stack**: PostgreSQL (Supabase/Docker).
- **Contains**: 
  - SQL initialization scripts.
  - Migration logs.

### 📄 [documentation](file:///home/wakanda_forever/Desktop/AISHA/documentation)
- **Role**: Master repository for project knowledge.
- **Contains**:
  - Technical Specifications.
  - Project Proposals & Roadmaps.
  - User Stories & Acceptance Criteria.
  - System Design Diagrams.

### 🛠️ Key Support Files
- **[docker-compose.yml](file:///home/wakanda_forever/Desktop/AISHA/docker-compose.yml)**: Orchestrates all services (DB, Backend, AI).
- **[PROJECT_MEMORY.md](file:///home/wakanda_forever/Desktop/AISHA/PROJECT_MEMORY.md)**: Main context anchor for developers and AI agents.
- **[run-tests.sh](file:///home/wakanda_forever/Desktop/AISHA/run-tests.sh)**: Unified test runner for all project components.

---
*Created on: 2026-03-20*
