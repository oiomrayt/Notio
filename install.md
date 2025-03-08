# Руководство по установке Notio на сервер Debian

## Содержание
- [Предварительные требования](#предварительные-требования)
- [1. Подготовка сервера](#1-подготовка-сервера)
- [2. Установка Docker и Docker Compose](#2-установка-docker-и-docker-compose)
- [3. Клонирование и настройка проекта](#3-клонирование-и-настройка-проекта)
- [4. Настройка переменных окружения](#4-настройка-переменных-окружения)
- [5. Настройка конфигурационных файлов](#5-настройка-конфигурационных-файлов)
- [6. Запуск приложения](#6-запуск-приложения)
- [7. Настройка домена и SSL](#7-настройка-домена-и-ssl)
- [8. Проверка работы приложения](#8-проверка-работы-приложения)
- [9. Управление приложением](#9-управление-приложением)
- [10. Устранение неполадок](#10-устранение-неполадок)
- [11. Описание компонентов системы](#11-описание-компонентов-системы)
- [12. Регулярное обслуживание](#12-регулярное-обслуживание)

## Предварительные требования

Перед началом установки убедитесь, что у вас есть:

- **Сервер Debian 11 или 12** с минимум 2 ГБ ОЗУ и 20 ГБ свободного места на диске
- **Доменное имя**, указывающее на IP-адрес сервера
- **SSH-доступ** к серверу с правами администратора (root или пользователь с sudo)
- **Базовые навыки** работы с командной строкой Linux

## 1. Подготовка сервера

### 1.1. Обновление системы

Первым шагом необходимо обновить систему и установить базовые утилиты:

```bash
# Обновление списка пакетов
sudo apt update

# Обновление установленных пакетов
sudo apt upgrade -y

# Установка необходимых системных утилит
sudo apt install -y curl wget git nano htop unzip zip gnupg2 lsb-release ca-certificates apt-transport-https software-properties-common
```

### 1.2. Настройка брандмауэра

Настройте брандмауэр, чтобы разрешить только необходимый трафик:

```bash
# Установка UFW (Uncomplicated Firewall)
sudo apt install -y ufw

# Разрешение SSH-соединений
sudo ufw allow ssh

# Разрешение HTTP и HTTPS-соединений
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Включение брандмауэра
sudo ufw enable

# Проверка статуса
sudo ufw status
```

### 1.3. Настройка временной зоны

Установите правильную временную зону для корректной работы планировщика задач:

```bash
# Проверка текущей временной зоны
date

# Установка временной зоны (замените 'Europe/Moscow' на вашу временную зону)
sudo timedatectl set-timezone Europe/Moscow

# Проверка, что временная зона изменилась
date
```

Список всех временных зон можно получить командой: `timedatectl list-timezones`

### 1.4. Настройка файла подкачки (своп)

Настройте файл подкачки для повышения стабильности системы:

```bash
# Проверка наличия файла подкачки
sudo swapon --show

# Если файл подкачки отсутствует, создайте его (размер 2GB)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Добавьте файл подкачки для автоматического монтирования при загрузке
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Проверка, что своп работает
free -h
```

## 2. Установка Docker и Docker Compose

Docker позволяет запускать приложения в изолированных контейнерах, что упрощает установку и управление.

### 2.1. Установка Docker

```bash
# Удаление старых версий Docker (если установлены)
sudo apt remove -y docker docker-engine docker.io containerd runc

# Добавление GPG ключа Docker
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавление репозитория Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Обновление списка пакетов
sudo apt update

# Установка Docker
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Проверка установки Docker
sudo docker --version

# Включение Docker для автозапуска при старте системы
sudo systemctl enable docker

# Запуск Docker, если он не запущен
sudo systemctl start docker

# Добавление вашего пользователя в группу docker (для выполнения команд без sudo)
sudo usermod -aG docker $USER

# Применение изменений групп (либо перезайдите на сервер)
newgrp docker
```

### 2.2. Установка Docker Compose

```bash
# Установка Docker Compose
sudo apt install -y docker-compose-plugin

# Проверка установки Docker Compose
docker compose version
```

## 3. Клонирование и настройка проекта

### 3.1. Клонирование репозитория

```bash
# Создание директории для проекта
sudo mkdir -p /opt/notio

# Установка правильных прав доступа
sudo chown -R $USER:$USER /opt/notio

# Переход в директорию
cd /opt/notio

# Клонирование проекта (замените на вашу ссылку на GitHub или другой репозиторий)
git clone https://github.com/your-username/notio.git .

# Если у вас приватный репозиторий, используйте токен:
# git clone https://username:token@github.com/your-username/notio.git .
```

### 3.2. Создание необходимых директорий

Создайте директории для данных и временных файлов:

```bash
# Создание директории для резервных копий
sudo mkdir -p /backup
sudo chown -R $USER:$USER /backup

# Создание директории для логов
mkdir -p logs
```

## 4. Настройка переменных окружения

### 4.1. Создание файла .env

```bash
# Копирование примера файла .env
cp .env.example .env

# Открытие файла .env для редактирования
nano .env
```

### 4.2. Генерация безопасных ключей

Для создания надежных паролей и ключей используйте следующие команды:

```bash
# Генерация 32-символьного ключа шифрования
echo "Ключ шифрования (ENCRYPTION_KEY): $(openssl rand -base64 32)"

# Генерация 16-символьного вектора инициализации
echo "Вектор инициализации (ENCRYPTION_IV): $(openssl rand -base64 12)"

# Генерация JWT-секрета
echo "JWT секрет (JWT_SECRET): $(openssl rand -base64 48)"

# Генерация пароля для Redis
echo "Пароль Redis (REDIS_PASSWORD): $(openssl rand -base64 24)"

# Генерация пароля для PostgreSQL
echo "Пароль PostgreSQL (POSTGRES_PASSWORD): $(openssl rand -base64 24)"

# Генерация пароля для Grafana
echo "Пароль Grafana (GRAFANA_ADMIN_PASSWORD): $(openssl rand -base64 16)"
```

Скопируйте сгенерированные значения и вставьте их в соответствующие поля файла `.env`.

### 4.3. Настройка основных параметров .env

Отредактируйте файл `.env`, установив следующие параметры:

1. **Приложение**:
   ```
   NODE_ENV=production
   PORT=3000
   API_URL=https://api.yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```

2. **База данных**:
   ```
   DATABASE_URL=postgresql://user:СгенерированныйПарольPostgres@postgres:5432/notio
   POSTGRES_USER=user
   POSTGRES_PASSWORD=СгенерированныйПарольPostgres
   POSTGRES_DB=notio
   ```

3. **Redis**:
   ```
   REDIS_URL=redis://redis:6379
   REDIS_PASSWORD=СгенерированныйПарольRedis
   ```

4. **JWT**:
   ```
   JWT_SECRET=СгенерированныйJWTСекрет
   JWT_EXPIRES_IN=7d
   ```

5. **Email** (для отправки уведомлений):
   ```
   SMTP_HOST=smtp.your-email-provider.com
   SMTP_PORT=587
   SMTP_USER=your-email@example.com
   SMTP_PASS=your-email-password
   SMTP_FROM=noreply@yourdomain.com
   ```

6. **Безопасность**:
   ```
   CORS_ORIGIN=https://yourdomain.com
   ENCRYPTION_KEY=СгенерированныйКлючШифрования
   ENCRYPTION_IV=СгенерированныйВекторИнициализации
   ```

7. **Traefik** (прокси-сервер):
   ```
   TRAEFIK_DOMAIN=yourdomain.com
   TRAEFIK_ACME_EMAIL=admin@yourdomain.com
   ```

### 4.4. Создание учетных данных для панелей мониторинга

```bash
# Установка утилиты htpasswd
sudo apt install -y apache2-utils

# Создание пароля для Traefik Dashboard
echo -n "Введите пароль для доступа к панели Traefik: " && read -s TRAEFIK_PASSWORD && echo
TRAEFIK_AUTH=$(htpasswd -nb admin $TRAEFIK_PASSWORD)
echo "TRAEFIK_AUTH=$TRAEFIK_AUTH"

# Создание пароля для Prometheus
echo -n "Введите пароль для доступа к Prometheus: " && read -s PROMETHEUS_PASSWORD && echo
PROMETHEUS_AUTH=$(htpasswd -nbBC 10 admin $PROMETHEUS_PASSWORD)
echo "PROMETHEUS_AUTH=$PROMETHEUS_AUTH"
```

Вставьте полученные значения `TRAEFIK_AUTH` и `PROMETHEUS_AUTH` в соответствующие поля файла `.env`.

## 5. Настройка конфигурационных файлов

### 5.1. Создание сети Docker для Traefik

```bash
# Создание внешней сети для Traefik
docker network create web
```

### 5.2. Настройка Traefik (обратный прокси)

```bash
# Создание директорий для Traefik
mkdir -p traefik
touch traefik/acme.json
chmod 600 traefik/acme.json
```

Создайте файл `traefik/traefik.yml`:

```bash
nano traefik/traefik.yml
```

Вставьте следующее содержимое:

```yaml
api:
  dashboard: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: web
  file:
    filename: /etc/traefik/dynamic.yml

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@yourdomain.com  # Замените на ваш email
      storage: /acme.json
      httpChallenge:
        entryPoint: web
```

Создайте файл `traefik/dynamic.yml`:

```bash
nano traefik/dynamic.yml
```

Вставьте следующее содержимое:

```yaml
http:
  middlewares:
    securemiddleware:
      headers:
        stsSeconds: 31536000
        stsIncludeSubdomains: true
        contentTypeNosniff: true
        browserXssFilter: true
        referrerPolicy: "strict-origin-when-cross-origin"
        permissionsPolicy: "camera=(), microphone=(), geolocation=(), interest-cohort=()"
```

### 5.3. Настройка систем мониторинга

Создайте базовую структуру директорий:

```bash
# Создание директорий для мониторинга
mkdir -p monitoring/prometheus
mkdir -p monitoring/alertmanager
mkdir -p monitoring/grafana/provisioning/datasources
mkdir -p monitoring/grafana/provisioning/dashboards
mkdir -p monitoring/logstash/pipeline
mkdir -p monitoring/filebeat
```

Создайте файл `monitoring/prometheus/prometheus.yml`:

```bash
nano monitoring/prometheus/prometheus.yml
```

Вставьте следующее содержимое:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "node"
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: "cadvisor"
    static_configs:
      - targets: ["cadvisor:8080"]

  - job_name: "redis"
    static_configs:
      - targets: ["redis-exporter:9121"]

  - job_name: "postgres"
    static_configs:
      - targets: ["postgres-exporter:9187"]
```

Создайте файл `monitoring/prometheus/web.yml`:

```bash
nano monitoring/prometheus/web.yml
```

Вставьте следующее содержимое (замените хеш пароля на сгенерированный ранее `PROMETHEUS_AUTH`):

```yaml
basic_auth_users:
  admin: $2y$10$yourhashhere  # Вставьте сюда хеш, сгенерированный ранее
```

Создайте файл `monitoring/grafana/provisioning/datasources/datasource.yml`:

```bash
mkdir -p monitoring/grafana/provisioning/datasources
nano monitoring/grafana/provisioning/datasources/datasource.yml
```

Вставьте следующее содержимое:

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
```

### 5.4. Настройка Filebeat для сбора логов

Создайте файл `monitoring/filebeat/filebeat.yml`:

```bash
nano monitoring/filebeat/filebeat.yml
```

Вставьте следующее содержимое:

```yaml
filebeat.inputs:
- type: docker
  containers.ids: '*'

output.elasticsearch:
  hosts: ["elasticsearch:9200"]

setup.kibana:
  host: "kibana:5601"

logging.json: true
```

## 6. Запуск приложения

### 6.1. Установка прав доступа для скриптов

```bash
# Сделайте скрипты исполняемыми
chmod +x scripts/*.sh
```

### 6.2. Проверка конфигурации Docker Compose

```bash
# Проверка конфигурации на ошибки
docker compose -f docker-compose.prod.yml config
```

Эта команда проверит конфигурацию Docker Compose на ошибки. Если увидите ошибки, исправьте их перед продолжением.

### 6.3. Запуск приложения с помощью Docker Compose

```bash
# Запуск приложения в фоновом режиме
docker compose -f docker-compose.prod.yml up -d
```

### 6.4. Проверка запущенных контейнеров

```bash
# Проверка запущенных контейнеров
docker compose -f docker-compose.prod.yml ps

# Просмотр логов всех контейнеров
docker compose -f docker-compose.prod.yml logs -f

# Просмотр логов конкретного контейнера (например, api)
docker compose -f docker-compose.prod.yml logs -f api
```

### 6.5. Настройка автоматического резервного копирования

```bash
# Установка планировщика cron, если не установлен
sudo apt install -y cron

# Настройка ежедневного резервного копирования в 2:00 ночи
./scripts/setup_backup_cron.sh -H 2 -m 0
```

Для настройки резервного копирования в другое время, используйте параметры:
- `-H` - час (0-23)
- `-m` - минута (0-59)
- `-d` - дни недели (по умолчанию: каждый день)

## 7. Настройка домена и SSL

### 7.1. Настройка DNS записей

Создайте следующие A-записи в DNS-настройках вашего домена, указывающие на IP-адрес вашего сервера:

- `yourdomain.com` → Ваш IP-адрес
- `api.yourdomain.com` → Ваш IP-адрес
- `grafana.yourdomain.com` → Ваш IP-адрес
- `prometheus.yourdomain.com` → Ваш IP-адрес
- `alerts.yourdomain.com` → Ваш IP-адрес
- `logs.yourdomain.com` → Ваш IP-адрес
- `traefik.yourdomain.com` → Ваш IP-адрес

Пример через командную строку с использованием dig для проверки настроек:

```bash
# Проверка настройки DNS (замените yourdomain.com на ваш домен)
dig yourdomain.com
dig api.yourdomain.com
```

### 7.2. Проверка настройки SSL

После запуска приложения и настройки DNS, SSL-сертификаты должны быть автоматически получены через Let's Encrypt:

```bash
# Проверка файла acme.json (должен содержать данные сертификатов)
cat traefik/acme.json
```

Если в течение 5-10 минут сертификаты не получены, проверьте:
1. Правильность DNS-настроек
2. Доступность портов 80 и 443
3. Логи Traefik: `docker compose -f docker-compose.prod.yml logs traefik`

## 8. Проверка работы приложения

После запуска всех компонентов и настройки SSL проверьте доступность:

1. **Основное приложение**: `https://yourdomain.com`
2. **API**: `https://api.yourdomain.com`
3. **Grafana** (мониторинг): `https://grafana.yourdomain.com`
   - Логин: `admin`
   - Пароль: значение `GRAFANA_ADMIN_PASSWORD` из файла `.env`
4. **Prometheus**: `https://prometheus.yourdomain.com`
   - Учетные данные из `PROMETHEUS_AUTH`
5. **Kibana** (логи): `https://logs.yourdomain.com`
   - Учетные данные из `TRAEFIK_AUTH`
6. **Traefik Dashboard**: `https://traefik.yourdomain.com`
   - Учетные данные из `TRAEFIK_AUTH`

## 9. Управление приложением

### 9.1. Основные команды Docker Compose

```bash
# Проверка статуса сервисов
docker compose -f docker-compose.prod.yml ps

# Остановка всех сервисов
docker compose -f docker-compose.prod.yml stop

# Запуск всех сервисов
docker compose -f docker-compose.prod.yml start

# Перезапуск всех сервисов
docker compose -f docker-compose.prod.yml restart

# Остановка и удаление контейнеров (сохраняя данные)
docker compose -f docker-compose.prod.yml down

# Полное удаление всех контейнеров и данных (ОПАСНО!)
docker compose -f docker-compose.prod.yml down -v
```

### 9.2. Обновление приложения

```bash
# Переход в директорию проекта
cd /opt/notio

# Получение обновлений из репозитория
git pull

# Остановка контейнеров
docker compose -f docker-compose.prod.yml down

# Запуск контейнеров с обновленным кодом
docker compose -f docker-compose.prod.yml up -d
```

### 9.3. Резервное копирование и восстановление

```bash
# Ручное создание резервной копии
./scripts/backup.sh

# Просмотр доступных резервных копий
ls -la /backup

# Восстановление из резервной копии
./scripts/restore.sh /backup/имя_файла.tar.gz
```

### 9.4. Управление отдельными сервисами

```bash
# Перезапуск определенного сервиса (например, api)
docker compose -f docker-compose.prod.yml restart api

# Просмотр логов определенного сервиса
docker compose -f docker-compose.prod.yml logs -f api

# Остановка определенного сервиса
docker compose -f docker-compose.prod.yml stop api

# Запуск определенного сервиса
docker compose -f docker-compose.prod.yml start api
```

## 10. Устранение неполадок

### 10.1. Проблемы с запуском контейнеров

Если какой-то контейнер не запускается:

```bash
# Проверьте статус контейнеров
docker compose -f docker-compose.prod.yml ps

# Посмотрите детальные логи конкретного контейнера
docker compose -f docker-compose.prod.yml logs -f имя_контейнера
```

### 10.2. Проблемы с SSL-сертификатами

Если SSL-сертификаты не выдаются:

```bash
# Проверьте логи Traefik
docker compose -f docker-compose.prod.yml logs -f traefik

# Убедитесь, что порты 80 и 443 открыты и доступны
sudo ufw status

# Проверьте DNS-настройки
dig yourdomain.com
dig api.yourdomain.com
```

### 10.3. Проблемы с базой данных

```bash
# Проверьте логи базы данных
docker compose -f docker-compose.prod.yml logs -f postgres

# Подключитесь к базе данных для проверки
docker compose -f docker-compose.prod.yml exec postgres psql -U user -d notio
```

### 10.4. Проблемы с доступом к панелям мониторинга

```bash
# Проверьте, что учетные данные в .env корректны
cat .env | grep GRAFANA_ADMIN_PASSWORD
cat .env | grep TRAEFIK_AUTH

# Перезапустите соответствующие сервисы
docker compose -f docker-compose.prod.yml restart grafana
docker compose -f docker-compose.prod.yml restart traefik
```

### 10.5. Очистка неиспользуемых ресурсов Docker

Со временем могут накапливаться неиспользуемые образы и контейнеры:

```bash
# Очистка неиспользуемых образов, контейнеров и сетей
docker system prune -a
```

## 11. Описание компонентов системы

Для понимания структуры системы:

1. **Docker** - платформа для запуска приложений в контейнерах (изолированных средах).
2. **Traefik** - прокси-сервер, обрабатывающий входящие запросы, перенаправляющий их на нужные сервисы и обеспечивающий SSL.
3. **PostgreSQL** - реляционная база данных для хранения основных данных приложения.
4. **Redis** - быстрое хранилище данных в памяти для кеширования и временных данных.
5. **Prometheus** - система мониторинга, собирающая метрики с сервисов.
6. **Grafana** - инструмент для создания дашбордов и визуализации метрик.
7. **ELK Stack** (Elasticsearch, Logstash, Kibana) - комплекс для сбора, обработки и отображения логов.
8. **Node.js API** - серверная часть приложения, обрабатывающая запросы клиентов.
9. **Frontend** - клиентская часть приложения (веб-интерфейс).

## 12. Регулярное обслуживание

Для поддержания системы в рабочем состоянии необходимо регулярно выполнять следующие действия:

### 12.1. Обновление системы

```bash
# Обновление пакетов Debian
sudo apt update
sudo apt upgrade -y
```

### 12.2. Обновление Docker-образов

```bash
# Получение последних версий образов
docker compose -f docker-compose.prod.yml pull

# Перезапуск сервисов с новыми образами
docker compose -f docker-compose.prod.yml up -d
```

### 12.3. Проверка дискового пространства

```bash
# Проверка свободного места на сервере
df -h

# Проверка использования места Docker
docker system df
```

### 12.4. Проверка журналов на ошибки

```bash
# Поиск ошибок в логах всех сервисов
docker compose -f docker-compose.prod.yml logs | grep -i error

# Поиск ошибок в системных журналах
sudo journalctl -p err
```

### 12.5. Проверка резервных копий

```bash
# Список резервных копий и их размер
ls -lah /backup

# Проверка последней резервной копии
./scripts/backup.sh
```

### 12.6. Ротация логов

Docker автоматически выполняет ротацию логов, но вы можете контролировать это:

```bash
# Просмотр настроек логирования Docker
docker info | grep "Logging Driver"

# Установка ограничений на размер логов
nano /etc/docker/daemon.json
```

Содержимое `daemon.json` для ограничения логов:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

После изменения перезапустите Docker:
```bash
sudo systemctl restart docker
```

## Заключение

Поздравляем! Вы успешно настроили и запустили Notio на вашем сервере. Эта инструкция содержит основные шаги по установке, настройке и обслуживанию приложения.

Если у вас возникнут вопросы или проблемы при эксплуатации, обратитесь к официальной документации проекта или обратитесь к технической поддержке.

## Ссылки на дополнительные ресурсы

- [Официальная документация Docker](https://docs.docker.com/)
- [Документация Traefik](https://doc.traefik.io/)
- [Документация PostgreSQL](https://www.postgresql.org/docs/)
- [Документация Redis](https://redis.io/documentation)
- [Документация Prometheus](https://prometheus.io/docs/)
- [Документация Grafana](https://grafana.com/docs/) 