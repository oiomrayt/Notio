# Мониторинг и логирование

## 📊 Grafana

### Доступ
- URL: https://grafana.your-domain.com
- Логин: admin
- Пароль: [указан в .env]

### Дашборды

#### 1. Общий обзор системы
- Статус сервисов
- Использование ресурсов
- Ключевые метрики
- Активные алерты

#### 2. API Метрики
- Запросы в секунду
- Latency (p50, p90, p99)
- Ошибки
- Статус коды
- Размер ответов

#### 3. База данных
- Connections
- Query performance
- Cache hits/misses
- Table sizes
- Locks
- Vacuum status

#### 4. Redis
- Memory usage
- Connected clients
- Operations/sec
- Cache hit ratio
- Evictions

#### 5. Инфраструктура
- CPU usage
- Memory usage
- Disk I/O
- Network I/O
- System load

## 🔍 Prometheus

### Метрики

#### Application Metrics
```
# Requests
http_requests_total{method="GET", path="/api/notes"}
http_request_duration_seconds{method="GET", path="/api/notes"}

# Errors
http_errors_total{method="GET", path="/api/notes", status="500"}

# Memory
process_resident_memory_bytes
process_heap_bytes

# Custom
api_notes_created_total
api_users_registered_total
```

#### Database Metrics
```
# Connections
pg_stat_activity_count
pg_stat_activity_max_tx_duration

# Performance
pg_stat_database_tup_fetched
pg_stat_database_tup_inserted
pg_stat_database_tup_updated
pg_stat_database_tup_deleted

# Cache
pg_stat_database_blks_hit
pg_stat_database_blks_read
```

#### Redis Metrics
```
# Memory
redis_memory_used_bytes
redis_memory_max_bytes

# Operations
redis_commands_total
redis_commands_duration_seconds_total

# Keys
redis_db_keys
redis_expired_keys_total
```

### PromQL Примеры

```promql
# Rate of HTTP requests
rate(http_requests_total{job="api"}[5m])

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
sum(rate(http_errors_total[5m])) by (path) / sum(rate(http_requests_total[5m])) by (path)

# Memory usage
process_resident_memory_bytes / 1024 / 1024
```

## ⚡ Alertmanager

### Правила алертов

```yaml
groups:
- name: api
  rules:
  - alert: HighErrorRate
    expr: sum(rate(http_errors_total[5m])) / sum(rate(http_requests_total[5m])) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: High error rate (> 5%)
      
  - alert: HighLatency
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High latency (p95 > 1s)
      
  - alert: HighMemoryUsage
    expr: process_resident_memory_bytes > 1.5e9
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High memory usage (> 1.5GB)
```

### Маршрутизация алертов

```yaml
route:
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'slack'
  
receivers:
- name: 'slack'
  slack_configs:
  - channel: '#alerts'
    api_url: 'https://hooks.slack.com/services/...'
    
- name: 'email'
  email_configs:
  - to: 'team@example.com'
```

## 📝 Логирование

### Winston Configuration

```typescript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Уровни логирования

- **ERROR**: Критические ошибки
  ```typescript
  logger.error('Database connection failed', { error });
  ```

- **WARN**: Предупреждения
  ```typescript
  logger.warn('Rate limit exceeded', { ip, endpoint });
  ```

- **INFO**: Важные события
  ```typescript
  logger.info('User registered', { userId });
  ```

- **DEBUG**: Отладочная информация
  ```typescript
  logger.debug('Processing request', { params });
  ```

### Loki

#### Запросы

```logql
# Ошибки за последний час
{app="api"} |= "error" | json | last 1h

# Slow queries
{app="api"} 
  | json 
  | duration > 1s 
  | line_format "{{.path}} took {{.duration}}"

# Auth failures
{app="api"} 
  |= "authentication failed" 
  | json 
  | count_over_time[1h]
```

## 🔄 Интеграции

### Slack

```yaml
# alertmanager.yml
receivers:
- name: 'slack'
  slack_configs:
  - channel: '#alerts'
    api_url: 'https://hooks.slack.com/services/...'
    title: '{{ .GroupLabels.alertname }}'
    text: >-
      {{ range .Alerts }}
      *Alert:* {{ .Annotations.summary }}
      *Details:*
      {{ range .Labels.SortedPairs }} • *{{ .Name }}:* `{{ .Value }}`
      {{ end }}
      {{ end }}
```

### Email

```yaml
# alertmanager.yml
receivers:
- name: 'email'
  email_configs:
  - to: 'team@example.com'
    from: 'alertmanager@example.com'
    smarthost: 'smtp.example.com:587'
    auth_username: 'alertmanager@example.com'
    auth_password: 'password'
```

### PagerDuty

```yaml
# alertmanager.yml
receivers:
- name: 'pagerduty'
  pagerduty_configs:
  - service_key: '<your-service-key>'
    description: '{{ .CommonAnnotations.summary }}'
```

## 📈 Визуализация

### Grafana Dashboard JSON

```json
{
  "title": "API Overview",
  "panels": [
    {
      "title": "Requests per Second",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total[5m])) by (path)",
          "legendFormat": "{{path}}"
        }
      ]
    },
    {
      "title": "Error Rate",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "sum(rate(http_errors_total[5m])) by (path) / sum(rate(http_requests_total[5m])) by (path)",
          "legendFormat": "{{path}}"
        }
      ]
    }
  ]
}
```

## 🔍 Отладка

### Полезные команды

```bash
# Просмотр логов
docker-compose logs -f api

# Метрики Prometheus
curl localhost:9090/api/v1/query?query=up

# Статус Alertmanager
curl -s localhost:9093/api/v1/alerts

# Проверка конфигурации
promtool check rules rules.yml
amtool check-config alertmanager.yml
```

### Тестирование алертов

```bash
# Отправка тестового алерта
curl -H "Content-Type: application/json" -d '[{
  "labels": {
    "alertname": "TestAlert",
    "service": "api",
    "severity": "warning"
  },
  "annotations": {
    "summary": "Test alert"
  }
}]' localhost:9093/api/v1/alerts
``` 