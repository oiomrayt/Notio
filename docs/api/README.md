# API Documentation

## 🔑 Аутентификация

Все запросы к API должны содержать JWT токен в заголовке:
```
Authorization: Bearer <token>
```

### Получение токена

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Ответ:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

## 📝 Endpoints

### Пользователи

#### Регистрация пользователя
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

#### Получение профиля
```http
GET /api/users/me
Authorization: Bearer <token>
```

#### Обновление профиля
```http
PUT /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Name",
  "avatar": "https://example.com/avatar.jpg"
}
```

### Заметки

#### Создание заметки
```http
POST /api/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Заголовок",
  "content": "Содержание заметки",
  "tags": ["работа", "идеи"]
}
```

#### Получение списка заметок
```http
GET /api/notes
Authorization: Bearer <token>
```

Параметры запроса:
- `page`: номер страницы (по умолчанию 1)
- `limit`: количество записей на странице (по умолчанию 20)
- `sort`: поле для сортировки (по умолчанию "createdAt")
- `order`: порядок сортировки ("asc" или "desc")
- `search`: поиск по заголовку и содержимому
- `tags`: фильтр по тегам (массив)

#### Получение заметки
```http
GET /api/notes/:id
Authorization: Bearer <token>
```

#### Обновление заметки
```http
PUT /api/notes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Новый заголовок",
  "content": "Новое содержание",
  "tags": ["работа"]
}
```

#### Удаление заметки
```http
DELETE /api/notes/:id
Authorization: Bearer <token>
```

### Теги

#### Получение списка тегов
```http
GET /api/tags
Authorization: Bearer <token>
```

#### Создание тега
```http
POST /api/tags
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "работа",
  "color": "#FF0000"
}
```

## 📊 Коды ответов

- `200 OK`: Успешный запрос
- `201 Created`: Ресурс успешно создан
- `400 Bad Request`: Неверный запрос
- `401 Unauthorized`: Требуется аутентификация
- `403 Forbidden`: Доступ запрещен
- `404 Not Found`: Ресурс не найден
- `422 Unprocessable Entity`: Ошибка валидации
- `429 Too Many Requests`: Превышен лимит запросов
- `500 Internal Server Error`: Внутренняя ошибка сервера

## 🔒 Ограничения

- Rate Limiting: 100 запросов в минуту
- Максимальный размер запроса: 10MB
- Поддерживаемые форматы изображений: JPG, PNG, GIF
- Максимальный размер изображения: 5MB

## 📝 Примеры ошибок

### Ошибка валидации
```json
{
  "error": "Validation Error",
  "details": {
    "email": ["Неверный формат email"],
    "password": ["Пароль должен содержать минимум 8 символов"]
  }
}
```

### Ошибка аутентификации
```json
{
  "error": "Unauthorized",
  "message": "Invalid token"
}
```

### Превышение лимита запросов
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "retryAfter": 60
}
```

## 🔄 Версионирование

API версионируется через URL:
```
https://api.example.com/v1/...
```

## 📦 Модели данных

### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Note
```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Tag
```typescript
interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
``` 