import winston from 'winston';
import config from '../config/config';

// Форматы логов
const formats = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Транспорты логов
const transports = [
  // Пишем все логи с уровнем 'info' и выше в 'combined.log'
  new winston.transports.File({ filename: 'logs/combined.log' }),
  // Пишем логи с уровнем 'error' в 'error.log'
  new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
];

// Если мы не в production, то также выводим логи в консоль
if (config.env !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  );
}

// Создание логгера
const logger = winston.createLogger({
  level: config.logging.level,
  levels: winston.config.npm.levels,
  format: formats,
  transports,
  // Не завершать логгер при необработанных исключениях
  exitOnError: false,
});

// Создадим поток записи для Express
logger.stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
