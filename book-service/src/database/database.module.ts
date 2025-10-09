import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
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
        const uri = configService.get<string>('database.mongoUri');
        const options = configService.get('database.mongoOptions');

        return {
          uri: uri || process.env.MONGODB_URI,
          ...options,
          dbName: 'book_logs',
          connectionFactory: (connection) => {
            connection.on('connected', () => {
              console.log('✅ MongoDB connected successfully (Error Logs)');
            });

            connection.on('disconnected', () => {
              console.log('❌ MongoDB disconnected');
            });

            connection.on('error', (error) => {
              console.error('❌ MongoDB connection error:', error);
            });

            return connection;
          },
        };
      },
    }),
    MongooseModule.forFeature([
      { name: ErrorLog.name, schema: ErrorLogSchema },
    ]),
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
