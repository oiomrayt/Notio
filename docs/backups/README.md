# Бэкапы

## 📋 Общая информация

### Стратегия бэкапов
- Ежедневные полные бэкапы
- Инкрементальные бэкапы каждые 6 часов
- Хранение бэкапов за последние 30 дней
- Шифрование всех бэкапов
- Репликация в разные регионы AWS

### Типы данных
- База данных PostgreSQL
- Файлы пользователей
- Конфигурационные файлы
- Логи приложения
- Метрики мониторинга

## 🔄 Автоматические бэкапы

### Конфигурация

```yaml
# docker-compose.prod.yml
services:
  backup:
    image: amazon/aws-cli:2.13.33
    volumes:
      - ./scripts:/scripts:ro
      - backup_data:/backup
      - .env:/scripts/.env:ro
    environment:
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION}
    entrypoint: ["crond", "-f", "-d", "8"]
    command: |
      echo "0 1 * * * /scripts/backup.sh >> /var/log/cron.log 2>&1" > /etc/cron.d/backup-cron
      && chmod 0644 /etc/cron.d/backup-cron
      && crontab /etc/cron.d/backup-cron
```

### Скрипт бэкапа

```bash
#!/bin/bash
# scripts/backup.sh

# Загрузка переменных окружения
source /scripts/.env

# Установка переменных
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP="$BACKUP_DIR/db_$DATE.sql.gz"
FILES_BACKUP="$BACKUP_DIR/files_$DATE.tar.gz"
S3_BUCKET="$S3_BUCKET_NAME"

# Бэкап базы данных
echo "Starting database backup..."
PGPASSWORD=$DB_PASSWORD pg_dump -h postgres -U $DB_USER $DB_NAME | gzip > $DB_BACKUP

# Бэкап файлов
echo "Starting files backup..."
tar -czf $FILES_BACKUP -C /data .

# Шифрование бэкапов
echo "Encrypting backups..."
gpg --encrypt --recipient backup@example.com $DB_BACKUP
gpg --encrypt --recipient backup@example.com $FILES_BACKUP

# Загрузка в S3
echo "Uploading to S3..."
aws s3 cp ${DB_BACKUP}.gpg s3://$S3_BUCKET/database/
aws s3 cp ${FILES_BACKUP}.gpg s3://$S3_BUCKET/files/

# Очистка старых бэкапов
echo "Cleaning up old backups..."
find $BACKUP_DIR -type f -mtime +30 -delete

# Проверка успешности
if [ $? -eq 0 ]; then
  echo "Backup completed successfully"
  exit 0
else
  echo "Backup failed"
  exit 1
fi
```

## 🔄 Восстановление

### Скрипт восстановления

```bash
#!/bin/bash
# scripts/restore.sh

# Загрузка переменных окружения
source .env

# Проверка аргументов
if [ -z "$1" ]; then
  echo "Usage: $0 <backup_date>"
  echo "Example: $0 20240301_120000"
  exit 1
fi

BACKUP_DATE=$1
S3_BUCKET="$S3_BUCKET_NAME"
TEMP_DIR="/tmp/restore_$BACKUP_DATE"

# Создание временной директории
mkdir -p $TEMP_DIR

# Загрузка бэкапов из S3
echo "Downloading backups from S3..."
aws s3 cp s3://$S3_BUCKET/database/db_${BACKUP_DATE}.sql.gz.gpg $TEMP_DIR/
aws s3 cp s3://$S3_BUCKET/files/files_${BACKUP_DATE}.tar.gz.gpg $TEMP_DIR/

# Расшифровка бэкапов
echo "Decrypting backups..."
gpg --decrypt $TEMP_DIR/db_${BACKUP_DATE}.sql.gz.gpg > $TEMP_DIR/db.sql.gz
gpg --decrypt $TEMP_DIR/files_${BACKUP_DATE}.tar.gz.gpg > $TEMP_DIR/files.tar.gz

# Восстановление базы данных
echo "Restoring database..."
gunzip -c $TEMP_DIR/db.sql.gz | PGPASSWORD=$DB_PASSWORD psql -h postgres -U $DB_USER $DB_NAME

# Восстановление файлов
echo "Restoring files..."
tar -xzf $TEMP_DIR/files.tar.gz -C /data

# Очистка
echo "Cleaning up..."
rm -rf $TEMP_DIR

echo "Restore completed"
```

## 🔍 Мониторинг бэкапов

### Prometheus метрики

```yaml
# prometheus/rules/backup.yml
groups:
- name: backup
  rules:
  - alert: BackupFailed
    expr: backup_status != 1
    for: 1h
    labels:
      severity: critical
    annotations:
      summary: Backup failed
      
  - alert: BackupTooOld
    expr: time() - backup_last_success > 86400
    for: 1h
    labels:
      severity: warning
    annotations:
      summary: Last successful backup is too old
```

### Grafana Dashboard

```json
{
  "title": "Backup Status",
  "panels": [
    {
      "title": "Last Backup Status",
      "type": "stat",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "backup_status"
        }
      ]
    },
    {
      "title": "Backup Size",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "backup_size_bytes"
        }
      ]
    },
    {
      "title": "Backup Duration",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "backup_duration_seconds"
        }
      ]
    }
  ]
}
```

## 📝 Логирование

### Формат логов

```json
{
  "timestamp": "2024-03-01T12:00:00Z",
  "level": "info",
  "event": "backup_completed",
  "details": {
    "backup_type": "full",
    "database_size": "1.2GB",
    "files_size": "500MB",
    "duration": "300s",
    "s3_path": "s3://bucket/database/db_20240301_120000.sql.gz.gpg"
  }
}
```

### Ротация логов

```yaml
# logrotate.conf
/var/log/backup.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 backup backup
    postrotate
        systemctl restart rsyslog
    endscript
}
```

## 🔒 Безопасность

### Шифрование

```bash
# Генерация ключей
gpg --gen-key

# Экспорт публичного ключа
gpg --export -a "backup@example.com" > backup_public.key

# Импорт ключа на сервере
gpg --import backup_public.key

# Проверка шифрования
echo "test" | gpg --encrypt --recipient backup@example.com | gpg --decrypt
```

### AWS IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

## 📋 Чеклист

### Ежедневная проверка
- [ ] Проверить статус последнего бэкапа
- [ ] Проверить размер бэкапов
- [ ] Проверить логи на ошибки
- [ ] Проверить свободное место

### Еженедельная проверка
- [ ] Тестовое восстановление
- [ ] Проверка целостности бэкапов
- [ ] Очистка старых бэкапов
- [ ] Обновление ключей шифрования

### Ежемесячная проверка
- [ ] Полное тестовое восстановление
- [ ] Аудит доступа к бэкапам
- [ ] Проверка политик хранения
- [ ] Обновление документации 