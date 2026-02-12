import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  path: string;
}

@Injectable()
export class UploadService {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('upload.dest', './uploads');
    this.baseUrl = this.configService.get<string>('upload.baseUrl', 'http://localhost:3000');
    this.ensureUploadDir();
  }

  /**
   * 确保上传目录存在
   */
  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      // 目录已存在，忽略错误
    }
  }

  /**
   * 保存上传的文件
   */
  async saveFile(file: Express.Multer.File, subdirectory?: string): Promise<UploadedFile> {
    // 生成唯一文件名
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;

    // 如果有子目录，则创建
    let targetDir = this.uploadDir;
    if (subdirectory) {
      targetDir = path.join(this.uploadDir, subdirectory);
      await fs.mkdir(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, uniqueName);

    // 写入文件
    await fs.writeFile(filePath, file.buffer);

    // 构建返回信息
    const relativePath = subdirectory
      ? path.join(subdirectory, uniqueName)
      : uniqueName;

    return {
      filename: uniqueName,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `${this.baseUrl}/uploads/${relativePath}`,
      path: filePath,
    };
  }

  /**
   * 保存图片（专用方法，可添加额外处理）
   */
  async saveImage(
    file: Express.Multer.File,
    category: 'drawings' | 'notes' | 'avatars' = 'drawings',
  ): Promise<UploadedFile> {
    // 验证图片类型
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('不支持的文件类型，仅支持 JPG、PNG、GIF 和 WebP 格式');
    }

    // 验证文件大小（图片最大 10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('图片大小不能超过 10MB');
    }

    return this.saveFile(file, category);
  }

  /**
   * 删除文件
   */
  async deleteFile(filename: string, subdirectory?: string): Promise<void> {
    try {
      let filePath = subdirectory
        ? path.join(this.uploadDir, subdirectory, filename)
        : path.join(this.uploadDir, filename);

      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file ${filename}:`, error);
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(filename: string, subdirectory?: string): Promise<UploadedFile | null> {
    try {
      let filePath = subdirectory
        ? path.join(this.uploadDir, subdirectory, filename)
        : path.join(this.uploadDir, filename);

      const stats = await fs.stat(filePath);
      const relativePath = subdirectory
        ? path.join(subdirectory, filename)
        : filename;

      return {
        filename,
        originalName: filename,
        mimetype: '',
        size: stats.size,
        url: `${this.baseUrl}/uploads/${relativePath}`,
        path: filePath,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 清空指定目录（用于测试或清理）
   */
  async clearDirectory(subdirectory?: string): Promise<void> {
    try {
      let targetDir = subdirectory
        ? path.join(this.uploadDir, subdirectory)
        : this.uploadDir;

      const files = await fs.readdir(targetDir);
      await Promise.all(
        files.map(file => fs.unlink(path.join(targetDir, file)))
      );
    } catch (error) {
      console.error(`Failed to clear directory:`, error);
    }
  }
}
