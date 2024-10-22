import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { FileUploadService } from 'src/services/fileUpload.service';

@Module({
  controllers: [PostController],
  providers: [PostService, FileUploadService],
})
export class PostModule {}
