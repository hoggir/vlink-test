.PHONY: help up down restart logs build clean dev-setup prod-up prod-down prod-restart prod-logs prod-build prod-deploy prod-status prod-shell migrate migrate-dev prisma-generate db-seed prisma-studio status stats health vps-setup vps-deploy vps-ssh vps-status vps-logs

# Default target
help:
	@echo "=== Development Commands ==="
	@echo "  make up             - Start all services (development)"
	@echo "  make down           - Stop all services"
	@echo "  make restart        - Restart all services"
	@echo "  make logs           - View logs from all services"
	@echo "  make logs-book      - View logs from book-service"
	@echo "  make build          - Rebuild all services"
	@echo "  make clean          - Remove all containers, volumes, and images"
	@echo "  make dev-setup      - Initial setup for development"
	@echo "  make shell-book     - Enter book-service container shell"
	@echo ""
	@echo "=== Production/Deployment Commands ==="
	@echo "  make prod-up        - Start services in production mode"
	@echo "  make prod-down      - Stop production services"
	@echo "  make prod-restart   - Restart production services"
	@echo "  make prod-logs      - View production logs"
	@echo "  make prod-build     - Rebuild production services"
	@echo "  make prod-deploy    - Full deployment (build + up + migrate)"
	@echo "  make prod-status    - Check production container status"
	@echo ""
	@echo "=== Database Commands ==="
	@echo "  make migrate        - Run database migrations (production)"
	@echo "  make migrate-dev    - Run database migrations (development)"
	@echo "  make db-seed        - Seed database with initial data"
	@echo ""
	@echo "=== Utility Commands ==="
	@echo "  make status         - Check service status"
	@echo "  make stats          - View resource usage"
	@echo "  make health         - Check service health"

up:
	docker compose up -d
	@echo "✅ All services started in development mode!"
	@echo "📚 Book Service: http://localhost:3001"

down:
	docker compose down
	@echo "✅ All services stopped!"

restart:
	docker compose restart
	@echo "✅ All services restarted!"

logs:
	docker compose logs -f

logs-book:
	docker compose logs -f book-service

logs-nginx:
	docker compose logs -f nginx

build:
	docker compose build --no-cache
	@echo "✅ All services rebuilt!"

clean:
	docker compose down -v --rmi all --remove-orphans
	@echo "✅ All containers, volumes, and images removed!"

shell-book:
	docker compose exec book-service sh

shell-nginx:
	docker compose exec nginx sh

install-book:
	docker compose exec book-service npm install

prod-up:
	docker compose -f docker-compose.prod.yml up -d
	@echo "✅ Production services started!"
	@echo "📚 Book Service: http://localhost:3001"
	@echo "💡 Tip: Run 'make prod-logs' to view logs"

prod-down:
	docker compose -f docker-compose.prod.yml down
	@echo "✅ Production services stopped!"

prod-restart:
	docker compose -f docker-compose.prod.yml restart
	@echo "✅ Production services restarted!"

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f book-service

prod-build:
	docker compose -f docker-compose.prod.yml build --no-cache
	@echo "✅ Production services rebuilt!"

prod-deploy:
	@echo "🚀 Starting production deployment..."
	@echo "📦 Building production image..."
	docker compose -f docker-compose.prod.yml build --no-cache
	@echo "🔄 Stopping old containers..."
	docker compose -f docker-compose.prod.yml down
	@echo "▶️  Starting new containers..."
	docker compose -f docker-compose.prod.yml up -d
	@echo "⏳ Waiting for service to be healthy..."
	@sleep 5
	@echo "🗄️  Running database migrations..."
	docker compose -f docker-compose.prod.yml exec -T book-service npx prisma migrate deploy || echo "⚠️  Migration failed or not needed"
	@echo "✅ Production deployment complete!"
	@echo "📊 Checking status..."
	docker compose -f docker-compose.prod.yml ps

prod-status:
	@echo "📊 Production Container Status:"
	docker compose -f docker-compose.prod.yml ps
	@echo ""
	@echo "🏥 Health Check:"
	@curl -s http://localhost:3001/health || echo "⚠️  Service not responding"

prod-shell:
	docker compose -f docker-compose.prod.yml exec book-service sh

migrate:
	@echo "🗄️  Running production database migrations..."
	docker compose -f docker-compose.prod.yml exec book-service npx prisma migrate deploy
	@echo "✅ Migrations complete!"

migrate-dev:
	@echo "🗄️  Running development database migrations..."
	docker compose exec book-service npm run prisma:migrate:dev
	@echo "✅ Migrations complete!"

prisma-generate:
	docker compose exec book-service npm run prisma:generate
	@echo "✅ Prisma client generated!"

db-seed:
	docker compose exec book-service npm run db:seed
	@echo "✅ Database seeded!"

prisma-studio:
	docker compose exec book-service npm run prisma:studio

status:
	docker compose ps

stats:
	docker stats