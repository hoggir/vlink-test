import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    context: ExecutionContext,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest();

    throw new HttpException(
      {
        success: false,
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        error: 'Too Many Requests',
        message: 'Terlalu banyak permintaan, coba lagi nanti',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
