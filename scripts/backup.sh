#!/bin/bash
set -e

# Функция для вывода сообщений с временной меткой
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Функция для логирования и вывода подробностей ошибки
error_log() {
  local error_msg="$1"
  local error_code="$2"
  log "❌ Ошибка: ${error_msg} (код: ${error_code})"
  log "📋 Пожалуйста, проверьте журналы Docker для получения дополнительной информации."
}

# Функция для очистки при ошибке
cleanup() {
  if [ $? -ne 0 ]; then
    error_log "Ошибка при выполнении резервного копирования!" $?
    # Удаляем неполные резервные копии
    if [ -d "${BACKUP_PATH}" ]; then
      rm -rf "${BACKUP_PATH}"
    fi
    if [ -f "${BACKUP_PATH}.tar.gz" ]; then
      rm -f "${BACKUP_PATH}.tar.gz"
    fi
  fi
  log "🏁 Операция завершена."
}

# Устанавливаем обработчик ошибок
trap cleanup EXIT

# Загрузка переменных окружения
if [ -f .env ]; then
  log "📄 Загрузка переменных окружения из .env"
  source .env
else
  log "⚠️ Файл .env не найден, используются значения по умолчанию"
fi

# Настройка переменных
BACKUP_DIR="/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"
RETENTION_DAYS=${RETENTION_DAYS:-7}  # Использовать значение из .env или 7 по умолчанию

# Проверка доступности директории для резервных копий
if [ ! -d "${BACKUP_DIR}" ]; then
  log "📁 Директория ${BACKUP_DIR} не существует, создаем..."
  mkdir -p "${BACKUP_DIR}" || { log "❌ Не удалось создать директорию ${BACKUP_DIR}"; exit 1; }
fi

# Создание директории для текущего бэкапа
log "📁 Создание директории для резервного копирования..."
mkdir -p "${BACKUP_PATH}" || { log "❌ Не удалось создать директорию ${BACKUP_PATH}"; exit 1; }

log "🔄 Начало резервного копирования - $(date)"

# Бэкап PostgreSQL
log "📑 Создание дампа PostgreSQL..."
if ! docker compose exec -T postgres pg_dump \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    -F custom \
    -f "/tmp/db_backup.dump"; then
  error_log "Ошибка при создании дампа PostgreSQL. Проверьте имя пользователя (${POSTGRES_USER}) и имя базы данных (${POSTGRES_DB})." $?
  exit 1
fi

log "📋 Копирование дампа PostgreSQL..."
if ! docker compose cp postgres:/tmp/db_backup.dump "${BACKUP_PATH}/db_backup.dump"; then
  error_log "Ошибка при копировании дампа PostgreSQL" $?
  exit 1
fi

# Бэкап Redis
log "📑 Создание дампа Redis..."
if ! docker compose exec -T redis redis-cli -a "${REDIS_PASSWORD}" SAVE; then
  error_log "Ошибка при создании дампа Redis. Проверьте доступность сервиса Redis и правильность пароля." $?
  exit 1
fi

log "📋 Копирование дампа Redis..."
if ! docker compose cp redis:/data/dump.rdb "${BACKUP_PATH}/redis_dump.rdb"; then
  error_log "Ошибка при копировании дампа Redis" $?
  exit 1
fi

# Бэкап Grafana
log "📊 Копирование данных Grafana..."
if ! docker compose cp grafana:/var/lib/grafana "${BACKUP_PATH}/grafana"; then
  error_log "Ошибка при копировании данных Grafana. Проверьте доступность сервиса Grafana." $?
  exit 1
fi

# Архивация
log "📦 Создание архива..."
if ! tar -czf "${BACKUP_PATH}.tar.gz" -C "${BACKUP_DIR}" "${TIMESTAMP}"; then
  error_log "Ошибка при создании архива. Проверьте наличие свободного места и права доступа." $?
  exit 1
fi

# Удаление временной директории
log "🧹 Удаление временной директории..."
rm -rf "${BACKUP_PATH}"

# Очистка старых бэкапов
log "🧹 Очистка старых бэкапов (старше ${RETENTION_DAYS} дней)..."
find "${BACKUP_DIR}" -type f -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete

# Проверка свободного места на диске
DISK_SPACE=$(df -h ${BACKUP_DIR} | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "${DISK_SPACE}" -gt 85 ]; then
  log "⚠️ Предупреждение: свободного места на диске мало (занято ${DISK_SPACE}%)"
fi

# Вывод информации о созданном бэкапе
BACKUP_SIZE=$(du -h "${BACKUP_PATH}.tar.gz" | awk '{print $1}')
log "✅ Резервное копирование успешно завершено - $(date)"
log "📁 Файл резервной копии: ${BACKUP_PATH}.tar.gz (${BACKUP_SIZE})" 