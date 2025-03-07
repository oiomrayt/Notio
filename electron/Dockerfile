# Этап сборки
FROM node:20 AS builder

# Установка зависимостей для сборки
RUN apt-get update && apt-get install -y \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxtst6 \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libxss1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm ci

# Копирование исходного кода
COPY . .

# Сборка приложения
RUN npm run build

# Сборка дистрибутивов
RUN npm run dist

# Финальный этап - артефакты сборки будут в /app/release
VOLUME /app/release 