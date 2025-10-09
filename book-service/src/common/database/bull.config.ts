import { BullModuleOptions } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';

export const getBullConfig = (
  configService: ConfigService,
): BullModuleOptions => ({
  redis: {
    host: configService.get<string>('redis.host') || 'localhost',
    port: configService.get<number>('redis.port') || 6379,
    password: configService.get<string>('redis.password'),
    db: configService.get<number>('redis.db') || 0,
  },
});
