#!/bin/bash

# Quick Docker Infrastructure Starter
# This script starts PostgreSQL and Redis for AISHA

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Starting AISHA Infrastructure...${NC}\n"

# Clean up existing containers
echo -e "${YELLOW}Cleaning up existing containers...${NC}"
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true

# Start containers
echo -e "${BLUE}Starting PostgreSQL and Redis...${NC}"
if docker compose version &> /dev/null; then
    docker compose up -d postgres redis
elif command -v docker-compose &> /dev/null; then
    docker-compose up -d postgres redis
else
    echo -e "${RED}Docker Compose not found. Starting manually...${NC}"
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

# Wait for PostgreSQL
echo -e "${BLUE}Waiting for PostgreSQL to initialize...${NC}"
sleep 5

echo -e "\n${GREEN}✓ Infrastructure started successfully!${NC}\n"

# Show status
docker ps | grep -E "saps_postgres|saps_redis"

echo -e "\n${GREEN}PostgreSQL:${NC} localhost:5432"
echo -e "${GREEN}Redis:${NC}      localhost:6379\n"
