#!/bin/bash

# AISHA Project - Comprehensive Setup Script
# This script initializes all components of the SAPS ecosystem.

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}   AISHA - Student Attachment Placement System  ${NC}"
echo -e "${BLUE}            Setup & Initialization              ${NC}"
echo -e "${BLUE}==============================================${NC}"

# 0. Infrastructure Only Mode
if [[ "$1" == "--infra" ]]; then
    echo -e "${BLUE}Activating Persistent Infrastructure (Always-On)...${NC}"
    
    # Ensure Docker daemon starts on boot
    if command -v systemctl &> /dev/null; then
        echo -e "${BLUE}Enabling Docker service to start on system boot...${NC}"
        sudo systemctl enable docker --quiet 2>/dev/null || true
    fi

    if docker compose version &> /dev/null; then
        docker compose up -d postgres redis pgadmin
    else
        docker-compose up -d postgres redis pgadmin
    fi
    echo -e "${GREEN}✓ Infrastructure services are now configured to start automatically with your system.${NC}"
    echo -e "${CYAN}Access pgAdmin at http://localhost:8888${NC}"
    exit 0
fi

# 1. Check Prerequisites
echo -e "\n${YELLOW}[1/6] Checking Prerequisites...${NC}"

check_cmd() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed.${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ $1 found: $($1 --version | head -n 1)${NC}"
}

check_cmd node
check_cmd npm
check_cmd python3
check_cmd git
check_cmd docker || echo -e "${YELLOW}! Docker not found (Required for local DB).${NC}"
check_cmd docker-compose || docker compose version &> /dev/null || echo -e "${YELLOW}! Docker Compose not found.${NC}"

# 2. Environment Configuration
echo -e "\n${YELLOW}[2/6] Configuring Environment Variables...${NC}"

setup_env() {
    dir=$1
    if [ -f "$dir/.env.example" ]; then
        if [ ! -f "$dir/.env" ]; then
            cp "$dir/.env.example" "$dir/.env"
            echo -e "${GREEN}✓ Created $dir/.env from example.${NC}"
        else
            echo -e "${BLUE}! $dir/.env already exists, skipping.${NC}"
        fi
    fi
}

setup_env "."
setup_env "backend"
setup_env "frontend"
setup_env "ai-services"
setup_env "mobile"

# 3. Backend Setup
echo -e "\n${YELLOW}[3/6] Initializing Backend...${NC}"
if [ -d "backend" ]; then
    cd backend
    npm install --quiet
    cd ..
    echo -e "${GREEN}✓ Backend dependencies installed.${NC}"
else
    echo -e "${RED}! Backend directory not found.${NC}"
fi

# 4. AI Services Setup
echo -e "\n${YELLOW}[4/6] Initializing AI Services (Python Venv)...${NC}"
if [ -d "ai-services" ]; then
    cd ai-services
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        echo -e "${GREEN}✓ Python virtual environment created.${NC}"
    fi
    source venv/bin/activate
    pip install -q --upgrade pip
    
    echo -e "${BLUE}Installing CPU-optimized Torch (Saves ~3GB space)...${NC}"
    pip install -q torch --index-url https://download.pytorch.org/whl/cpu
    
    pip install -q -r requirements.txt
    deactivate
    cd ..
    echo -e "${GREEN}✓ AI Services dependencies installed.${NC}"
    
    # 4.5. Ollama Setup
    echo -e "\n${YELLOW}[4.5/6] Checking Ollama (AI Brain)...${NC}"
    if ! command -v ollama &> /dev/null; then
        echo -e "${YELLOW}! Ollama not found. It is required for AISHA's AI features.${NC}"
        echo -e "${BLUE}Automatically running Ollama setup...${NC}"
        bash ai-services/ollama_setup.sh
    else
        echo -e "${GREEN}✓ Ollama is already installed.${NC}"
        echo -e "${BLUE}Automatically pulling/updating the Llama3 model...${NC}"
        ollama pull llama3
    fi
else
    echo -e "${RED}! AI Services directory not found.${NC}"
fi

# 5. Frontend Setup
echo -e "\n${YELLOW}[5/6] Initializing Frontend...${NC}"
if [ -d "frontend" ]; then
    cd frontend
    npm install --quiet
    cd ..
    echo -e "${GREEN}✓ Frontend dependencies installed.${NC}"
else
    echo -e "${RED}! Frontend directory not found.${NC}"
fi

# 6. Mobile Setup (Optional/If exists)
echo -e "\n${YELLOW}[6/6] Initializing Mobile...${NC}"
if [ -d "mobile" ]; then
    cd mobile
    npm install --quiet
    cd ..
    echo -e "${GREEN}✓ Mobile dependencies installed.${NC}"
fi

