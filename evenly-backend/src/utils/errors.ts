import { FastifyError, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error') {
    super(message, 500);
    this.name = 'DatabaseError';
  }
}

export class AuthServiceError extends AppError {
  constructor(message: string = 'Authentication service error') {
    super(message, 503);
    this.name = 'AuthServiceError';
  }
}

export const handleError = (error: Error, reply: FastifyReply) => {

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      value: (err as any).received,
    }));

    return reply.status(400).send({
      statusCode: 400,
      error: 'Validation Error',
      message: 'Invalid request data',
      details: validationErrors,
    });
  }

  // Handle custom app errors
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: error.name,
      message: error.message,
    });
  }

  // Handle Fastify errors
  if (error instanceof Error && 'statusCode' in error) {
    const fastifyError = error as FastifyError;
    return reply.status(fastifyError.statusCode || 500).send({
      statusCode: fastifyError.statusCode || 500,
      error: fastifyError.name || 'Internal Server Error',
      message: fastifyError.message,
    });
  }

  // Handle database errors
  if (error instanceof Error && 'code' in error) {
    const dbError = error as any;
    
    switch (dbError.code) {
      case '23505': // Unique violation
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'Resource already exists',
        });
      case '23503': // Foreign key violation
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Referenced resource does not exist',
        });
      case '23502': // Not null violation
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Required field is missing',
        });
      default:
        return reply.status(500).send({
          statusCode: 500,
          error: 'Database Error',
          message: 'An error occurred while processing your request',
        });
    }
  }

  // Handle unknown errors
  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
};

export const asyncHandler = (fn: Function) => {
  return (request: any, reply: any, next?: any) => {
    Promise.resolve(fn(request, reply, next)).catch((error) => {
      handleError(error, reply);
    });
  };
};
