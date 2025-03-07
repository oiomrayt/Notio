import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { PrismaClient } from '@prisma/client';
import config from './config/config';
import logger from './utils/logger';
import errorHandler from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import pageRoutes from './routes/pageRoutes';
import databaseRoutes from './routes/databaseRoutes';
import analyticsRoutes from './routes/analyticsRoutes';

// Инициализация Prisma клиента
export const prisma = new PrismaClient();

// Создание Express-приложения
const app = express();

// Middlewares
app.use(helmet()); // Безопасность
app.use(cors({ origin: config.cors.origin })); // CORS
app.use(compression()); // Сжатие ответов
app.use(express.json({ limit: '10mb' })); // Парсинг JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Парсинг URL-encoded

// Логирование запросов
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// API Endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', version: '1.0.0' });
});

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/databases', databaseRoutes);
app.use('/api/analytics', analyticsRoutes);

// Обработка 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Обработка ошибок
app.use(errorHandler);

// Запуск сервера
const server = app.listen(config.port, config.host, () => {
  logger.info(`Server running in ${config.env} mode on http://${config.host}:${config.port}`);
});

// Обработка необработанных исключений
process.on('uncaughtException', error => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Обработка необработанных отклонений промисов
process.on('unhandledRejection', reason => {
  logger.error('Unhandled Rejection:', reason);
});

// Изящное завершение
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    prisma.$disconnect().then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    });
  });
});

export default app;
