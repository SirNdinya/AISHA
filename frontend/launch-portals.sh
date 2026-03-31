#!/bin/bash

################################################################################
# AISHA Multi-Portal Launcher
# 
# This script launches all frontend portals on different ports:
# - Student Portal: 5173
# - Company Portal: 5174
# - Institution Portal: 5175
# - Admin Portal: 5176
################################################################################

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$PROJECT_ROOT"
LOGS_DIR="$PROJECT_ROOT/../logs/portals"

# Create logs directory
mkdir -p "$LOGS_DIR"

echo -e "${BOLD}${CYAN}================================${NC}"
echo -e "${BOLD}${CYAN}AISHA Multi-Portal Launcher${NC}"
echo -e "${BOLD}${CYAN}================================${NC}\n"

# Check if node_modules exists
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    cd "$FRONTEND_DIR"
    npm install
fi

# Kill any existing processes on these ports
echo -e "${BLUE}Cleaning up existing processes...${NC}"
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true
lsof -ti:5175 | xargs kill -9 2>/dev/null || true
lsof -ti:5176 | xargs kill -9 2>/dev/null || true

echo -e "${GREEN}✓ Ports cleared${NC}\n"

# Launch portals
echo -e "${BLUE}Starting portals...${NC}\n"

cd "$FRONTEND_DIR"

# Student Portal (5173)
echo -e "${CYAN}🎓 Starting Student Portal on port 5173...${NC}"
VITE_PORTAL=student VITE_PORT=5173 nohup npm run dev -- --port 5173 --host > "$LOGS_DIR/student.log" 2>&1 &
STUDENT_PID=$!

# Company Portal (5174)
echo -e "${CYAN}🏢 Starting Company Portal on port 5174...${NC}"
VITE_PORTAL=company VITE_PORT=5174 nohup npm run dev -- --port 5174 --host > "$LOGS_DIR/company.log" 2>&1 &
COMPANY_PID=$!

# Institution Portal (5175)
echo -e "${CYAN}🏛️  Starting Institution Portal on port 5175...${NC}"
VITE_PORTAL=institution VITE_PORT=5175 nohup npm run dev -- --port 5175 --host > "$LOGS_DIR/institution.log" 2>&1 &
INSTITUTION_PID=$!

# Admin Portal (5176)
echo -e "${CYAN}👤 Starting Admin Portal on port 5176...${NC}"
VITE_PORTAL=admin VITE_PORT=5176 nohup npm run dev -- --port 5176 --host > "$LOGS_DIR/admin.log" 2>&1 &
ADMIN_PID=$!

# Wait a moment for servers to start
sleep 3

echo -e "\n${GREEN}✓ All portals started successfully!${NC}\n"

# Display access information
echo -e "${BOLD}${CYAN}========================================${NC}"
echo -e "${BOLD}${CYAN}AISHA - Portal Access Points${NC}"
echo -e "${BOLD}${CYAN}========================================${NC}\n"

echo -e "${BOLD}🎓 Student Portal:${NC}     ${BLUE}http://localhost:5173${NC}"
echo -e "   Login: ${GREEN}student@test.com${NC} / ${GREEN}password123${NC}\n"

echo -e "${BOLD}🏢 Company Portal:${NC}     ${BLUE}http://localhost:5174${NC}"
echo -e "   Login: ${GREEN}company@test.com${NC} / ${GREEN}password123${NC}\n"

echo -e "${BOLD}🏛️  Institution Portal:${NC} ${BLUE}http://localhost:5175${NC}"
echo -e "   Login: ${GREEN}institution@test.com${NC} / ${GREEN}password123${NC}\n"

echo -e "${BOLD}👤 Admin Portal:${NC}       ${BLUE}http://localhost:5176${NC}"
echo -e "   Login: ${GREEN}admin@test.com${NC} / ${GREEN}password123${NC}\n"

echo -e "${BOLD}${CYAN}========================================${NC}\n"

echo -e "${YELLOW}Process IDs:${NC}"
echo -e "  Student:     $STUDENT_PID"
echo -e "  Company:     $COMPANY_PID"
echo -e "  Institution: $INSTITUTION_PID"
echo -e "  Admin:       $ADMIN_PID\n"

echo -e "${YELLOW}Logs:${NC} $LOGS_DIR/\n"

echo -e "${BLUE}Press Ctrl+C to stop all portals${NC}\n"

# Trap Ctrl+C to kill all processes
trap "echo -e '\n${YELLOW}Stopping all portals...${NC}'; kill $STUDENT_PID $COMPANY_PID $INSTITUTION_PID $ADMIN_PID 2>/dev/null; exit" INT

# Wait for all background processes
wait
