import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  IsEnum,
} from 'class-validator';

export enum ErrorLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
}

export class CreateErrorLogDto {
  @IsEnum(ErrorLevel)
  level: ErrorLevel;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };

  @IsOptional()
  @IsObject()
  context?: {
    userId?: number;
    path?: string;
    method?: string;
    statusCode?: number;
    userAgent?: string;
    ip?: string;
    [key: string]: any;
  };

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class QueryErrorLogDto {
  @IsOptional()
  @IsEnum(ErrorLevel)
  level?: ErrorLevel;

  @IsOptional()
  @IsBoolean()
  resolved?: boolean;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 50;
}
