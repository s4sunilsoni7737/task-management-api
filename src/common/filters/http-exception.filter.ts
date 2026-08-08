import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * ✅ PATTERN: Errors are thrown as NestJS HTTP exceptions — never returned
 * as `success: false` inside a 200. This filter only normalizes the
 * *shape* of that error response so every failure — validation error,
 * NotFoundException, unexpected 500 — looks the same on the wire:
 *
 * { success: false, userMessage, developerMessage, data: {}, statusCode, path, timestamp }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let userMessage = 'Something went wrong. Please try again.';
    let developerMessage = 'Internal server error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        userMessage = exceptionResponse;
        developerMessage = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const body = exceptionResponse as Record<string, any>;
        // class-validator's ValidationPipe throws { message: string[] | string, error, statusCode }
        const rawMessage = body.userMessage ?? body.message ?? exception.message;
        userMessage = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
        developerMessage = body.developerMessage ?? userMessage;
      }
    } else if (exception instanceof Error) {
      developerMessage = exception.message;
      this.logger.error(exception.message, exception.stack);
    }

    response.status(statusCode).json({
      success: false,
      userMessage,
      developerMessage,
      data: {},
      statusCode,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
