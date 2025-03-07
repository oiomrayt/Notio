# Руководство по разработке

## 🚀 Начало работы

### Требования
- Node.js 18+
- Docker
- Git
- VS Code с рекомендуемыми расширениями

### Установка

```bash
# Клонирование репозитория
git clone https://github.com/your-username/notio.git
cd notio

# Установка зависимостей
npm install

# Настройка окружения
cp .env.example .env

# Запуск в режиме разработки
npm run dev
```

## 📁 Структура проекта

```
notio/
├── app/                  # Frontend (React)
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── hooks/      # Кастомные хуки
│   │   ├── pages/      # Страницы приложения
│   │   ├── store/      # Управление состоянием
│   │   └── utils/      # Утилиты
│   └── package.json
│
├── api/                 # Backend (Node.js)
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── utils/
│   └── package.json
│
├── electron/            # Desktop (Electron)
│   ├── src/
│   │   ├── main/
│   │   ├── preload/
│   │   └── utils/
│   └── package.json
│
├── docs/               # Документация
├── scripts/           # Скрипты
└── package.json       # Root package.json
```

## 🔧 Разработка

### Рабочий процесс

1. Создание ветки:
```bash
git checkout -b feature/new-feature
```

2. Разработка:
```bash
# Запуск в режиме разработки
npm run dev

# Запуск тестов
npm test

# Проверка типов
npm run type-check

# Линтинг
npm run lint
```

3. Коммит:
```bash
# Проверка изменений
git status
git diff

# Добавление файлов
git add .

# Создание коммита
git commit -m "feat: add new feature"
```

4. Пуш и создание PR:
```bash
git push origin feature/new-feature
```

### Конвенции

#### Именование веток
- `feature/*` - новые функции
- `bugfix/*` - исправление ошибок
- `hotfix/*` - срочные исправления
- `release/*` - подготовка релиза

#### Коммиты
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Типы:
- `feat`: новая функциональность
- `fix`: исправление ошибки
- `docs`: изменения в документации
- `style`: форматирование кода
- `refactor`: рефакторинг кода
- `test`: добавление тестов
- `chore`: обновление зависимостей

#### Стиль кода

```typescript
// Интерфейсы
interface User {
  id: string;
  email: string;
  name: string;
}

// Типы
type UserRole = 'admin' | 'user';

// Классы
class UserService {
  private users: User[] = [];

  async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }
}

// Функции
async function createUser(data: Omit<User, 'id'>): Promise<User> {
  // ...
}

// React компоненты
const UserProfile: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};
```

## 🧪 Тестирование

### Unit тесты

```typescript
// src/__tests__/services/user.service.test.ts
import { UserService } from '../../services/user.service';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  it('should create a new user', async () => {
    const user = await userService.create({
      email: 'test@example.com',
      name: 'Test User'
    });

    expect(user).toHaveProperty('id');
    expect(user.email).toBe('test@example.com');
  });
});
```

### Интеграционные тесты

```typescript
// src/__tests__/api/auth.test.ts
import request from 'supertest';
import { app } from '../../app';

describe('Auth API', () => {
  it('should login user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

### E2E тесты

```typescript
// cypress/e2e/auth.cy.ts
describe('Authentication', () => {
  it('should login user', () => {
    cy.visit('/login');
    
    cy.get('[data-testid="email-input"]')
      .type('test@example.com');
      
    cy.get('[data-testid="password-input"]')
      .type('password123');
      
    cy.get('[data-testid="login-button"]')
      .click();
      
    cy.url().should('include', '/dashboard');
  });
});
```

## 📝 Документация

### JSDoc

```typescript
/**
 * Сервис для работы с пользователями
 */
class UserService {
  /**
   * Создает нового пользователя
   * @param {CreateUserDto} data - Данные пользователя
   * @returns {Promise<User>} Созданный пользователь
   * @throws {ValidationError} Если данные некорректны
   */
  async create(data: CreateUserDto): Promise<User> {
    // ...
  }
}
```

### API документация

```typescript
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Создание нового пользователя
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Пользователь создан
 *       400:
 *         description: Некорректные данные
 */
router.post('/users', createUser);
```

## 🔒 Безопасность

### Проверка зависимостей

```bash
# Проверка уязвимостей
npm audit

# Обновление зависимостей
npm update

# Фиксация версий
npm shrinkwrap
```

### Валидация данных

```typescript
// src/validators/user.validator.ts
import { body } from 'express-validator';

export const createUserValidator = [
  body('email')
    .isEmail()
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/),
    
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
];
```

### Обработка ошибок

```typescript
// src/middleware/error.middleware.ts
import { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Логирование ошибки
  logger.error(err);

  // Определение типа ошибки
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details
    });
  }

  // Общая ошибка
  return res.status(500).json({
    error: 'Internal Server Error'
  });
};
```

## 🔄 CI/CD

### Pre-commit хуки

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm test"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### GitHub Actions

```yaml
# .github/workflows/pr.yml
name: Pull Request

on:
  pull_request:
    branches: [ main, develop ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linter
        run: npm run lint
        
      - name: Run tests
        run: npm test
```

## 📈 Мониторинг

### Логирование

```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    })
  ]
});
```

### Метрики

```typescript
// src/middleware/metrics.middleware.ts
import { RequestHandler } from 'express';
import { register, Histogram } from 'prom-client';

const httpRequestDurationMicroseconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code']
});

export const metricsMiddleware: RequestHandler = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    httpRequestDurationMicroseconds
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(duration / 1000);
  });
  
  next();
};
```

## 📝 Чеклист

### Перед коммитом
- [ ] Код отформатирован
- [ ] Линтер не выдает ошибок
- [ ] Тесты проходят
- [ ] Документация обновлена

### Перед PR
- [ ] Ветка обновлена из main
- [ ] Конфликты разрешены
- [ ] Добавлены тесты
- [ ] Обновлена документация

### Перед релизом
- [ ] Версия обновлена
- [ ] Changelog обновлен
- [ ] Проведено тестирование
- [ ] Документация актуальна 