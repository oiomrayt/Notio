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
    error_log "Ошибка при восстановлении из резервной копии!" $?
    # Запуск сервисов в случае сбоя
    if docker compose ps | grep -q "postgres\s.*\s(paused\|stopped)"; then
      log "🔄 Перезапуск остановленных сервисов..."
      docker compose start api redis grafana
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
  log "⚠️ Файл .env не найден"
  exit 1
fi

# Настройка переменных
BACKUP_DIR="/backup"

# Проверка наличия аргумента с путём к бэкапу
if [ -z "$1" ]; then
    log "❌ Необходимо указать путь к файлу бэкапа"
    log "Использование: $0 <путь к бэкапу>"
    exit 1
fi

BACKUP_FILE="$1"

# Проверка существования файла резервной копии
if [ ! -f "${BACKUP_FILE}" ]; then
    log "❌ Файл резервной копии не существует: ${BACKUP_FILE}"
    exit 1
fi

TEMP_DIR="${BACKUP_DIR}/temp"

log "🔄 Начало восстановления из резервной копии - $(date)"
log "📁 Файл резервной копии: ${BACKUP_FILE}"

# Предупреждение пользователя
log "⚠️ ВНИМАНИЕ: Это действие перезапишет текущие данные. Процесс невозможно отменить."
read -p "Продолжить? (y/n): " CONFIRM
if [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]]; then
    log "🛑 Операция отменена пользователем"
    exit 0
fi

# Создание временной директории
log "📁 Подготовка временной директории..."
if [ -d "${TEMP_DIR}" ]; then
    rm -rf "${TEMP_DIR}"
fi
mkdir -p "${TEMP_DIR}" || { log "❌ Не удалось создать директорию ${TEMP_DIR}"; exit 1; }

# Распаковка архива
log "📦 Распаковка архива..."
if ! tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"; then
    error_log "Ошибка при распаковке архива. Проверьте целостность файла резервной копии." $?
    exit 1
fi

BACKUP_CONTENT=$(ls "${TEMP_DIR}")
log "📂 Найдены данные резервной копии: ${BACKUP_CONTENT}"

# Проверка наличия необходимых файлов
if [ ! -f "${TEMP_DIR}/${BACKUP_CONTENT}/db_backup.dump" ]; then
    error_log "Файл дампа базы данных не найден в резервной копии. Возможно, архив поврежден или имеет неправильную структуру." 1
    exit 1
fi

# Остановка сервисов
log "🛑 Остановка сервисов..."
docker compose stop api grafana || { log "⚠️ Ошибка при остановке сервисов api и grafana"; }

# Восстановление PostgreSQL
log "📑 Восстановление PostgreSQL..."
if ! docker compose cp "${TEMP_DIR}/${BACKUP_CONTENT}/db_backup.dump" postgres:/tmp/; then
    error_log "Ошибка при копировании дампа в контейнер PostgreSQL. Проверьте, запущен ли контейнер PostgreSQL." $?
    exit 1
fi

if ! docker compose exec -T postgres pg_restore \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    -c \
    -F custom \
    /tmp/db_backup.dump; then
    log "⚠️ Возможны предупреждения при восстановлении базы данных. Проверьте журнал выше."
    log "📋 Некоторые ошибки при восстановлении могут быть нормальными, если структура базы данных изменилась."
fi

# Восстановление Redis
log "📑 Восстановление Redis..."
docker compose stop redis || { error_log "Ошибка при остановке сервиса Redis. Проверьте, запущен ли контейнер Redis." $?; }

if [ -f "${TEMP_DIR}/${BACKUP_CONTENT}/redis_dump.rdb" ]; then
    if ! docker compose cp "${TEMP_DIR}/${BACKUP_CONTENT}/redis_dump.rdb" redis:/data/dump.rdb; then
        error_log "Ошибка при копировании дампа Redis. Проверьте, существует ли контейнер Redis." $?
        exit 1
    fi
else
    log "⚠️ Файл дампа Redis не найден в резервной копии"
fi

log "🚀 Запуск Redis..."
docker compose start redis || { error_log "Ошибка при запуске Redis. Проверьте журналы Docker для получения дополнительной информации." $?; exit 1; }

# Восстановление Grafana
log "📊 Восстановление данных Grafana..."
if [ -d "${TEMP_DIR}/${BACKUP_CONTENT}/grafana" ]; then
    if ! docker compose cp "${TEMP_DIR}/${BACKUP_CONTENT}/grafana/." grafana:/var/lib/grafana/; then
        error_log "Ошибка при копировании данных Grafana. Проверьте, существует ли контейнер Grafana." $?
        exit 1
    fi
else
    log "⚠️ Директория Grafana не найдена в резервной копии"
fi

# Очистка
log "🧹 Очистка временных файлов..."
rm -rf "${TEMP_DIR}"

# Запуск сервисов
log "🚀 Запуск сервисов..."
docker compose start api grafana || { error_log "Ошибка при запуске сервисов. Проверьте журналы Docker для получения дополнительной информации." $?; exit 1; }

log "✅ Восстановление успешно завершено - $(date)"
log "🔍 Проверьте работу приложения и убедитесь, что все данные корректно восстановлены" 