import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/common/redis/redis.service';

export interface SessionData {
  userId: number;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
  deviceInfo: string;
  loginAt: string;
  lastActivity: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly SESSION_PREFIX = 'session:user:';
  private readonly TOKEN_PREFIX = 'token:access:';

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  private getSessionKey(userId: number): string {
    return `${this.SESSION_PREFIX}${userId}`;
  }

  private getTokenKey(accessToken: string): string {
    return `${this.TOKEN_PREFIX}${accessToken}`;
  }

  private parseTTL(expiryString: string): number {
    const match = expiryString.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * multipliers[unit];
  }

  async createSession(
    userId: number,
    email: string,
    role: string,
    accessToken: string,
    refreshToken: string,
    deviceInfo: string,
  ): Promise<void> {
    const sessionKey = this.getSessionKey(userId);
    const tokenKey = this.getTokenKey(accessToken);

    const existingSession = await this.getSession(userId);
    if (existingSession) {
      this.logger.warn(
        `User ${userId} already has an active session. Invalidating old session.`,
      );
      await this.invalidateSession(userId);
    }

    const sessionData: SessionData = {
      userId,
      email,
      role,
      accessToken,
      refreshToken,
      deviceInfo,
      loginAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };

    const accessTokenTTL = this.parseTTL(
      this.configService.get<string>('auth.jwt.accessTokenExpiresIn') || '1h',
    );

    await this.redisService.setObject(sessionKey, sessionData, accessTokenTTL);

    await this.redisService.set(tokenKey, userId.toString(), accessTokenTTL);

    this.logger.log(
      `Session created for user ${userId} from device: ${deviceInfo}`,
    );
  }

  async getSession(userId: number): Promise<SessionData | null> {
    const sessionKey = this.getSessionKey(userId);
    return this.redisService.getObject<SessionData>(sessionKey);
  }

  async validateToken(accessToken: string): Promise<number | null> {
    const tokenKey = this.getTokenKey(accessToken);
    const userId = await this.redisService.get(tokenKey);

    if (!userId) {
      return null;
    }

    const session = await this.getSession(parseInt(userId, 10));
    if (session) {
      session.lastActivity = new Date().toISOString();
      const sessionKey = this.getSessionKey(parseInt(userId, 10));

      const ttl = await this.redisService.ttl(sessionKey);
      if (ttl > 0) {
        await this.redisService.setObject(sessionKey, session, ttl);
      }
    }

    return parseInt(userId, 10);
  }

  async invalidateSession(userId: number): Promise<void> {
    const session = await this.getSession(userId);

    if (session) {
      const tokenKey = this.getTokenKey(session.accessToken);
      await this.redisService.del(tokenKey);
    }

    const sessionKey = this.getSessionKey(userId);
    await this.redisService.del(sessionKey);

    this.logger.log(`Session invalidated for user ${userId}`);
  }

  async hasActiveSession(userId: number): Promise<boolean> {
    const sessionKey = this.getSessionKey(userId);
    return this.redisService.exists(sessionKey);
  }

  async getAllActiveSessions(): Promise<SessionData[]> {
    const pattern = `${this.SESSION_PREFIX}*`;
    const keys = await this.redisService.keys(pattern);

    const sessions: SessionData[] = [];
    for (const key of keys) {
      const session = await this.redisService.getObject<SessionData>(key);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  async invalidateAllSessions(): Promise<void> {
    const pattern = `${this.SESSION_PREFIX}*`;
    await this.redisService.deleteByPattern(pattern);

    const tokenPattern = `${this.TOKEN_PREFIX}*`;
    await this.redisService.deleteByPattern(tokenPattern);

    this.logger.warn('All sessions have been invalidated');
  }
}
