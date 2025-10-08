import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  uri: process.env.MONGODB_URI,
  options: {
    retryWrites: true,
    w: 'majority',
    maxPoolSize:
      parseInt(process.env.MONGODB_MAX_POOL_SIZE as string, 10) || 10,
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE as string, 10) || 2,
    socketTimeoutMS:
      parseInt(process.env.MONGODB_SOCKET_TIMEOUT as string, 10) || 45000,
    serverSelectionTimeoutMS:
      parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT as string, 10) ||
      5000,
    family: 4,
  },
}));
