# Документация API

API предоставляет RESTful интерфейс для взаимодействия с бэкендом Notio. Ниже приведены основные эндпоинты и их описание.

## Аутентификация

- **POST /api/auth/login**: Авторизация пользователя
- **POST /api/auth/register**: Регистрация нового пользователя
- **POST /api/auth/logout**: Выход из системы

## Пользователи

- **GET /api/users**: Получение списка пользователей
- **GET /api/users/{id}**: Получение информации о пользователе
- **PUT /api/users/{id}**: Обновление информации о пользователе
- **DELETE /api/users/{id}**: Удаление пользователя

## Задачи

- **GET /api/tasks**: Получение списка задач
- **POST /api/tasks**: Создание новой задачи
- **GET /api/tasks/{id}**: Получение информации о задаче
- **PUT /api/tasks/{id}**: Обновление задачи
- **DELETE /api/tasks/{id}**: Удаление задачи

## Проекты

- **GET /api/projects**: Получение списка проектов
- **POST /api/projects**: Создание нового проекта
- **GET /api/projects/{id}**: Получение информации о проекте
- **PUT /api/projects/{id}**: Обновление проекта
- **DELETE /api/projects/{id}**: Удаление проекта

## Примеры запросов

### Авторизация пользователя

```http
POST /api/auth/login HTTP/1.1
Host: api.notio.app
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Создание задачи

```http
POST /api/tasks HTTP/1.1
Host: api.notio.app
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Новая задача",
  "description": "Описание задачи",
  "dueDate": "2023-12-31"
}
```

## Ошибки

Все ошибки возвращаются в формате JSON с полем `error` и соответствующим сообщением. Например:

```json
{
  "error": "Unauthorized"
}
```

## Лицензия

Этот проект лицензирован под MIT License. Подробности в файле LICENSE. 