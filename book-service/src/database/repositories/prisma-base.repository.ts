import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: any;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export abstract class PrismaBaseRepository<T, ID = number> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: string,
  ) {}

  protected get model(): any {
    return (this.prisma as any)[this.modelName];
  }

  async create(data: any): Promise<T> {
    return this.model.create({
      data,
    });
  }

  async findAll(where: any = {}, options: any = {}): Promise<T[]> {
    return this.model.findMany({
      where: {
        ...where,
        isDeleted: false,
      },
      ...options,
    });
  }

  async findOne(where: any, options: any = {}): Promise<T | null> {
    return this.model.findFirst({
      where: {
        ...where,
        isDeleted: false,
      },
      ...options,
    });
  }

  async findById(id: ID, options: any = {}): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
      ...options,
    });
  }

  async findByIdOrFail(id: ID, options: any = {}): Promise<T> {
    const record = await this.findById(id, options);
    if (!record || (record as any).isDeleted) {
      throw new NotFoundException(`${this.modelName} with ID ${id} not found`);
    }
    return record;
  }

  async update(id: ID, data: any): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    });
  }

  async delete(id: ID): Promise<T> {
    return this.model.delete({
      where: { id },
    });
  }

  async softDelete(id: ID): Promise<T> {
    return this.model.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async restore(id: ID): Promise<T> {
    return this.model.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });
  }

  async count(where: any = {}): Promise<number> {
    return this.model.count({
      where: {
        ...where,
        isDeleted: false,
      },
    });
  }

  async exists(where: any): Promise<boolean> {
    const count = await this.model.count({
      where: {
        ...where,
        isDeleted: false,
      },
      take: 1,
    });
    return count > 0;
  }

  async paginate(
    where: any = {},
    params: PaginationParams = {},
  ): Promise<PaginationResult<T>> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.findMany({
        where: {
          ...where,
          isDeleted: false,
        },
        skip,
        take: limit,
        orderBy: params.orderBy || { createdAt: 'desc' },
      }),
      this.count(where),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }
}
