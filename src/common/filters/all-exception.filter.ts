import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoggerCollectionName, LoggerEntity } from '../entities/logger.entity';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectModel(LoggerEntity.name)
    private readonly loggerModel: Model<LoggerEntity>,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<any> {
    const [req] = host.getArgs();
    const startTime = +req._startTime;
    const endTime = +new Date();
    const reqTime = endTime - startTime; // milliseconds

    // In certain situations `httpAdapter` might not be available in the constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let formattedResponse = {};

    if (exception instanceof HttpException) {
      const exceptionResponse: any = exception.getResponse();
      const statusCode = exception.getStatus();
      let userMessage = exceptionResponse?.userMessage || exceptionResponse?.message;
      let developerMessage =
        exceptionResponse?.developerMessage || exceptionResponse?.message || 'Something went wrong';

      // To customize system generated error messages
      switch (developerMessage) {
        case 'Unauthorized':
          developerMessage = 'Unauthorized';
          userMessage = 'You are not authorized to perform this action';
          break;
        case 'Forbidden resource':
          developerMessage = 'Forbidden resource';
          userMessage = 'You do not have permission to access this resource';
          break;
      }

      formattedResponse = {
        statusCode,
        success: false,
        userMessage: typeof userMessage === 'string' ? userMessage : userMessage.toString(),
        developerMessage:
          typeof developerMessage === 'string' ? developerMessage : developerMessage.toString(),
        data: {},
      };
    } else {
      formattedResponse = {
        statusCode,
        success: false,
        userMessage: 'Something went wrong. Please try again.',
        developerMessage: 'Internal Server Error.',
        data: {},
      };
    }

    let logDoc: any;
    if (req.url !== '/') {
      logDoc = await this.loggerModel.create({
        requestMethod: req.method,
        requestUrl: req.url,
        requestHeaders: req.headers,
        requestBody: req.body,
        statusCode: formattedResponse['statusCode'],
        responseBody: formattedResponse,
        startTime,
        endTime,
        executionTime: reqTime,
      });
    }
    httpAdapter.reply(
      ctx.getResponse(),
      { logId: logDoc?._id, ...formattedResponse },
      formattedResponse['statusCode'],
    );
  }
}
