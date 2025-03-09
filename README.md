# Notio

Notio - это комплексное приложение для управления задачами и проектами, включающее веб-интерфейс, API и настольное приложение.

## Структура проекта

- **app/**: Фронтенд на React
- **api/**: Бэкенд на Node.js с использованием Express
- **electron/**: Настольное приложение на Electron
- **monitoring/**: Конфигурации для мониторинга и алертинга
- **traefik/**: Конфигурации для Traefik и ModSecurity
- **scripts/**: Скрипты для резервного копирования и восстановления

## Предварительные требования

Перед началом установки убедитесь, что у вас есть:

- **Сервер Debian 11 или 12** с минимум 2 ГБ ОЗУ и 20 ГБ свободного места на диске
- **Доменное имя**, указывающее на IP-адрес сервера
- **SSH-доступ** к серверу с правами администратора (root или пользователь с sudo)
- **Базовые навыки** работы с командной строкой Linux

## Подготовка сервера

### Обновление системы

Первым шагом необходимо обновить систему и установить базовые утилиты:

```bash
# Обновление списка пакетов
sudo apt update

# Обновление установленных пакетов
sudo apt upgrade -y

# Установка необходимых системных утилит
sudo apt install -y curl wget git nano htop unzip zip gnupg2 lsb-release ca-certificates apt-transport-https software-properties-common
```

### Настройка брандмауэра

Настройте брандмауэр, чтобы разрешить только необходимый трафик:

```bash
# Установка UFW (Uncomplicated Firewall)
sudo apt install -y ufw

# Разрешение SSH-соединений
sudo ufw allow ssh

# Обязательные порты для внешнего доступа
sudo ufw allow 80/tcp   # HTTP для первоначального доступа и Let's Encrypt
sudo ufw allow 443/tcp  # HTTPS для всех сервисов

# Дополнительные порты (только если требуется прямой доступ к сервисам без Traefik)
# Раскомментируйте только необходимые порты
# sudo ufw allow 3000/tcp  # API и Frontend (если требуется прямой доступ)
# sudo ufw allow 5432/tcp  # PostgreSQL (только если требуется внешний доступ к БД)
# sudo ufw allow 6379/tcp  # Redis (только если требуется внешний доступ)

# Включение брандмауэра
sudo ufw enable

# Проверка статуса
sudo ufw status verbose
```

> **Примечание**: Для продакшн-среды рекомендуется открывать только порты 80, 443 и SSH (22). Все остальные сервисы будут доступны через Traefik по HTTPS (порт 443) с использованием поддоменов. Открытие дополнительных портов может создать потенциальные уязвимости в безопасности.

### Настройка временной зоны

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

### Настройка файла подкачки (своп)

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

## Установка Docker и Docker Compose

Docker позволяет запускать приложения в изолированных контейнерах, что упрощает установку и управление.

### Установка Docker

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

### Установка Docker Compose

```bash
# Установка Docker Compose
sudo apt install -y docker-compose-plugin

# Проверка установки Docker Compose
docker compose version
```

## Клонирование и настройка проекта

### Клонирование репозитория

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

### Создание необходимых директорий

Создайте директории для данных и временных файлов:

```bash
# Создание директории для резервных копий
sudo mkdir -p /backup
sudo chown -R $USER:$USER /backup

# Создание директории для логов
mkdir -p logs

# Создание директории для секретов
mkdir -p secrets
```

## Настройка переменных окружения и учетных данных

### Генерация и настройка базовых параметров

```bash
# Копирование примера файла .env
cp .env.example .env

# Генерация безопасных ключей и паролей
echo "Ключ шифрования (ENCRYPTION_KEY): $(openssl rand -base64 32)"
echo "Вектор инициализации (ENCRYPTION_IV): $(openssl rand -base64 12)"
echo "JWT секрет (JWT_SECRET): $(openssl rand -base64 48)"
echo "Пароль Redis (REDIS_PASSWORD): $(openssl rand -base64 24)"
echo "Пароль PostgreSQL (POSTGRES_PASSWORD): $(openssl rand -base64 24)"
echo "Пароль Grafana (GRAFANA_ADMIN_PASSWORD): $(openssl rand -base64 16)"

# Открытие файла .env для редактирования
nano .env
```

Отредактируйте файл `.env`, установив следующие параметры:

```
# Приложение
NODE_ENV=production
PORT=3000
API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# База данных
DATABASE_URL=postgresql://user:СгенерированныйПарольPostgres@postgres:5432/notio
POSTGRES_USER=user
POSTGRES_PASSWORD=СгенерированныйПарольPostgres
POSTGRES_DB=notio

# Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=СгенерированныйПарольRedis

# JWT
JWT_SECRET=СгенерированныйJWTСекрет
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
SMTP_FROM=noreply@yourdomain.com

# Безопасность
CORS_ORIGIN=https://yourdomain.com
ENCRYPTION_KEY=СгенерированныйКлючШифрования
ENCRYPTION_IV=СгенерированныйВекторИнициализации

# Мониторинг
GRAFANA_ADMIN_PASSWORD=СгенерированныйПарольGrafana
PROMETHEUS_RETENTION_DAYS=15

# Traefik
TRAEFIK_DOMAIN=yourdomain.com
TRAEFIK_ACME_EMAIL=admin@yourdomain.com

# Docker
REGISTRY=  # Например, docker.io/username или ghcr.io/username
REPOSITORY=  # Имя проекта/репозитория
TAG=latest  # Тег/версия образа
DOMAIN=yourdomain.com  # Основной домен для доступа к приложению
```

### Настройка переменных Docker

> **ВАЖНО!** Неправильная настройка переменных Docker является частой причиной ошибок при первом запуске.

В файле `.env` есть секция Docker, которая определяет, откуда будут загружаться образы контейнеров:

```
# Docker
REGISTRY=  # Например, docker.io/username или ghcr.io/username
REPOSITORY=  # Имя проекта/репозитория
TAG=latest  # Тег/версия образа
DOMAIN=yourdomain.com  # Основной домен для доступа к приложению
```

Для правильной настройки выберите один из следующих вариантов:

#### Вариант 1: Использование стандартных общедоступных образов (рекомендуется)

Этот вариант подходит, если вы не имеете своих собственных сборок образов:

```bash
# Оставьте значения переменных пустыми
REGISTRY=
REPOSITORY=
TAG=latest
```

#### Вариант 2: Использование вашего приватного репозитория Docker Hub

Если у вас есть собственные образы в Docker Hub:

```bash
# Пример для Docker Hub
REGISTRY=docker.io/yourname  # Замените yourname вашим именем пользователя
REPOSITORY=notio
TAG=latest
```

Затем войдите в Docker Hub:
```bash
docker login
```

#### Вариант 3: Использование другого реестра (например, GitHub Container Registry)

```bash
# Пример для GitHub Container Registry
REGISTRY=ghcr.io/yourname   # Замените yourname вашим именем пользователя GitHub
REPOSITORY=notio
TAG=latest
```

> **Предупреждение**: Если вы видите ошибки типа `pull access denied for... repository does not exist or may require 'docker login'`, это значит, что указанный репозиторий не существует или требует аутентификации. Проверьте правильность переменных REGISTRY и REPOSITORY.

### Настройка учетных данных для панелей мониторинга

> **Важное предупреждение**: Docker Compose имеет проблемы с интерпретацией переменных окружения, содержащих специальные символы (особенно `$`), что часто приводит к ошибкам при запуске контейнеров. По этой причине рекомендуется хранить учетные данные в отдельных файлах вместо переменных в `.env`.

Из-за проблем с интерпретацией переменных окружения, содержащих символ `$` в Docker Compose, мы будем хранить учетные данные в отдельных файлах вместо переменных в .env:

```bash
# Установка утилиты htpasswd
sudo apt install -y apache2-utils

# Создание хеша пароля для Traefik Dashboard и сохранение в файл
echo -n "Введите пароль для доступа к панели Traefik: " && read -s TRAEFIK_PASSWORD && echo
htpasswd -nb admin $TRAEFIK_PASSWORD > secrets/traefik_auth
chmod 600 secrets/traefik_auth

# Создание хеша пароля для Prometheus и сохранение в файл
echo -n "Введите пароль для доступа к Prometheus: " && read -s PROMETHEUS_PASSWORD && echo
htpasswd -nbBC 10 admin $PROMETHEUS_PASSWORD > secrets/prometheus_auth
chmod 600 secrets/prometheus_auth

# Создание файла конфигурации для Prometheus
cat > monitoring/prometheus/web.yml <<EOF
basic_auth_users_file: /secrets/prometheus_auth
EOF

# ВАЖНО: Убедитесь, что в файле .env НЕТ переменных TRAEFIK_AUTH и PROMETHEUS_AUTH
# Если они там есть, удалите их:
sed -i '/TRAEFIK_AUTH/d' .env
sed -i '/PROMETHEUS_AUTH/d' .env
```

## Настройка конфигурационных файлов

### Создание сети Docker для Traefik

```bash
# Создание внешней сети для Traefik
docker network create web
```

### Настройка Traefik

```bash
# Создание директорий для Traefik
mkdir -p traefik
touch traefik/acme.json
chmod 600 traefik/acme.json
```

Создайте файл `traefik/traefik.yml`:

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
      email: ${TRAEFIK_ACME_EMAIL}
      storage: /acme.json
      httpChallenge:
        entryPoint: web
```

Создайте файл `traefik/dynamic.yml`:

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

### Проверка и правка docker-compose.prod.yml

Если в файле `docker-compose.prod.yml` есть атрибут `version`, удалите его, так как он считается устаревшим:

```bash
nano docker-compose.prod.yml
```

Найдите и удалите строку, содержащую `version: '3.8'` или подобное значение.

## Запуск приложения

### Подготовка к запуску

```bash
# Установка прав доступа для скриптов
chmod +x scripts/*.sh

# Проверка конфигурации на ошибки
docker compose -f docker-compose.prod.yml config
```

Если вы видите ошибки, исправьте их перед продолжением.

### Запуск приложения

```bash
# Запуск приложения в фоновом режиме
docker compose -f docker-compose.prod.yml up -d

# Проверка запущенных контейнеров
docker compose -f docker-compose.prod.yml ps

# Просмотр логов
docker compose -f docker-compose.prod.yml logs -f
```

### Настройка автоматического резервного копирования

```bash
# Установка планировщика cron, если не установлен
sudo apt install -y cron

# Настройка ежедневного резервного копирования в 2:00 ночи
./scripts/setup_backup_cron.sh -H 2 -m 0
```

## Настройка доменов и SSL

### Настройка DNS записей

Создайте следующие A-записи в DNS-настройках вашего домена, указывающие на IP-адрес вашего сервера:

- `yourdomain.com`
- `api.yourdomain.com`
- `grafana.yourdomain.com`
- `prometheus.yourdomain.com`
- `alerts.yourdomain.com`
- `logs.yourdomain.com`
- `traefik.yourdomain.com`

После настройки DNS и запуска приложения SSL-сертификаты должны быть автоматически получены через Let's Encrypt.

## Проверка работы приложения

После запуска всех компонентов и настройки SSL проверьте доступность:

1. **Основное приложение**: `https://yourdomain.com`
2. **API**: `https://api.yourdomain.com`
3. **Grafana**: `https://grafana.yourdomain.com` (admin / пароль из .env)
4. **Prometheus**: `https://prometheus.yourdomain.com` (данные из файла secrets/prometheus_auth)
5. **Kibana**: `https://logs.yourdomain.com` (данные из файла secrets/traefik_auth)
6. **Traefik Dashboard**: `https://traefik.yourdomain.com` (данные из файла secrets/traefik_auth)

## Управление приложением

### Основные команды

```bash
# Проверка статуса сервисов
docker compose -f docker-compose.prod.yml ps

# Просмотр логов сервиса
docker compose -f docker-compose.prod.yml logs -f [имя_сервиса]

# Просмотр логов всех сервисов
docker compose -f docker-compose.prod.yml logs -f

# Просмотр логов с ограничением (последние 100 строк)
docker compose -f docker-compose.prod.yml logs --tail=100 -f [имя_сервиса]

# Перезапуск всех сервисов
docker compose -f docker-compose.prod.yml restart

# Перезапуск конкретного сервиса
docker compose -f docker-compose.prod.yml restart [имя_сервиса]

# Остановка и удаление контейнеров (сохраняя данные)
docker compose -f docker-compose.prod.yml down

# Удаление контейнеров и их образов
docker compose -f docker-compose.prod.yml down --rmi all

# Удаление контейнеров и томов (удаляет все данные)
docker compose -f docker-compose.prod.yml down -v

# Запуск контейнеров
docker compose -f docker-compose.prod.yml up -d

# Проверка конфигурации на ошибки
docker compose -f docker-compose.prod.yml config
```

### Обновление приложения

#### Подготовка к обновлению

Перед обновлением важно выполнить подготовительные шаги для обеспечения безопасности данных:

```bash
# Переход в директорию проекта
cd /opt/notio

# Создание резервной копии данных
./scripts/backup.sh

# Сохранение конфигурационных файлов
cp .env .env.backup.$(date +%Y%m%d)
cp docker-compose.prod.yml docker-compose.prod.yml.backup.$(date +%Y%m%d)
cp -r secrets secrets.backup.$(date +%Y%m%d)

# Запись текущей версии для возможного отката
git describe --tags > /backup/current_version.txt
```

#### Проверка изменений

```bash
# Получение информации об обновлениях, не применяя их
git fetch

# Просмотр списка изменений
git log HEAD..origin/main --oneline

# Проверка измененных файлов
git diff --name-only HEAD..origin/main

# Проверка изменений в docker-compose.prod.yml
git diff HEAD..origin/main -- docker-compose.prod.yml

# Проверка изменений в .env.example
git diff HEAD..origin/main -- .env.example
```

#### Процесс обновления

Минимальное время простоя:

```bash
# 1. Получение обновлений
git pull

# 2. Проверка необходимости обновления переменных окружения
diff -u .env .env.example
# При наличии новых параметров, добавьте их в .env
# nano .env

# 3. Обновление образов без остановки сервисов
docker compose -f docker-compose.prod.yml pull

# 4. Перезапуск только измененных сервисов
docker compose -f docker-compose.prod.yml up -d --no-deps service1 service2

# 5. Либо перезапуск всех сервисов
docker compose -f docker-compose.prod.yml up -d

# 6. Проверка после обновления
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

#### Выполнение миграций базы данных (при необходимости)

```bash
# Выполнение миграций через контейнер API
docker compose -f docker-compose.prod.yml exec api npm run migrate
```

#### Процедура отката при возникновении проблем

```bash
# 1. Остановка контейнеров
docker compose -f docker-compose.prod.yml down

# 2. Восстановление конфигурационных файлов
cp .env.backup.$(date +%Y%m%d) .env
cp docker-compose.prod.yml.backup.$(date +%Y%m%d) docker-compose.prod.yml
rm -rf secrets && cp -r secrets.backup.$(date +%Y%m%d) secrets

# 3. Возврат к предыдущей версии кода
git reset --hard $(cat /backup/current_version.txt)

# 4. Запуск контейнеров с предыдущей конфигурацией
docker compose -f docker-compose.prod.yml up -d

# 5. При необходимости, восстановление из резервной копии
# Найдите последнюю резервную копию
LATEST_BACKUP=$(ls -t /backup/backup-*.tar.gz | head -1)
./scripts/restore.sh $LATEST_BACKUP
```

### Регулярные обновления Docker и системы

Регулярное обновление Docker и системных компонентов важно для поддержания безопасности:

```bash
# Обновление списка пакетов
sudo apt update

# Обновление всех пакетов системы
sudo apt upgrade -y

# Обновление Docker
sudo apt upgrade docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

# Перезапуск Docker после обновления
sudo systemctl restart docker

# Проверка версии Docker
docker --version
docker compose version

# Очистка неиспользуемых ресурсов Docker
docker system prune -f
```

Рекомендуется настроить автоматическое обновление системы безопасности:

```bash
# Установка unattended-upgrades
sudo apt install -y unattended-upgrades apt-listchanges

# Настройка автоматических обновлений
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Устранение неполадок

### Проблемы с запуском контейнеров

```bash
# Проверка статуса контейнеров
docker compose -f docker-compose.prod.yml ps

# Просмотр логов конкретного контейнера
docker compose -f docker-compose.prod.yml logs -f имя_контейнера

# Проверка общих проблем Docker
docker info
docker system df

# Проверка наличия пространства на диске
df -h

# Проверка журнала системы на наличие ошибок
sudo journalctl -u docker.service -n 100
```

### Проблемы с SSL-сертификатами

```bash
# Проверка логов Traefik
docker compose -f docker-compose.prod.yml logs -f traefik

# Проверка файла сертификатов
cat traefik/acme.json

# Проверка DNS-записей
dig yourdomain.com
dig api.yourdomain.com

# Проверка доступности сервиса Let's Encrypt
curl -I https://acme-v02.api.letsencrypt.org/directory
```

### Проблемы с сетевым доступом

```bash
# Проверка настроек брандмауэра
sudo ufw status verbose

# Проверка работающих портов
sudo netstat -tulpn

# Проверка доступности сервисов
curl -I http://localhost:80
curl -I https://localhost:443

# Проверка сетевых настроек Docker
docker network ls
docker network inspect web
```

### Проблемы с учетными данными и переменными окружения

При запуске Docker Compose могут возникать ошибки или предупреждения о неопределенных переменных окружения, особенно при использовании учетных данных, содержащих специальные символы:

1. **Проблема с символом `$` в переменных окружения**: Docker Compose может неправильно интерпретировать строки, содержащие символ `$`, принимая их за переменные.

   **Решение**: Хранить учетные данные в отдельных файлах вместо переменных окружения:
   ```bash
   # Создание директории для секретов, если она еще не существует
   mkdir -p secrets
   
   # Создание файлов с учетными данными для Traefik и Prometheus
   htpasswd -nb admin ВашПароль > secrets/traefik_auth
   chmod 600 secrets/traefik_auth
   
   htpasswd -nbBC 10 admin ВашПароль > secrets/prometheus_auth
   chmod 600 secrets/prometheus_auth
   
   # Удаление проблемных переменных из .env, если они там есть
   sed -i '/TRAEFIK_AUTH/d' .env
   sed -i '/PROMETHEUS_AUTH/d' .env
   ```

2. **Отсутствие файлов учетных данных или неправильные права доступа**:

   **Решение**: Проверить наличие файлов и установить правильные права доступа:
   ```bash
   ls -la secrets/
   chmod 600 secrets/traefik_auth secrets/prometheus_auth
   ```

3. **Проблемы с монтированием файлов в контейнеры**:

   **Решение**: Проверить конфигурацию Docker Compose и монтирование файлов:
   ```bash
   # Проверка конфигурации Docker Compose
   docker compose -f docker-compose.prod.yml config
   
   # Проверка наличия файлов внутри контейнера
   docker compose -f docker-compose.prod.yml exec traefik ls -la /secrets
   docker compose -f docker-compose.prod.yml exec prometheus ls -la /secrets
   ```

4. **Общие проблемы с конфигурацией**:

   **Решение**: Очистка и перезапуск Docker:
   ```bash
   # Остановка контейнеров
   docker compose -f docker-compose.prod.yml down
   
   # Очистка неиспользуемых ресурсов
   docker system prune -f
   
   # Перезапуск Docker
   sudo systemctl restart docker
   
   # Запуск контейнеров
   docker compose -f docker-compose.prod.yml up -d
   ```

### Проблемы с доступом к Docker образам

Если при запуске вы видите ошибки вида:
```
Error response from daemon: pull access denied for yourname/service, repository does not exist or may require 'docker login': denied: requested access to the resource is denied
```

**Решение**:
1. Проверьте значения переменных в секции Docker в файле `.env`:
   ```bash
   nano .env
   ```

2. Для использования стандартных образов:
   ```
   REGISTRY=
   REPOSITORY=
   ```

3. Для использования своего репозитория:
   ```bash
   docker login
   # Введите свои учетные данные
   ```

4. Перезапустите контейнеры:
   ```bash
   docker compose -f docker-compose.prod.yml down
   docker compose -f docker-compose.prod.yml up -d
   ```

## Документация API

API предоставляет RESTful интерфейс для взаимодействия с бэкендом. Полная документация доступна по адресу `https://api.yourdomain.com/docs` после запуска сервера.

## Вклад в проект

Мы приветствуем вклад в проект! Пожалуйста, создавайте pull request'ы и открывайте issues для обсуждения новых функций и исправлений.

## Лицензия

Этот проект лицензирован под MIT License. Подробности в файле LICENSE 