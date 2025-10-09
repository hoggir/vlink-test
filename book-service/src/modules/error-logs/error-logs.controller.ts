import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Delete,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ErrorLogsService } from './error-logs.service';
import {
  CreateErrorLogDto,
  QueryErrorLogDto,
} from './dto/create-error-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Error Logs (Admin)')
@Controller('admin/error-logs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ErrorLogsController {
  constructor(private readonly errorLogsService: ErrorLogsService) {}

  @Post()
  @ApiOperation({ summary: 'Create error log manually (Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Error log created successfully',
  })
  create(@Body() createErrorLogDto: CreateErrorLogDto) {
    return this.errorLogsService.logError(createErrorLogDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all error logs with filters (Admin only)' })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'resolved', required: false, type: Boolean })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'path', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Error logs retrieved successfully',
  })
  findAll(@Query() query: QueryErrorLogDto) {
    return this.errorLogsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get error statistics (Admin only)' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.errorLogsService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get error log by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Error Log ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Error log retrieved successfully',
  })
  findOne(@Param('id') id: string) {
    return this.errorLogsService.findOne(id);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Mark error log as resolved (Admin only)' })
  @ApiParam({ name: 'id', description: 'Error Log ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Error log marked as resolved',
  })
  markAsResolved(
    @Param('id') id: string,
    @Body('resolvedBy') resolvedBy?: string,
  ) {
    return this.errorLogsService.markAsResolved(id, resolvedBy);
  }

  @Delete('cleanup/:days')
  @ApiOperation({
    summary: 'Delete error logs older than specified days (Admin only)',
  })
  @ApiParam({
    name: 'days',
    description: 'Delete logs older than this many days',
    example: 90,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Old error logs deleted successfully',
  })
  deleteOldLogs(@Param('days') days: string) {
    return this.errorLogsService.deleteOldLogs(parseInt(days));
  }
}
