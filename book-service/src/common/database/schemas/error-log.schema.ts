import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ErrorLogDocument = ErrorLog & Document;

@Schema({ timestamps: true, collection: 'error_logs' })
export class ErrorLog {
  @Prop({ required: true, index: true })
  level: string; // 'error', 'warn', 'info'

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object })
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };

  @Prop({ type: Object })
  context?: {
    userId?: number;
    path?: string;
    method?: string;
    statusCode?: number;
    userAgent?: string;
    ip?: string;
    body?: any;
    query?: any;
    params?: any;
    [key: string]: any;
  };

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ default: false })
  resolved: boolean;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  resolvedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ErrorLogSchema = SchemaFactory.createForClass(ErrorLog);

ErrorLogSchema.index({ createdAt: -1 });
ErrorLogSchema.index({ level: 1, createdAt: -1 });
ErrorLogSchema.index({ resolved: 1, createdAt: -1 });
ErrorLogSchema.index({ 'context.userId': 1 });
ErrorLogSchema.index({ 'context.path': 1 });

ErrorLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);
