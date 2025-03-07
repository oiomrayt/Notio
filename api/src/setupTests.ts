import { beforeAll, afterAll, jest } from '@jest/globals';

// Увеличиваем timeout для тестов с базой данных
jest.setTimeout(10000);

// Мокаем переменные окружения
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Очистка всех моков после каждого теста
afterAll(() => {
  jest.clearAllMocks();
});
