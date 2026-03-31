# Developer's Guide - AISHA (AISHA: AI-Powered Industrial Attachment Matching Platform)

Welcome to the AISHA Developer's Guide. This document provides the necessary information to get started with development, understand the system architecture, and follow project standards.

## 🏗️ System Architecture

AISHA is built as a multi-portal system with three main components:

1.  **Frontend**: Built with React, TypeScript, and Chakra UI.
2.  **Backend**: Node.js Express server with PostgreSQL for data persistence.
3.  **AI Services**: FastAPI-based microservices for AI matching and NLP tasks.

## 🛠️ Tech Stack & Constraints

- **Language**: TypeScript (Frontend/Backend), Python (AI Services).
- **Styling**: Chakra UI v3 / Vanilla CSS.
- **Database**: PostgreSQL (via Supabase or Docker).
- **AI**: Rasa (NLU), Scikit-learn (Matching).
- **PRIME DIRECTIVE**: **STRICT ZERO COST**. No paid APIs or services.

## 🚀 Getting Started

### 📂 Repository Structure
```bash
AISHA/
├── ai-services/    # FastAPI AI/ML Services
├── backend/        # Node.js Express Backend
├── frontend/       # React Student Portal
├── mobile/         # React Native Student App
└── documentation/  # Project Docs
```

### 1. Backend Setup
```bash
cd backend
npm install
# Ensure .env is configured with your database URI
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. AI Services Setup (Python)
> [!IMPORTANT]
> You MUST use a virtual environment to manage dependencies and avoid system-wide restrictions.

```bash
cd ai-services
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.main
```

## � Quick Navigation Tips

If you are inside one component folder (like `ai-services`) and want to move to another (like `frontend`), use `..` to go up one level first:

```bash
# From AISHA/ai-services to AISHA/frontend
cd ../frontend

# Or return to root first
cd /home/wakanda_forever/Desktop/AISHA
cd frontend
```

## �📜 Development Standards

1.  **NO DUMMY DATA**: Never use hardcoded strings for UI display that should come from the DB.
2.  **Type Safety**: Always define interfaces in `types/` for data structures.
3.  **Portals**: Keep portal routes and logic strictly isolated.
4.  **Zero Cost**: Any new dependency or service MUST be free.

## 🤝 Contributing
- Follow the branch naming convention: `feature/feature-name` or `fix/issue-name`.
- Update `PROJECT_WBS.md` upon completing work packages.
- Ensure all TypeScript errors are resolved before pushing.
