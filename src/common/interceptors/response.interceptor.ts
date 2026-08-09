import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { map, Observable } from 'rxjs'
import { LoggerCollectionName, LoggerEntity } from '../entities/logger.entity'

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(
    @InjectModel(LoggerEntity.name)
    private readonly loggerModel: Model<LoggerEntity>,
  ) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(async (responseData) => {
        const [req, res] = context.getArgs()

        const startTime = +req._startTime
        const endTime = +new Date()
        const reqTime = endTime - startTime // milliseconds
        res.statusCode = responseData?.statusCode || HttpStatus.OK

        let userMessage = responseData?.userMessage ?? ''
        let developerMessage = responseData?.developerMessage ?? ''

        const formattedResponse = {
          statusCode: res.statusCode,
          success: responseData.success === false ? false : true,
          userMessage: userMessage ? responseData.userMessage : '',
          developerMessage: developerMessage ? responseData.developerMessage : '',
          data: responseData.data || {},
        }

        const logDoc = await this.loggerModel.create({
          requestMethod: req.method,
          requestUrl: req.url,
          requestHeaders: req.headers,
          requestBody: req.body,
          statusCode: res.statusCode,
          responseBody: formattedResponse,
          startTime,
          endTime,
          executionTime: reqTime,
        })
        return { logId: logDoc._id, ...formattedResponse }
      }),
    )
  }
}