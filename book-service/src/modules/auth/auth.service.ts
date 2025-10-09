import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';
import { SessionService } from './services/session.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { encrypt } from 'src/common/utils/crypto.util';
import { getDeviceInfoString } from 'src/common/utils/device.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
  ) {}

  async register(registerDto: RegisterDto, req: Request) {
    try {
      const existingUser = await this.usersRepository.findByEmail(
        registerDto.email,
      );
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const hashedPassword = await this.hashPassword(registerDto.password);

      const user = await this.usersRepository.create({
        ...registerDto,
        email: registerDto.email.toLowerCase(),
        role: registerDto?.role
          ? (registerDto.role.toUpperCase() as UserRole)
          : UserRole.CUSTOMER,
        password: hashedPassword,
      });

      const tokens = await this.generateTokens(user);
      const deviceInfo = getDeviceInfoString(req);

      // Store session in Redis
      await this.sessionService.createSession(
        user.id,
        user.email,
        user.role,
        tokens.accessToken,
        tokens.refreshToken,
        deviceInfo,
      );

      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return {
        message: 'Registration successful',
        data: {
          user: {
            id: encrypt(user.id.toString()),
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          },
          ...tokens,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  async login(loginDto: LoginDto, req: Request) {
    const user = await this.usersRepository.findByEmailWithPassword(
      loginDto.email,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await this.comparePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    const deviceInfo = getDeviceInfoString(req);

    // Store session in Redis (will automatically invalidate old session)
    await this.sessionService.createSession(
      user.id,
      user.email,
      user.role,
      tokens.accessToken,
      tokens.refreshToken,
      deviceInfo,
    );

    await Promise.all([
      this.updateRefreshToken(user.id, tokens.refreshToken),
      this.usersRepository.updateLastLogin(user.id),
    ]);

    return {
      message: 'Login successful',
      data: {
        user: {
          id: encrypt(user.id.toString()),
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLoginAt: new Date(),
        },
        ...tokens,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('auth.jwt.secret'),
      });

      const user = await this.usersRepository.findById(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const storedUser =
        await this.usersRepository.findByRefreshToken(refreshToken);
      if (!storedUser) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);

      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return {
        message: 'Token refreshed successfully',
        data: tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: number) {
    // Invalidate session in Redis
    await this.sessionService.invalidateSession(userId);

    // Clear refresh token in database
    await this.updateRefreshToken(userId, null);

    return {
      message: 'Logout successful',
      data: null,
    };
  }

  async validateUser(userId: number): Promise<User> {
    const user = await this.usersRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('auth.jwt.secret'),
        expiresIn: this.configService.get<string>(
          'auth.jwt.accessTokenExpiresIn',
        ),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('auth.jwt.secret'),
        expiresIn: this.configService.get<string>(
          'auth.jwt.refreshTokenExpiresIn',
        ),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('auth.bcrypt.saltRounds');
    const hashedPassword = await bcrypt.hash(password, saltRounds as number);
    return hashedPassword;
  }

  private async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  private async updateRefreshToken(
    userId: number,
    refreshToken: string | null,
  ): Promise<void> {
    const hashedRefreshToken = refreshToken
      ? await bcrypt.hash(refreshToken, 10)
      : null;

    await this.usersRepository.updateRefreshToken(userId, hashedRefreshToken);
  }
}
