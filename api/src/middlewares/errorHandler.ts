import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Типы ошибок API
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Предопределенные классы ошибок
export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request') {
    super(400, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

export class ValidationError extends ApiError {
  errors: any;

  constructor(message = 'Validation Error', errors = {}) {
    super(422, message);
    this.errors = errors;
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Internal Server Error') {
    super(500, message);
  }
}

// Middleware для обработки ошибок
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Преобразуем неизвестную ошибку в ApiError
  let error = err;
  if (!(error instanceof ApiError)) {
    error = new ApiError(500, err.message || 'Internal Server Error', false);
  }

  const apiError = error as ApiError;

  // Логирование ошибки
  if (!apiError.isOperational) {
    logger.error(err.stack || err);
  } else {
    logger.warn(`${apiError.statusCode} - ${apiError.message}`);
  }

  // В production не отправляем стек ошибок
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Формируем ответ с ошибкой
  const response = {
    error: {
      message: apiError.message,
      ...(isDevelopment && { stack: apiError.stack }),
      ...(apiError instanceof ValidationError && { errors: apiError.errors }),
    },
    statusCode: apiError.statusCode,
    status: 'error',
  };

  // Отправляем ответ с ошибкой
  res.status(apiError.statusCode).json(response);
};

export default errorHandler;
