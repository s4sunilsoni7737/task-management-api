import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LabelEntity, LabelSchema } from './entities/label.entity';
import { LabelsService } from './services/labels.service';
import { LabelsController } from './controllers/labels.controller';
import { WorkspacesModule } from 'src/modules/workspaces/workspaces.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LabelEntity.name, schema: LabelSchema }]),
    WorkspacesModule,
  ],
  controllers: [LabelsController],
  providers: [LabelsService],
  exports: [LabelsService],
})
export class LabelsModule {}
