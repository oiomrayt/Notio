# Этап сборки
FROM node:16-alpine AS builder

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Этап работы приложения
FROM nginx:alpine

# Копируем собранное приложение из предыдущего этапа
COPY --from=builder /app/build /usr/share/nginx/html

# Копируем кастомную nginx конфигурацию
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Экспортируем порт, на котором будет работать Nginx
EXPOSE 80

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"] 