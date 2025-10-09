import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const getMongoConfig = (
  configService: ConfigService,
): MongooseModuleOptions => {
  const uri =
    configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017';
  const dbName =
    configService.get<string>('MONGODB_DATABASE') || 'book-service';

  let finalUri: string;

  if (uri.includes('?')) {
    const [baseUri, queryString] = uri.split('?');
    finalUri = `${baseUri}/${dbName}?${queryString}`;
  } else {
    finalUri = `${uri}/${dbName}`;
  }

  return {
    uri: finalUri,
    dbName: dbName,
    retryWrites: true,
    w: 'majority',
    maxPoolSize: configService.get<number>('MONGODB_MAX_POOL_SIZE') || 10,
    minPoolSize: configService.get<number>('MONGODB_MIN_POOL_SIZE') || 2,
    socketTimeoutMS:
      configService.get<number>('MONGODB_SOCKET_TIMEOUT') || 45000,
    serverSelectionTimeoutMS:
      configService.get<number>('MONGODB_SERVER_SELECTION_TIMEOUT') || 5000,
  };
};
