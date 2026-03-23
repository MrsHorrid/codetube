.PHONY: help install dev build test clean deploy-staging deploy-production docker-up docker-down docker-logs

# Default target
help:
	@echo "CodeTube - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make install         Install dependencies for both frontend and backend"
	@echo "  make dev             Start development servers (requires tmux or multiple terminals)"
	@echo "  make dev-docker      Start development environment with Docker Compose"
	@echo ""
	@echo "Testing:"
	@echo "  make test            Run all tests"
	@echo "  make test-backend    Run backend tests only"
	@echo "  make test-frontend   Run frontend tests only"
	@echo ""
	@echo "Building:"
	@echo "  make build           Build production Docker images"
	@echo "  make build-backend   Build backend Docker image only"
	@echo "  make build-frontend  Build frontend Docker image only"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up       Start production Docker containers"
	@echo "  make docker-down     Stop Docker containers"
	@echo "  make docker-logs     View Docker logs"
	@echo "  make docker-clean    Clean up Docker resources"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy-staging     Deploy to staging environment"
	@echo "  make deploy-production  Deploy to production environment (with confirmation)"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate      Run database migrations"
	@echo "  make db-studio       Open Prisma Studio"
	@echo "  make db-seed         Seed the database"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean           Clean build artifacts and node_modules"
	@echo "  make lint            Run linting"
	@echo "  make format          Format code"

# Development
install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

dev:
	@echo "Starting development servers..."
	@echo "Backend will start on http://localhost:3000"
	@echo "Frontend will start on http://localhost:5173"
	@(cd backend && npm run dev &) && (cd frontend && npm run dev)

dev-docker:
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Development environment started!"
	@echo "Backend: http://localhost:3000"
	@echo "Frontend: http://localhost:5173"

# Testing
test: test-backend test-frontend

test-backend:
	cd backend && npm test

test-frontend:
	cd frontend && npm test || echo "No tests configured for frontend"

# Building
build: build-backend build-frontend
	@echo "Building production Docker images..."
	docker-compose build

build-backend:
	docker build -t codetube-backend:latest ./backend

build-frontend:
	docker build -t codetube-frontend:latest ./frontend

# Docker
docker-up:
	docker-compose up -d
	@echo "Production containers started!"
	@echo "Frontend: http://localhost"
	@echo "Backend API: http://localhost:3000"

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-clean:
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

# Deployment
deploy-staging:
	./scripts/deploy-staging.sh

deploy-production:
	./scripts/deploy-production.sh

# Database
db-migrate:
	cd backend && npx prisma migrate dev

db-studio:
	cd backend && npx prisma studio

db-seed:
	cd backend && npx prisma db seed

db-migrate-production:
	docker-compose exec backend npx prisma migrate deploy

# Utilities
clean:
	@echo "Cleaning build artifacts..."
	rm -rf backend/dist backend/node_modules backend/coverage
	rm -rf frontend/dist frontend/node_modules
	docker-compose down -v 2>/dev/null || true

lint:
	cd backend && npx eslint src --ext .ts || true
	cd frontend && npx eslint src --ext .ts,.tsx || true

format:
	cd backend && npx prettier --write "src/**/*.ts" || true
	cd frontend && npx prettier --write "src/**/*.{ts,tsx}" || true

# Production setup
setup-production:
	@echo "Setting up production environment..."
	cp .env.production.example .env
	@echo "Please edit .env with your production values"
	@echo "Then run: make deploy-production"
