import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  UseGuards,
  Get,
  Param,
  Delete,
  Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService, UploadedFile as UploadedFileType } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * 上传图片
   */
  @Post('image')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '上传图片' })
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category?: 'drawings' | 'notes' | 'avatars',
  ): Promise<UploadedFileType> {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    return this.uploadService.saveImage(file, category);
  }

  /**
   * 上传多个图片
   */
  @Post('images')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '批量上传图片' })
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<UploadedFileType[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的文件');
    }

    const uploadPromises = files.map(file =>
      this.uploadService.saveImage(file, 'drawings')
    );

    return Promise.all(uploadPromises);
  }

  /**
   * 获取图片信息
   */
  @Get('image/:filename')
  @ApiOperation({ summary: '获取图片信息' })
  @ApiBearerAuth()
  async getImageInfo(
    @Param('filename') filename: string,
    @Param('category') category?: string,
  ): Promise<UploadedFileType | null> {
    return this.uploadService.getFileInfo(filename, category);
  }

  /**
   * 删除图片
   */
  @Delete('image/:filename')
  @ApiOperation({ summary: '删除图片' })
  @ApiBearerAuth()
  async deleteImage(
    @Param('filename') filename: string,
    @Param('category') category?: string,
  ): Promise<{ message: string }> {
    await this.uploadService.deleteFile(filename, category);
    return { message: '图片删除成功' };
  }

  /**
   * 上传文件（通用）
   */
  @Post('file')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '上传文件' })
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('subdirectory') subdirectory?: string,
  ): Promise<UploadedFileType> {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    return this.uploadService.saveFile(file, subdirectory);
  }
}
