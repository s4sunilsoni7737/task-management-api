import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentEntity, CommentSchema } from './entities/comment.entity';
import { CommentsService } from './services/comments.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: CommentEntity.name, schema: CommentSchema }])],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
