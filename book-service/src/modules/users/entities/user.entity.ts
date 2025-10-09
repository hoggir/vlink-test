import { User as PrismaUser, UserRole } from '@prisma/client';

export class User implements PrismaUser {
  id: number;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationExpires: Date | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  refreshToken: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  isDeleted: boolean;
}

export { UserRole };
