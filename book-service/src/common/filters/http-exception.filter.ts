import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Request, Response } from 'express';
import { ErrorLog } from '../database/schemas/error-log.schema';
import { Model } from 'mongoose';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    @InjectModel(ErrorLog.name)
    private readonly errorLogModel: Model<ErrorLog>,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const res = exceptionResponse as any;

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        error = (exceptionResponse as any).error || error;

        if (Array.isArray(res.message)) {
          message = res.message.join(', ');
          error = 'Validation Error';
        } else {
          message = res.message || message;
          error = res.error || error;
        }
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : exception,
    );

    this.errorLogModel
      .create({
        path: request.url,
        method: request.method,
        statusCode: status,
        error: error,
        message,
        stack: exception instanceof Error ? exception.stack : null,
        meta: {
          body: request.body,
          query: request.query,
          params: request.params,
        },
      })
      .catch((dbError) => {
        this.logger.warn(
          `❌ Gagal menyimpan error ke MongoDB: ${dbError.message}`,
        );
      });

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: error,
      message: message,
    });
  }
}
