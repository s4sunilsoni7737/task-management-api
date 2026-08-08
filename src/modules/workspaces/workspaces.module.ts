import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspaceEntity, WorkspaceSchema } from './entities/workspace.entity';
import { WorkspacesService } from './services/workspaces.service';
import { WorkspacesController } from './controllers/workspaces.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: WorkspaceEntity.name, schema: WorkspaceSchema }])],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
