import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { JWT_SECRET_KEY, JWT_TOKEN_EXPIRE_TIME, MONGO_DB_URI } from './constants';

// ── Common ─────────────────────────────────────────────────────────────
import { LoggerCollectionName, LoggerEntity, LoggerSchema } from './common/entities/logger.entity';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

// ── Entities ───────────────────────────────────────────────────────────
import { UserCollectionName, UserEntity, UserSchema } from './entities/user.entity';
import { WorkspaceCollectionName, WorkspaceEntity, WorkspaceSchema } from './entities/workspace.entity';
import { ProjectCollectionName, ProjectEntity, ProjectSchema } from './entities/project.entity';
import { TaskCollectionName, TaskEntity, TaskSchema } from './entities/task.entity';
import { LabelCollectionName, LabelEntity, LabelSchema } from './entities/label.entity';
import { CommentCollectionName, CommentEntity, CommentSchema } from './entities/comment.entity';
import { ActivityLogCollectionName, ActivityLogEntity, ActivityLogSchema } from './entities/activity-log.entity';

// ── Controllers ────────────────────────────────────────────────────────
import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';
import { WorkspacesController } from './controllers/workspaces.controller';
import { ProjectsController } from './controllers/projects.controller';
import { TasksController } from './controllers/tasks.controller';
import { LabelsController } from './controllers/labels.controller';
import { MembersController } from './controllers/members.controller';
import { HealthController } from './controllers/health.controller';

// ── Services ───────────────────────────────────────────────────────────
import { AuthService } from './services/auth.service';
import { UsersService } from './services/users.service';
import { WorkspacesService } from './services/workspaces.service';
import { ProjectsService } from './services/projects.service';
import { TasksService } from './services/tasks.service';
import { LabelsService } from './services/labels.service';
import { CommentsService } from './services/comments.service';
import { ActivityService } from './services/activity.service';
import { MembersService } from './services/members.service';

// ── Strategies ─────────────────────────────────────────────────────────
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { GoogleStrategy } from './common/strategies/google.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    JwtModule.register({
      secret: JWT_SECRET_KEY,
      signOptions: {
        expiresIn: JWT_TOKEN_EXPIRE_TIME,
      },
    }),

    MongooseModule.forRoot(MONGO_DB_URI),

    MongooseModule.forFeature([
      {
        name: LoggerCollectionName,
        schema: LoggerSchema,
        collection: LoggerCollectionName,
      },
      {
        name: UserCollectionName,
        schema: UserSchema,
        collection: UserCollectionName,
      },
      {
        name: WorkspaceCollectionName,
        schema: WorkspaceSchema,
        collection: WorkspaceCollectionName,
      },
      {
        name: ProjectCollectionName,
        schema: ProjectSchema,
        collection: ProjectCollectionName,
      },
      {
        name: TaskCollectionName,
        schema: TaskSchema,
        collection: TaskCollectionName,
      },
      {
        name: LabelCollectionName,
        schema: LabelSchema,
        collection: LabelCollectionName,
      },
      {
        name: CommentCollectionName,
        schema: CommentSchema,
        collection: CommentCollectionName,
      },
      {
        name: ActivityLogCollectionName,
        schema: ActivityLogSchema,
        collection: ActivityLogCollectionName,
      },
    ]),

    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [
    AuthController,
    UsersController,
    WorkspacesController,
    ProjectsController,
    TasksController,
    LabelsController,
    MembersController,
    HealthController,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    JwtStrategy,
    GoogleStrategy,
    AuthService,
    UsersService,
    WorkspacesService,
    ProjectsService,
    TasksService,
    LabelsService,
    CommentsService,
    ActivityService,
    MembersService,
  ],
})
export class AppModule {}