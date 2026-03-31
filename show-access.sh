#!/bin/bash

# AISHA System - Quick Access Guide
# Generated: $(date)

echo -e "\033[1m\033[36m========================================"
echo -e "AISHA - Access Points"
echo -e "========================================\033[0m\n"

echo -e "\033[1m🎓 Student Portal:\033[0m     \033[34mhttp://localhost:5173\033[0m"
echo -e "   Login: \033[32mstudent@test.com\033[0m / \033[32mpassword123\033[0m\n"

echo -e "\033[1m🏢 Company Portal:\033[0m     \033[34mhttp://localhost:5174\033[0m"
echo -e "   Login: \033[32mcompany@test.com\033[0m / \033[32mpassword123\033[0m\n"

echo -e "\033[1m🏛️  Institution Portal:\033[0m \033[34mhttp://localhost:5175\033[0m"
echo -e "   Login: \033[32minstitution@test.com\033[0m / \033[32mpassword123\033[0m\n"

echo -e "\033[1m👤 Admin Portal:\033[0m       \033[34mhttp://localhost:5176\033[0m"
echo -e "   Login: \033[32madmin@test.com\033[0m / \033[32mpassword123\033[0m\n"

echo -e "\033[1m🔌 API Gateway:\033[0m        \033[34mhttp://localhost:3000\033[0m"
echo -e "\033[1m🤖 AI Services:\033[0m        \033[34mhttp://localhost:8000/docs\033[0m\n"

echo -e "\033[1m\033[36m========================================\033[0m\n"

echo -e "\033[33mService Status:\033[0m"
echo -e "  PostgreSQL: $(docker ps | grep saps_postgres > /dev/null && echo '✓ Running' || echo '✗ Stopped')"
echo -e "  Redis:      $(docker ps | grep saps_redis > /dev/null && echo '✓ Running' || echo '✗ Stopped')"
echo -e "  Backend:    $(curl -s http://localhost:3000 > /dev/null && echo '✓ Running' || echo '⏳ Starting...')"
echo -e "  AI Service: $(curl -s http://localhost:8000/health > /dev/null && echo '✓ Running' || echo '⏳ Starting...')"
echo -e "  Portals:    $(lsof -ti:5173 > /dev/null && echo '✓ Running (4 portals)' || echo '✗ Stopped')\n"

echo -e "\033[33mLogs:\033[0m"
echo -e "  Backend:  tail -f logs/backend.log"
echo -e "  AI:       tail -f logs/ai-services.log"
echo -e "  Portals:  tail -f logs/portals.log\n"

echo -e "\033[36m📖 Documentation:\033[0m"
echo -e "  Architecture: FRONTEND_ARCHITECTURE.md"
echo -e "  Walkthrough:  brain/walkthrough.md\n"
