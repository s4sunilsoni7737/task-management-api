import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import configuration from './config/configuration';
import { JWT_SECRET_KEY, JWT_TOKEN_EXPIRE_TIME, MONGO_DB_URI } from './constants';

// ── Entities ───────────────────────────────────────────────────────────
import { UserEntity, UserSchema } from './entities/user.entity';
import { WorkspaceEntity, WorkspaceSchema } from './entities/workspace.entity';
import { ProjectEntity, ProjectSchema } from './entities/project.entity';
import { TaskEntity, TaskSchema } from './entities/task.entity';
import { LabelEntity, LabelSchema } from './entities/label.entity';
import { CommentEntity, CommentSchema } from './entities/comment.entity';
import { ActivityLogEntity, ActivityLogSchema } from './entities/activity-log.entity';

// ── Controllers ────────────────────────────────────────────────────────
import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';
import { WorkspacesController } from './controllers/workspaces.controller';
import { ProjectsController } from './controllers/projects.controller';
import { TasksController } from './controllers/tasks.controller';
import { LabelsController } from './controllers/labels.controller';
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

// ── Strategies ─────────────────────────────────────────────────────────
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { GoogleStrategy } from './common/strategies/google.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env'],
    }),

    JwtModule.register({
      secret: JWT_SECRET_KEY,
      signOptions: {
        expiresIn: JWT_TOKEN_EXPIRE_TIME,
      },
    }),

    MongooseModule.forRoot(MONGO_DB_URI),

    MongooseModule.forFeature([
      { name: UserEntity.name, schema: UserSchema },
      { name: WorkspaceEntity.name, schema: WorkspaceSchema },
      { name: ProjectEntity.name, schema: ProjectSchema },
      { name: TaskEntity.name, schema: TaskSchema },
      { name: LabelEntity.name, schema: LabelSchema },
      { name: CommentEntity.name, schema: CommentSchema },
      { name: ActivityLogEntity.name, schema: ActivityLogSchema },
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
    HealthController,
  ],
  providers: [
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
  ],
})
export class AppModule {}
