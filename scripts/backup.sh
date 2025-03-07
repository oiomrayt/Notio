#!/bin/bash
set -e

# Загрузка переменных окружения
source .env

# Настройка переменных
BACKUP_DIR="/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"
S3_BUCKET="s3://${S3_BUCKET_NAME}/backups"

# Создание директории для бэкапа
mkdir -p "${BACKUP_PATH}"

echo "🔄 Начало резервного копирования - $(date)"

# Бэкап PostgreSQL
echo "📑 Создание дампа PostgreSQL..."
docker compose exec -T postgres pg_dump \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    -F custom \
    -f "/tmp/db_backup.dump"

docker compose cp postgres:/tmp/db_backup.dump "${BACKUP_PATH}/db_backup.dump"

# Бэкап Redis
echo "📑 Создание дампа Redis..."
docker compose exec -T redis redis-cli SAVE
docker compose cp redis:/data/dump.rdb "${BACKUP_PATH}/redis_dump.rdb"

# Бэкап Grafana
echo "📊 Копирование данных Grafana..."
docker compose cp grafana:/var/lib/grafana "${BACKUP_PATH}/grafana"

# Архивация
echo "📦 Создание архива..."
tar -czf "${BACKUP_PATH}.tar.gz" -C "${BACKUP_DIR}" "${TIMESTAMP}"

# Загрузка в S3
if [ ! -z "${S3_BUCKET_NAME}" ]; then
    echo "☁️ Загрузка в S3..."
    aws s3 cp "${BACKUP_PATH}.tar.gz" "${S3_BUCKET}/"
fi

# Очистка старых бэкапов (хранить последние 7 дней)
echo "🧹 Очистка старых бэкапов..."
find "${BACKUP_DIR}" -type f -name "*.tar.gz" -mtime +7 -delete
if [ ! -z "${S3_BUCKET_NAME}" ]; then
    aws s3 ls "${S3_BUCKET}/" | while read -r line; do
        createDate=$(echo "${line}" | awk '{print $1" "$2}')
        createDate=$(date -d "${createDate}" +%s)
        olderThan=$(date -d "7 days ago" +%s)
        if [[ ${createDate} -lt ${olderThan} ]]; then
            fileName=$(echo "${line}" | awk '{print $4}')
            if [[ ${fileName} != "" ]]; then
                aws s3 rm "${S3_BUCKET}/${fileName}"
            fi
        fi
    done
fi

echo "✅ Резервное копирование завершено - $(date)" 