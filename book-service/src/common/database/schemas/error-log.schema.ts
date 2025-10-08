import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'error_logs' })
export class ErrorLog extends Document {
  @Prop()
  path: string;

  @Prop()
  method: string;

  @Prop()
  statusCode: number;

  @Prop()
  error: string;

  @Prop()
  message: string;

  @Prop()
  stack: string;

  @Prop({ type: Object })
  meta?: Record<string, any>;
}

export const ErrorLogSchema = SchemaFactory.createForClass(ErrorLog);
