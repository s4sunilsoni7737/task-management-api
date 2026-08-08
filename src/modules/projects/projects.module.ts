import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectEntity, ProjectSchema } from './entities/project.entity';
import { ProjectsService } from './services/projects.service';
import { ProjectsController } from './controllers/projects.controller';
import { WorkspacesModule } from 'src/modules/workspaces/workspaces.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ProjectEntity.name, schema: ProjectSchema }]),
    WorkspacesModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
