import { Module } from '@nestjs/common';
import { CheckoutsService } from './checkouts.service';
import { CheckoutsController } from './checkouts.controller';
import { CheckoutsRepository } from './checkouts.repository';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CheckoutsController],
  providers: [CheckoutsService, CheckoutsRepository],
  exports: [CheckoutsService, CheckoutsRepository],
})
export class CheckoutsModule {}
