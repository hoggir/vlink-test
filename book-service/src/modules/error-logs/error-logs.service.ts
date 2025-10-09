import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ErrorLog,
  ErrorLogDocument,
} from '../../common/database/schemas/error-log.schema';
import {
  CreateErrorLogDto,
  QueryErrorLogDto,
} from './dto/create-error-log.dto';

@Injectable()
export class ErrorLogsService {
  private readonly logger = new Logger(ErrorLogsService.name);

  constructor(
    @InjectModel(ErrorLog.name)
    private readonly errorLogModel: Model<ErrorLogDocument>,
  ) {}

  async logError(createErrorLogDto: CreateErrorLogDto): Promise<ErrorLog> {
    try {
      const errorLog = new this.errorLogModel(createErrorLogDto);
      const saved = await errorLog.save();
      return saved.toObject();
    } catch (error) {
      this.logger.error(
        `Failed to save error log to MongoDB: ${error.message}`,
        error.stack,
      );
      this.logger.error(`Original error: ${JSON.stringify(createErrorLogDto)}`);
      throw error;
    }
  }

  async logException(
    error: Error,
    context?: CreateErrorLogDto['context'],
    metadata?: Record<string, any>,
  ): Promise<ErrorLog> {
    return this.logError({
      level: 'error' as any,
      message: error.message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      metadata,
    });
  }

  async findAll(query: QueryErrorLogDto) {
    const { level, resolved, userId, path, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (level) filter.level = level;
    if (typeof resolved === 'boolean') filter.resolved = resolved;
    if (userId) filter['context.userId'] = parseInt(userId);
    if (path) filter['context.path'] = { $regex: path, $options: 'i' };

    const [logs, total] = await Promise.all([
      this.errorLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.errorLogModel.countDocuments(filter),
    ]);

    return {
      message: 'Error logs retrieved successfully',
      data: {
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findOne(id: string) {
    const log = await this.errorLogModel.findById(id).lean().exec();

    if (!log) {
      return {
        message: 'Error log not found',
        data: null,
      };
    }

    return {
      message: 'Error log retrieved successfully',
      data: log,
    };
  }

  async markAsResolved(id: string, resolvedBy?: string) {
    const log = await this.errorLogModel.findByIdAndUpdate(
      id,
      {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy,
      },
      { new: true },
    );

    if (!log) {
      return {
        message: 'Error log not found',
        data: null,
      };
    }

    return {
      message: 'Error log marked as resolved',
      data: log,
    };
  }

  async deleteOldLogs(daysOld: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.errorLogModel.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    return {
      message: `Deleted ${result.deletedCount} old error logs`,
      data: {
        deletedCount: result.deletedCount,
        cutoffDate,
      },
    };
  }

  async getStats(startDate?: Date, endDate?: Date) {
    const matchStage: any = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = startDate;
      if (endDate) matchStage.createdAt.$lte = endDate;
    }

    const stats = await this.errorLogModel.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalUnresolved = await this.errorLogModel.countDocuments({
      resolved: false,
      ...matchStage,
    });

    return {
      message: 'Error statistics retrieved successfully',
      data: {
        byLevel: stats.reduce(
          (acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          },
          {} as Record<string, number>,
        ),
        totalUnresolved,
      },
    };
  }
}
