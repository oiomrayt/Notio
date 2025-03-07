#!/bin/bash
set -e

# Загрузка переменных окружения
source .env

# Настройка переменных
BACKUP_DIR="/backup"
S3_BUCKET="s3://${S3_BUCKET_NAME}/backups"

# Проверка наличия аргумента с путём к бэкапу
if [ -z "$1" ]; then
    echo "❌ Необходимо указать путь к файлу бэкапа"
    echo "Использование: $0 <путь к бэкапу или S3 URL>"
    exit 1
fi

BACKUP_FILE="$1"
TEMP_DIR="${BACKUP_DIR}/temp"

echo "🔄 Начало восстановления - $(date)"

# Создание временной директории
rm -rf "${TEMP_DIR}"
mkdir -p "${TEMP_DIR}"

# Если путь начинается с s3://, скачиваем файл
if [[ "${BACKUP_FILE}" == s3://* ]]; then
    echo "☁️ Загрузка бэкапа из S3..."
    aws s3 cp "${BACKUP_FILE}" "${TEMP_DIR}/backup.tar.gz"
    BACKUP_FILE="${TEMP_DIR}/backup.tar.gz"
fi

# Распаковка архива
echo "📦 Распаковка архива..."
tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"
BACKUP_CONTENT=$(ls "${TEMP_DIR}")

# Остановка сервисов
echo "🛑 Остановка сервисов..."
docker compose stop api grafana

# Восстановление PostgreSQL
echo "📑 Восстановление PostgreSQL..."
docker compose cp "${TEMP_DIR}/${BACKUP_CONTENT}/db_backup.dump" postgres:/tmp/
docker compose exec -T postgres pg_restore \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    -c \
    -F custom \
    /tmp/db_backup.dump

# Восстановление Redis
echo "📑 Восстановление Redis..."
docker compose stop redis
docker compose cp "${TEMP_DIR}/${BACKUP_CONTENT}/redis_dump.rdb" redis:/data/dump.rdb
docker compose start redis

# Восстановление Grafana
echo "📊 Восстановление данных Grafana..."
docker compose cp "${TEMP_DIR}/${BACKUP_CONTENT}/grafana/." grafana:/var/lib/grafana/

# Очистка
echo "🧹 Очистка временных файлов..."
rm -rf "${TEMP_DIR}"

# Запуск сервисов
echo "🚀 Запуск сервисов..."
docker compose start api grafana

echo "✅ Восстановление завершено - $(date)" 