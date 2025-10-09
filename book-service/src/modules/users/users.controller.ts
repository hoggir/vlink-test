import {
  Controller,
  Get,
  UseGuards,
  HttpStatus,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { SessionService } from '../auth/services/session.service';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly sessionService: SessionService) {}
  @Public()
  @Get('public')
  @ApiOperation({
    summary: 'Public endpoint',
    description: 'This endpoint is accessible without authentication',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success response',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'This is a public route' },
          },
        },
        timestamp: { type: 'string', example: '2025-10-03T10:00:00.000Z' },
      },
    },
  })
  publicRoute() {
    return { message: 'This is a public route' };
  }

  @Roles('ADMIN', 'CUSTOMER')
  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Get user profile (Single Device Login)',
    description:
      'Retrieve the profile of the authenticated user. ' +
      'Note: This endpoint enforces single device login. ' +
      'If you login from another device, this token will be invalidated.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Profile retrieved' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'number', example: 123 },
            email: { type: 'string', example: 'john.doe@example.com' },
            role: { type: 'string', example: 'CUSTOMER' },
          },
        },
        timestamp: { type: 'string', example: '2025-10-03T10:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Invalid or expired token, OR logged in from another device. ' +
      'Single device login is enforced - only one active session per user.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: {
          type: 'string',
          example: 'Session expired or logged in from another device',
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async getProfile(@CurrentUser() user: any, @Req() req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    const session = await this.sessionService.getSession(user.userId);
    if (!session || session.accessToken !== token) {
      throw new UnauthorizedException(
        'Session expired or logged in from another device',
      );
    }

    return {
      message: 'Profile retrieved',
      data: {
        ...user,
        sessionInfo: {
          deviceInfo: session.deviceInfo,
          loginAt: session.loginAt,
          lastActivity: session.lastActivity,
        },
      },
    };
  }

  @Roles('ADMIN', 'CUSTOMER')
  @Get('session-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Check session status (Single Device Login)',
    description:
      'Check if the current session is active and get session details. ' +
      'This endpoint validates that the user is logged in from this device only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session status retrieved successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Session is active' },
        data: {
          type: 'object',
          properties: {
            isActive: { type: 'boolean', example: true },
            userId: { type: 'number', example: 123 },
            email: { type: 'string', example: 'john.doe@example.com' },
            role: { type: 'string', example: 'CUSTOMER' },
            deviceInfo: { type: 'string', example: 'Chrome on Windows' },
            loginAt: { type: 'string', example: '2025-10-03T10:00:00.000Z' },
            lastActivity: {
              type: 'string',
              example: '2025-10-03T11:00:00.000Z',
            },
          },
        },
        timestamp: { type: 'string', example: '2025-10-03T11:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Session expired or logged in from another device',
    type: ErrorResponseDto,
  })
  async checkSessionStatus(@CurrentUser() user: any, @Req() req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    const session = await this.sessionService.getSession(user.userId);
    if (!session || session.accessToken !== token) {
      throw new UnauthorizedException(
        'Session expired or logged in from another device',
      );
    }

    const isActive = await this.sessionService.hasActiveSession(user.userId);

    return {
      message: 'Session is active',
      data: {
        isActive,
        userId: session.userId,
        email: session.email,
        role: session.role,
        deviceInfo: session.deviceInfo,
        loginAt: session.loginAt,
        lastActivity: session.lastActivity,
      },
    };
  }

  @Roles('ADMIN')
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Admin only endpoint',
    description: 'This endpoint is only accessible by users with admin role',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success response for admin',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Admin access' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'admin@example.com' },
            role: { type: 'string', example: 'admin' },
          },
        },
        timestamp: { type: 'string', example: '2025-10-03T10:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    type: ErrorResponseDto,
  })
  adminOnly(@CurrentUser() user: any) {
    return {
      message: 'Admin access',
      data: user,
    };
  }
}
