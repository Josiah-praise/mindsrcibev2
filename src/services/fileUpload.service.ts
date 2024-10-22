import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  S3ServiceException,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';
import * as path from 'path';
import { format } from 'date-fns';

@Injectable()
export class FileUploadService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly logger = new Logger(FileUploadService.name);

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.getOrThrow('AWS_S3_REGION');
    this.bucketName = this.configService.getOrThrow('AWS_S3_BUCKET_NAME');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadFile(file: Express.Multer.File, uuid: string): Promise<string> {
    try {
      // Generate a unique filename
      const key = this.generateFileName(uuid, file.originalname);
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // Optional: Add metadata if needed
        Metadata: {
          originalName: file.originalname,
        },
      };

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      // Generate and return the URL of the uploaded file
      return this.generateFileUrl(key);
    } catch (error) {
      this.handleUploadError(error, file.originalname);
    }
  }

  generateFileUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async generatePresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  private handleUploadError(error: unknown, filename: string): never {
    this.logger.error(`Failed to upload file ${filename}`, error);

    if (error instanceof S3ServiceException) {
      throw new InternalServerErrorException({
        message: 'Failed to upload file to S3',
        error: error.message,
      });
    }

    throw new InternalServerErrorException(
      'An unexpected error occurred during file upload',
    );
  }

  // Optional: Helper method to check if a file exists
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      return true;
    } catch (error) {
      if (
        error instanceof S3ServiceException &&
        error.$metadata.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  generateFileName(userId: string, originalFileName: string): string {
    const date = format(new Date(), 'yyyy-MM-dd'); // Get the current date in yyyy-MM-dd format
    const sanitizedFileName = path
      .parse(originalFileName)
      .name.replace(/\s+/g, '_'); // Sanitize filename by replacing spaces with underscores
    const fileExtension = path.extname(originalFileName); // Extract the file extension

    return `${userId}/${userId}_${date}_${sanitizedFileName}${fileExtension}`; // Concatenate userId, date, and filename with extension
  }
}
