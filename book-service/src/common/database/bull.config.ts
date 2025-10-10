import { BullModuleOptions } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';

export const getBullConfig = (
  configService: ConfigService,
): BullModuleOptions => {
  const redisUrl = configService.get<string>('REDIS_URL');

  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      const password = url.password || undefined;
      const host = url.hostname || 'localhost';
      const port = url.port ? parseInt(url.port, 10) : 6379;
      const db = url.pathname ? parseInt(url.pathname.slice(1), 10) : 0;

      return {
        redis: {
          host,
          port,
          password,
          db,
        },
      };
    } catch (error) {
      console.error('Failed to parse REDIS_URL, using fallback config:', error);
    }
  }

  return {
    redis: {
      host: configService.get<string>('REDIS_HOST') || 'localhost',
      port: configService.get<number>('REDIS_PORT') || 6379,
      password: configService.get<string>('REDIS_PASSWORD'),
      db: configService.get<number>('REDIS_DB') || 0,
    },
  };
};
