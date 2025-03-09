# Этап сборки
FROM node:20-alpine AS builder

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm install

# Копирование исходного кода
COPY . .

# Генерация Prisma клиента и сборка приложения
RUN npm run prisma:generate
RUN npm run build

# Этап production
FROM node:20-alpine

WORKDIR /app

# Установка дополнительных пакетов
RUN apk add --no-cache tini

# Копирование зависимостей и собранного приложения
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Создание директорий для логов и временных файлов
RUN mkdir -p logs tmp && \
    chown -R node:node logs tmp

# Переключение на непривилегированного пользователя
USER node

EXPOSE 4000

# Использование tini как PID 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"] 