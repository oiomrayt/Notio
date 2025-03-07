# Тестирование

## 🧪 Типы тестов

### Unit тесты
- Тестирование отдельных компонентов
- Тестирование утилит и хелперов
- Тестирование бизнес-логики
- Тестирование валидаторов

### Интеграционные тесты
- Тестирование API endpoints
- Тестирование взаимодействия с базой данных
- Тестирование взаимодействия с Redis
- Тестирование аутентификации

### E2E тесты
- Тестирование основных пользовательских сценариев
- Тестирование UI компонентов
- Тестирование форм
- Тестирование навигации

## 🛠️ Инструменты

### Backend тестирование
- Jest
- Supertest
- Testcontainers
- Faker

### Frontend тестирование
- Vitest
- Testing Library
- Cypress
- MSW (Mock Service Worker)

## 📝 Примеры тестов

### Unit тесты

```typescript
// src/__tests__/utils/encryption.test.ts
import { Encryption } from '../../utils/encryption';

describe('Encryption', () => {
  let encryption: Encryption;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = 'test-key'.padEnd(32, '0');
    process.env.ENCRYPTION_IV = 'test-iv'.padEnd(16, '0');
    encryption = new Encryption();
  });

  it('should encrypt and decrypt text correctly', () => {
    const text = 'Hello, World!';
    const encrypted = encryption.encrypt(text);
    const decrypted = encryption.decrypt(encrypted);
    expect(decrypted).toBe(text);
  });

  it('should produce different ciphertexts for same input', () => {
    const text = 'Hello, World!';
    const encrypted1 = encryption.encrypt(text);
    const encrypted2 = encryption.encrypt(text);
    expect(encrypted1).not.toBe(encrypted2);
  });
});
```

### API тесты

```typescript
// src/__tests__/api/notes.test.ts
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../db';
import { createTestUser, generateToken } from '../helpers';

describe('Notes API', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const user = await createTestUser();
    userId = user.id;
    token = generateToken(user);
  });

  afterAll(async () => {
    await prisma.note.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  describe('POST /api/notes', () => {
    it('should create a new note', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Note',
          content: 'Test Content',
          tags: ['test']
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Note');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          param: 'title',
          msg: 'Title is required'
        })
      );
    });
  });
});
```

### E2E тесты

```typescript
// cypress/e2e/notes.cy.ts
describe('Notes', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/notes');
  });

  it('should create a new note', () => {
    cy.get('[data-testid="new-note-button"]').click();
    cy.get('[data-testid="note-title"]').type('Test Note');
    cy.get('[data-testid="note-content"]').type('Test Content');
    cy.get('[data-testid="save-note"]').click();

    cy.get('[data-testid="notes-list"]')
      .should('contain', 'Test Note');
  });

  it('should edit an existing note', () => {
    cy.createNote('Test Note', 'Test Content');
    cy.get('[data-testid="note-item"]').first().click();
    cy.get('[data-testid="edit-note"]').click();
    cy.get('[data-testid="note-title"]')
      .clear()
      .type('Updated Note');
    cy.get('[data-testid="save-note"]').click();

    cy.get('[data-testid="notes-list"]')
      .should('contain', 'Updated Note');
  });
});
```

## 🔄 CI/CD тесты

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:6
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Run type check
      run: npm run type-check

    - name: Run tests
      run: npm test
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/test
        REDIS_URL: redis://localhost:6379
        JWT_SECRET: test-secret
        NODE_ENV: test
```

## 📊 Покрытие кода

### Jest конфигурация

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFiles: ['<rootDir>/src/__tests__/setup.ts']
};
```

### Отчет о покрытии

```bash
# Запуск тестов с отчетом о покрытии
npm run test:coverage

# Результат
--------------------------------|---------|----------|---------|---------|
File                            | % Stmts | % Branch | % Funcs | % Lines |
--------------------------------|---------|----------|---------|---------|
All files                       |   85.71 |    78.95 |   84.21 |   85.71 |
 src/controllers               |   89.47 |    83.33 |   88.89 |   89.47 |
  note.controller.ts           |   91.67 |    85.71 |   90.00 |   91.67 |
  user.controller.ts           |   87.50 |    81.82 |   87.50 |   87.50 |
 src/services                  |   86.96 |    80.00 |   85.71 |   86.96 |
  note.service.ts             |   88.89 |    83.33 |   87.50 |   88.89 |
  user.service.ts             |   85.71 |    77.78 |   84.62 |   85.71 |
--------------------------------|---------|----------|---------|---------|
```

## 🔍 Тестовые данные

### Фабрики

```typescript
// src/__tests__/factories/note.factory.ts
import { faker } from '@faker-js/faker';
import { prisma } from '../../db';
import { Note } from '@prisma/client';

export const createNote = async (userId: string, override = {}): Promise<Note> => {
  return await prisma.note.create({
    data: {
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(),
      userId,
      tags: [faker.word.sample(), faker.word.sample()],
      ...override
    }
  });
};
```

### Хелперы

```typescript
// src/__tests__/helpers/auth.helper.ts
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { createUser } from '../factories/user.factory';

export const createTestUser = async (override = {}) => {
  return await createUser({
    email: 'test@example.com',
    password: 'password123',
    ...override
  });
};

export const generateToken = (user: User) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
};
```

## 🔄 Тестовое окружение

### Docker Compose для тестов

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: test
    ports:
      - "5432:5432"

  redis:
    image: redis:6
    ports:
      - "6379:6379"

  api:
    build:
      context: .
      target: test
    environment:
      NODE_ENV: test
      DATABASE_URL: postgresql://test:test@postgres:5432/test
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - /app/node_modules
    command: npm test
```

## 📝 Чеклист тестирования

### Перед коммитом
- [ ] Запустить линтер
- [ ] Запустить type check
- [ ] Запустить unit тесты
- [ ] Проверить покрытие кода

### Перед деплоем
- [ ] Запустить все тесты
- [ ] Запустить E2E тесты
- [ ] Проверить производительность
- [ ] Проверить безопасность

### После деплоя
- [ ] Запустить smoke тесты
- [ ] Проверить мониторинг
- [ ] Проверить логи
- [ ] Проверить метрики 