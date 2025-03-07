# Notio

Notio - это комплексное приложение для управления задачами и проектами, включающее веб-интерфейс, API и настольное приложение.

## Структура проекта

- **app/**: Фронтенд на React
- **api/**: Бэкенд на Node.js с использованием Express
- **electron/**: Настольное приложение на Electron
- **monitoring/**: Конфигурации для мониторинга и алертинга
- **traefik/**: Конфигурации для Traefik и ModSecurity
- **scripts/**: Скрипты для резервного копирования и восстановления

## Развертывание

### Требования

- Docker и Docker Compose
- Node.js 20+
- NPM

### Установка

1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/yourusername/notio.git
   cd notio
   ```

2. Установите зависимости:
   ```bash
   npm install
   ```

3. Настройте переменные окружения, скопировав `.env.example` в `.env` и отредактировав значения.

4. Запустите проект:
   ```bash
   docker-compose up -d
   ```

## Документация API

API предоставляет RESTful интерфейс для взаимодействия с бэкендом. Полная документация доступна в `/api/docs` после запуска сервера.

## Вклад

Мы приветствуем вклад в проект! Пожалуйста, создавайте pull request'ы и открывайте issues для обсуждения новых функций и исправлений.

## Лицензия

Этот проект лицензирован под MIT License. Подробности в файле LICENSE. 