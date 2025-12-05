#!/bin/bash

# Password Manager Deployment Script
# Usage: ./scripts/deploy.sh [staging|production] [version]

set -e

ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}

echo "🚀 Deploying Password Manager to $ENVIRONMENT (version: $VERSION)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if environment is valid
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo -e "${RED}❌ Invalid environment. Use 'staging' or 'production'${NC}"
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

# Set version
export VERSION=$VERSION

# Pull latest images
echo -e "${YELLOW}📦 Pulling Docker images...${NC}"
docker-compose -f docker-compose.prod.yml pull

# Stop old containers
echo -e "${YELLOW}🛑 Stopping old containers...${NC}"
docker-compose -f docker-compose.prod.yml down

# Start new containers
echo -e "${YELLOW}🚀 Starting new containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"

# Check backend
if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend is healthy"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend is healthy"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
    docker-compose -f docker-compose.prod.yml logs frontend
    exit 1
fi

# Clean up old images
echo -e "${YELLOW}🧹 Cleaning up old images...${NC}"
docker image prune -f

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "📊 Container status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📝 View logs with:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
