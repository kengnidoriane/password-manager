#!/bin/bash

# Start development environment for Password Manager

echo "🚀 Starting Password Manager Development Environment"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "📦 Starting PostgreSQL and Redis..."
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "✅ Database services are running!"
echo ""
echo "📝 Next steps:"
echo "   1. Backend: cd backend && mvn spring-boot:run"
echo "   2. Frontend: cd frontend && npm run dev"
echo ""
echo "🌐 Access points:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8080"
echo "   - Swagger UI: http://localhost:8080/swagger-ui.html"
echo "   - PostgreSQL: localhost:5432 (user: postgres, password: postgres)"
echo "   - Redis: localhost:6379"
echo ""
echo "🛑 To stop services: docker-compose -f docker-compose.dev.yml down"