# 7. Infrastructure Setup
echo -e "\n${YELLOW}[7/7] Infrastructure (Database & Redis)...${NC}"
if command -v docker &> /dev/null; then
    echo -e "${BLUE}Starting infrastructure services (PostgreSQL & Redis)...${NC}"
    echo -e "${BLUE}Cleaning up any existing containers...${NC}"
    # Stop and remove existing containers to avoid 'ContainerConfig' error
    docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
    
    echo -e "${BLUE}Starting fresh containers...${NC}"
    # Prefer docker compose v2 over v1
    if docker compose version &> /dev/null; then
        docker compose up -d postgres redis pgadmin
    elif command -v docker-compose &> /dev/null; then
        docker-compose up -d postgres redis pgadmin
    else
        echo -e "${RED}! Docker Compose not found. Starting containers manually...${NC}"
        docker run -d --name saps_postgres \
            -e POSTGRES_USER=aisha_user \
            -e POSTGRES_PASSWORD=aisha_password \
            -e POSTGRES_DB=aisha_db \
            -p 5432:5432 \
            -v aisha_postgres_data:/var/lib/postgresql/data \
            postgres:15-alpine
        docker run -d --name saps_redis \
            -p 6379:6379 \
            -v aisha_redis_data:/data \
            redis:alpine
    fi
    
    # Wait for PostgreSQL to be ready
    echo -e "${BLUE}Waiting for PostgreSQL to initialize...${NC}"
    sleep 5
    
    echo -e "${GREEN}✓ Infrastructure services started (PostgreSQL & Redis).${NC}"
else
    echo -e "${RED}! Docker not found. Cannot start infrastructure automatically.${NC}"
fi

# 8. Launch Application Services
echo -e "\n${YELLOW}[8/8] Launching Application Services...${NC}"
mkdir -p logs
echo -e "${BLUE}Starting services in the background...${NC}"

# Backend
echo -e "${BLUE}1. Launching Backend...${NC}"
(cd backend && nohup npm run dev > ../logs/backend.log 2>&1) &

# AI Services
echo -e "${BLUE}2. Launching AI Services (Port 8001)...${NC}"
(cd ai-services && nohup bash -c "source venv/bin/activate && uvicorn app.main:app --reload --port 8001" > ../logs/ai-services.log 2>&1) &

# Frontend (Multi-Portal)
echo -e "${BLUE}3. Launching Frontend Portals...${NC}"
(cd frontend && nohup ./launch-portals.sh > ../logs/portals.log 2>&1) &

# Mobile (Optional, started by default in this simple version)
if [ -d "mobile" ]; then
    echo -e "${BLUE}4. Launching Mobile...${NC}"
    (cd mobile && nohup npm start > ../logs/mobile.log 2>&1) &
fi

echo -e "${GREEN}✓ All services have been initiated!${NC}"
echo -e "${YELLOW}Logs are available in the ./logs directory:${NC}"
echo -e " - Backend:  tail -f logs/backend.log"
echo -e " - AI:       tail -f logs/ai-services.log"
echo -e " - Portals:  tail -f logs/portals.log"

echo -e "\n${BOLD}${CYAN}========================================${NC}"
echo -e "${BOLD}${CYAN}AISHA - Access Points${NC}"
echo -e "${BOLD}${CYAN}========================================${NC}\n"

echo -e "${BOLD}🎓 Student Portal:${NC}     ${BLUE}http://localhost:5173${NC}"
echo -e "   Login: ${GREEN}student@test.com${NC} / ${GREEN}password123${NC}\n"

echo -e "${BOLD}🏢 Company Portal:${NC}     ${BLUE}http://localhost:5174${NC}"
echo -e "   Login: ${GREEN}company@test.com${NC} / ${GREEN}password123${NC}\n"

echo -e "${BOLD}🏛️  Institution Portal:${NC} ${BLUE}http://localhost:5175${NC}"
echo -e "   Login: ${GREEN}institution@test.com${NC} / ${GREEN}password123${NC}\n"

echo -e "${BOLD}👤 Admin Portal:${NC}       ${BLUE}http://localhost:5176${NC}"
echo -e "   Login: ${GREEN}admin@test.com${NC} / ${GREEN}password123${NC}\n"

echo -e "${BOLD}🔌 API Gateway:${NC}        ${BLUE}http://localhost:3000${NC}"
echo -e "${BOLD}🤖 AI Services:${NC}        ${BLUE}http://localhost:8001/docs${NC}"
echo -e "${BOLD}🗄️  Database Manager:${NC}  ${BLUE}http://localhost:8888${NC}"
echo -e "   Login: ${GREEN}admin@saps.com${NC} / ${GREEN}admin_password${NC}\n"

if [ -d "mobile" ]; then
    echo -e "${BOLD}📱 Mobile App:${NC}         Use Expo Go app\n"
fi

echo -e "${BOLD}${CYAN}========================================${NC}\n"

echo -e "\n${GREEN}==============================================${NC}"
echo -e "${GREEN}        AISHA Setup Fully Complete!          ${NC}"
echo -e "${GREEN}==============================================${NC}"
