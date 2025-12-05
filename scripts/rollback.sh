#!/bin/bash

# Password Manager Rollback Script
# Usage: ./scripts/rollback.sh [staging|production] [previous-version]

set -e

ENVIRONMENT=${1:-staging}
PREVIOUS_VERSION=${2}

echo "⏪ Rolling back Password Manager on $ENVIRONMENT to version $PREVIOUS_VERSION"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ -z "$PREVIOUS_VERSION" ]; then
    echo -e "${RED}❌ Please specify the version to rollback to${NC}"
    echo "Usage: ./scripts/rollback.sh [staging|production] [version]"
    exit 1
fi

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    echo -e "${GREEN}✓${NC} Loading environment variables from .env.$ENVIRONMENT"
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ .env.$ENVIRONMENT file not found${NC}"
    exit 1
fi

# Set version to rollback to
export VERSION=$PREVIOUS_VERSION

echo -e "${YELLOW}⚠️  This will rollback to version $PREVIOUS_VERSION${NC}"
read -p "Are you sure? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Rollback cancelled"
    exit 0
fi

# Pull the previous version
echo -e "${YELLOW}📦 Pulling version $PREVIOUS_VERSION...${NC}"
docker-compose -f docker-compose.prod.yml pull

# Stop current containers
echo -e "${YELLOW}🛑 Stopping current containers...${NC}"
docker-compose -f docker-compose.prod.yml down

# Start containers with previous version
echo -e "${YELLOW}🚀 Starting containers with version $PREVIOUS_VERSION...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services
echo -e "${YELLOW}⏳ Waiting for services...${NC}"
sleep 10

# Health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"

if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend is healthy"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    exit 1
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend is healthy"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Rollback completed successfully!${NC}"
echo "Current version: $PREVIOUS_VERSION"
