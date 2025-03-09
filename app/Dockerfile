# Этап сборки
FROM node:20-alpine AS builder

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm install

# Копирование исходного кода
COPY . .

# Сборка приложения
RUN npm run build

# Этап production
FROM nginx:1.25-alpine

# Копирование конфигурации Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копирование собранного приложения
COPY --from=builder /app/build /usr/share/nginx/html

# Проверка конфигурации Nginx
RUN nginx -t

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 