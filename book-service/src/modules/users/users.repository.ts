import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PrismaBaseRepository } from '../../database/repositories/prisma-base.repository';
import { User } from './entities/user.entity';

@Injectable()
export class UsersRepository extends PrismaBaseRepository<User> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user');
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        isDeleted: false,
      },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        isDeleted: false,
      },
    });
  }

  async updateRefreshToken(
    userId: number,
    refreshToken: string | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  async updateLastLogin(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        refreshToken,
        isDeleted: false,
      },
    });
  }
}
