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
  log "📋 Пожалуйста, проверьте системные журналы для получения дополнительной информации."
}

log "🔧 Настройка автоматического резервного копирования"

# Настройка параметров (значения по умолчанию)
HOUR=1
MINUTE=0
DAYS="*"  # Каждый день
BACKUP_SCRIPT="$(pwd)/scripts/backup.sh"
LOG_DIR="$(pwd)/logs"
LOG_FILE="${LOG_DIR}/backup.log"

# Справка по использованию
show_help() {
    echo "Использование: $0 [опции]"
    echo ""
    echo "Опции:"
    echo "  -h, --help         Показать эту справку"
    echo "  -H, --hour ЧАС     Час выполнения (0-23), по умолчанию: 1"
    echo "  -m, --minute МИН   Минута выполнения (0-59), по умолчанию: 0"
    echo "  -d, --days ДНИ     Дни выполнения (0-7 или mon,tue,...), по умолчанию: * (каждый день)"
    echo "  -l, --log ФАЙЛ     Путь к файлу журнала, по умолчанию: ${LOG_FILE}"
    echo ""
    echo "Примеры:"
    echo "  $0 -H 3 -m 30                  Выполнять в 3:30 каждый день"
    echo "  $0 -d 1,3,5 -H 2               Выполнять в 2:00 по понедельникам, средам и пятницам"
    exit 0
}

# Обработка параметров командной строки
while [ "$#" -gt 0 ]; do
    case "$1" in
        -h|--help)
            show_help
            ;;
        -H|--hour)
            HOUR="$2"
            if ! [[ "$HOUR" =~ ^[0-9]+$ ]] || [ "$HOUR" -lt 0 ] || [ "$HOUR" -gt 23 ]; then
                error_log "час должен быть числом от 0 до 23" 1
                exit 1
            fi
            shift 2
            ;;
        -m|--minute)
            MINUTE="$2"
            if ! [[ "$MINUTE" =~ ^[0-9]+$ ]] || [ "$MINUTE" -lt 0 ] || [ "$MINUTE" -gt 59 ]; then
                error_log "минута должна быть числом от 0 до 59" 1
                exit 1
            fi
            shift 2
            ;;
        -d|--days)
            DAYS="$2"
            shift 2
            ;;
        -l|--log)
            LOG_FILE="$2"
            LOG_DIR=$(dirname "$LOG_FILE")
            shift 2
            ;;
        *)
            error_log "Неизвестный параметр: $1" 1
            show_help
            ;;
    esac
done

# Проверка наличия скрипта резервного копирования
if [ ! -f "${BACKUP_SCRIPT}" ]; then
    error_log "Скрипт резервного копирования не найден: ${BACKUP_SCRIPT}" 1
    exit 1
fi

# Проверка прав на выполнение
if [ ! -x "${BACKUP_SCRIPT}" ]; then
    log "🔧 Устанавливаем права на выполнение для скрипта резервного копирования"
    chmod +x "${BACKUP_SCRIPT}" || { error_log "Не удалось установить права на выполнение" 1; exit 1; }
fi

# Проверка наличия cron
if ! command -v crontab &> /dev/null; then
    error_log "crontab не установлен. Установите cron:" 1
    log "sudo apt-get update && sudo apt-get install -y cron"
    exit 1
fi

# Создание директории для логов, если её нет
if [ ! -d "${LOG_DIR}" ]; then
    log "📁 Создание директории для журналов: ${LOG_DIR}"
    mkdir -p "${LOG_DIR}" || { error_log "Не удалось создать директорию ${LOG_DIR}" 1; exit 1; }
fi

# Формирование строки для crontab
CRON_JOB="${MINUTE} ${HOUR} * * ${DAYS} cd $(pwd) && ${BACKUP_SCRIPT} >> ${LOG_FILE} 2>&1"

# Добавление задания в crontab
log "📝 Добавление задания в crontab: '${CRON_JOB}'"
(crontab -l 2>/dev/null | grep -v "${BACKUP_SCRIPT}" || true; echo "${CRON_JOB}") | crontab -

log "✅ Задание добавлено в crontab. Резервное копирование будет выполняться в ${HOUR}:${MINUTE} по дням: ${DAYS}"
log "📝 Журнал будет сохраняться в: ${LOG_FILE}"

# Проверка статуса cron
log "🔍 Проверка статуса службы cron..."
if command -v systemctl &> /dev/null; then
    CRON_STATUS=$(systemctl is-active cron)
    if [ "${CRON_STATUS}" != "active" ]; then
        log "⚠️ Служба cron не активна! Запустите её командой: sudo systemctl start cron"
    else
        log "✅ Служба cron активна и работает"
    fi
fi

log "🔍 Текущие задания crontab:"
crontab -l 