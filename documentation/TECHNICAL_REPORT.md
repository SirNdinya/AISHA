# AISHA System Technical Architecture Report

This report provides a comprehensive overview of how to interact with the AISHA system, its API dependencies, and the inner workings of its AI components.

## 1. Database Access & Management
The system uses **PostgreSQL** as its primary relational database.

### Connection Details
- **Default Host**: `postgres` (internal to Docker) or `localhost` (if port-forwarded)
- **Port**: `5432`
- **Credentials**: Specified in the root `.env` file (Default: `saps_user` / `saps_password`)
- **Database Name**: `saps_db`

### How to Manipulate Data
- **Direct Access**: You can use tools like `psql`, pgAdmin, or DBeaver to connect using the credentials above.
- **ORM**: The Backend (Node.js/Prisma) and AI Services (Python/SQLAlchemy) use ORMs to interact with the database. To modify schema or seeds:
    - **Backend**: Update `backend/prisma/schema.prisma`.
    - **AI Services**: Update `ai-services/app/models.py`.

## 2. API Architecture & Manipulation
The system follows a microservices-inspired architecture with a centralized API gateway.

### Core Endpoints
- **API Gateway (Node.js)**: `http://localhost:3000/api/v1`
    - Handles Auth, Applications, and User Management.
- **AI Services (FastAPI)**: `http://localhost:8000`
    - Handles NLP, Matching, and Web Scouting.

### Manipulating APIs
- Use tools like **Postman** or **cURL** to send requests.
- **Authentication**: Most endpoints require a `Bearer <JWT_TOKEN>` in the `Authorization` header.
- **FastAPI Docs**: You can view the AI API documentation and test endpoints interactively at `http://localhost:8000/docs`.

## 3. External API Dependencies
The system integrates with several external services to provide its full functionality:

| Service | Purpose | Source |
| :--- | :--- | :--- |
| **M-Pesa Daraja API** | Processing stipends and student payments. | Safaricom Developer Portal |
| **SMTP (Gmail/SendGrid)** | Sending automated email notifications. | External Provider |
| **Search Engines** | Autonomous scouting for courses/certifications. | Dynamic (via `scraper_service.py`) |

## 4. Chatbot & AI Engine
The chatbot, **AISHA (Autonomous Interface for Student Hired Assistance)**, is designed for high efficiency and local execution.

### How it Works
- **Model**: It uses **Sentence Transformers** (`all-MiniLM-L6-v2`) for semantic similarity.
- **Intent Recognition**: Instead of hardcoded keywords, it converts user queries into mathematical vectors (embeddings) and compares them to pre-defined "intents" (e.g., `application_status`, `explain_match`).
- **External API Keys**: 
    - **Current Implementation**: It runs **LOCALLY**. It does **NOT** require external API keys like OpenAI or Anthropic. This makes it free to run without subscription costs.
    - **Customization**: If you wish to upgrade to GPT-4 or similar, you can modify `ai-services/app/services/chatbot_service.py` to call an external API.

### Token Limits & Costs
- **Token Limits**: Since the model runs locally on your server/CPU, there are **no hard token limits** or usage quotas. You are only limited by your server's RAM and processing power.
- **Performance**: The model used is lightweight (MiniLM), ensuring fast responses without needing a GPU.

## 5. Post-Setup: Accessing the System
After completing the `setup.sh` script, use the following credentials to access the various portals. The password for ALL default accounts is `password123`.

### 5.1 Portal Access Table
| Role | Test Account | Web Portal URL |
| :--- | :--- | :--- |
| **Student** | `student@test.com` | `http://localhost:5173` |
| **Admin** | `admin@test.com` | `http://localhost:5173` |
| **Company HR** | `kcb@test.com` | `http://localhost:5173` |
| **Institution** | `uon@test.com` | `http://localhost:5173` |

### 5.2 Next Steps after setup.sh
1.  **Verify Services**: Check the `logs/` directory for any startup errors.
2.  **Login**: Use the credentials above to explore each role's dashboard.
3.  **Mobile Access**: If you started the mobile service, students can log in via the Expo dashboard (usually `http://localhost:8081` or terminal QR code).
4.  **API Testing**: Visit `http://localhost:8000/docs` to test the AI services independently.

## 6. Summary Table
| Feature | Implementation | Key/License Required? |
| :--- | :--- | :--- |
| **Database** | PostgreSQL | No (Open Source) |
| **Chatbot** | Sentence-Transformers (Local) | No (Open Source) |
| **Payments** | M-Pesa API | Yes (Consumer Key/Secret) |
| **Email** | SMTP | Yes (App Password) |
| **Web Scout** | Custom Scraper | No (Uses public search URLs) |

> [!TIP]
> To modify the chatbot's knowledge or responses, edit the `self.intents` dictionary in `ai-services/app/services/chatbot_service.py`.
