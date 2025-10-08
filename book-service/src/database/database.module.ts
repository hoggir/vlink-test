import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import {
  ErrorLog,
  ErrorLogSchema,
} from 'src/common/database/schemas/error-log.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('database.uri');
        const options = configService.get('database.options');

        return {
          uri,
          ...options,
          dbName: 'book',
          connectionFactory: (connection) => {
            connection.on('connected', () => {
              console.log('✅ MongoDB connected successfully');
            });

            connection.on('disconnected', () => {
              console.log('❌ MongoDB disconnected');
            });

            connection.on('error', (error) => {
              console.error('❌ MongoDB connection error:', error);
            });

            if (process.env.NODE_ENV !== 'production') {
            }

            return connection;
          },
        };
      },
    }),
    MongooseModule.forFeature([
      { name: ErrorLog.name, schema: ErrorLogSchema },
    ]),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
