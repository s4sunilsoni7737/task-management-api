import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityLogEntity, ActivityLogSchema } from './entities/activity-log.entity';
import { ActivityService } from './services/activity.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: ActivityLogEntity.name, schema: ActivityLogSchema }])],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
