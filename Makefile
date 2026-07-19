# Omnia — automação de desenvolvimento
# Windows sem make: use .\scripts\dev.ps1 <alvo>

.PHONY: help up down logs backend-run backend-test backend-build frontend-run frontend-test \
        frontend-build test format check sonar-up clean

help: ## Lista os alvos
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*## "}{printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

up: ## Sobe infra local (Postgres, Redis, MailHog)
	docker compose up -d postgres redis mailhog

down: ## Derruba infra local
	docker compose down

logs: ## Logs da infra
	docker compose logs -f

backend-run: ## Roda a API (profile local)
	cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local

backend-test: ## Testes do backend (exige Docker p/ Testcontainers)
	cd backend && ./mvnw verify

backend-build: ## Build do backend sem testes
	cd backend && ./mvnw -DskipTests package

frontend-run: ## Roda o frontend (:4200)
	cd frontend && npm start

frontend-test: ## Testes do frontend (vitest)
	cd frontend && npm test -- --watch=false

frontend-build: ## Build de produção do frontend
	cd frontend && npm run build

test: backend-test frontend-test ## Suíte completa

format: ## Corrige formatação (Java + web/docs)
	cd backend && ./mvnw spotless:apply
	npx prettier --write .

check: ## Todos os gates locais (formato + estilo + testes)
	cd backend && ./mvnw spotless:check checkstyle:check verify
	npx prettier --check .
	cd frontend && npm run lint --if-present && npm test -- --watch=false

sonar-up: ## Sobe SonarQube local (http://localhost:9000, admin/admin)
	docker compose --profile quality up -d sonarqube

clean: ## Limpa builds
	cd backend && ./mvnw clean
	cd frontend && rm -rf dist .angular
