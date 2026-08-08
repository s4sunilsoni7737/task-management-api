import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskEntity, TaskSchema } from './entities/task.entity';
import { TasksService } from './services/tasks.service';
import { TasksController } from './controllers/tasks.controller';
import { WorkspacesModule } from 'src/modules/workspaces/workspaces.module';
import { ActivityModule } from 'src/modules/activity/activity.module';
import { CommentsModule } from 'src/modules/comments/comments.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TaskEntity.name, schema: TaskSchema }]),
    WorkspacesModule,
    ActivityModule,
    CommentsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
