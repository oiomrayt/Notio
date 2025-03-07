# CI/CD

## 🔄 Процесс разработки

### Ветки

- `main` - основная ветка, содержит стабильный код
- `develop` - ветка разработки
- `feature/*` - ветки для новых функций
- `bugfix/*` - ветки для исправления ошибок
- `release/*` - ветки для релизов
- `hotfix/*` - ветки для срочных исправлений

### Git Flow

```mermaid
graph TD
    main --> hotfix
    main --> release
    release --> develop
    develop --> feature
    develop --> bugfix
    hotfix --> main
    hotfix --> develop
    release --> main
    feature --> develop
    bugfix --> develop
```

## 🚀 GitHub Actions

### Основной workflow

```yaml
# .github/workflows/main.yml
name: CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm test
        
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          push: true
          tags: |
            user/notio-api:latest
            user/notio-api:${{ github.sha }}
            
  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USERNAME }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/notio
            docker-compose pull
            docker-compose up -d
            
  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USERNAME }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/notio
            docker-compose pull
            docker-compose up -d
```

### Release workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  create-release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Create Release
        id: create_release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
          
  build-and-push:
    needs: create-release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          push: true
          tags: |
            user/notio-api:${{ github.ref_name }}
            user/notio-api:latest
```

## 📦 Docker

### Multi-stage build

```dockerfile
# Dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production

CMD ["npm", "start"]
```

### Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=false"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik:/etc/traefik
      
  api:
    image: user/notio-api:latest
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.example.com`)"
      
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:6
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 🔄 Автоматизация

### Husky

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm test"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### Release script

```bash
#!/bin/bash
# scripts/release.sh

# Получаем текущую версию
current_version=$(node -p "require('./package.json').version")

# Запрашиваем тип релиза
echo "Current version: $current_version"
echo "Select release type:"
echo "1) patch (bug fixes)"
echo "2) minor (new features)"
echo "3) major (breaking changes)"
read -p "Enter choice [1-3]: " choice

# Обновляем версию
case $choice in
  1) npm version patch ;;
  2) npm version minor ;;
  3) npm version major ;;
  *) echo "Invalid choice" && exit 1 ;;
esac

# Получаем новую версию
new_version=$(node -p "require('./package.json').version")

# Создаем тег и пушим изменения
git push origin main
git push origin v$new_version
```

## 📊 Мониторинг деплоя

### Grafana Dashboard

```json
{
  "title": "Deployment Dashboard",
  "panels": [
    {
      "title": "Deployment Status",
      "type": "stat",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "deployment_status{service=\"api\"}"
        }
      ]
    },
    {
      "title": "Error Rate After Deploy",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "rate(http_errors_total[5m])"
        }
      ]
    }
  ]
}
```

### Alerting Rules

```yaml
# prometheus/rules/deployment.yml
groups:
- name: deployment
  rules:
  - alert: HighErrorRateAfterDeploy
    expr: |
      rate(http_errors_total[5m]) > 0.05
      and
      time() - deployment_timestamp{service="api"} < 3600
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: High error rate after deployment
```

## 🔄 Rollback

### Автоматический rollback

```yaml
# .github/workflows/rollback.yml
name: Rollback

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Rollback deployment
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USERNAME }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/notio
            docker-compose pull user/notio-api:${{ github.event.inputs.version }}
            docker-compose up -d
```

### Ручной rollback

```bash
#!/bin/bash
# scripts/rollback.sh

# Получаем список тегов
tags=$(git tag -l --sort=-v:refname | head -n 5)

echo "Select version to rollback to:"
select version in $tags; do
  if [ -n "$version" ]; then
    echo "Rolling back to version $version..."
    
    # Откатываем деплой
    docker-compose pull user/notio-api:$version
    docker-compose up -d
    
    # Проверяем статус
    echo "Checking deployment status..."
    sleep 30
    
    if curl -s http://localhost/health | grep -q "ok"; then
      echo "Rollback successful!"
    else
      echo "Rollback failed!"
      exit 1
    fi
    break
  fi
done
```

## 📝 Чеклист деплоя

### Перед деплоем
- [ ] Все тесты пройдены
- [ ] Проверен код ревью
- [ ] Обновлена документация
- [ ] Проверены зависимости
- [ ] Создан backup базы данных

### Во время деплоя
- [ ] Проверить статус сервисов
- [ ] Мониторить логи
- [ ] Следить за метриками
- [ ] Проверять алерты

### После деплоя
- [ ] Запустить smoke тесты
- [ ] Проверить основные функции
- [ ] Проверить производительность
- [ ] Обновить статус в трекере 