import { Controller, Post, Body, UseGuards, Request, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ExportService } from './export.service';
import { ExportDto, ExportFormat } from './dto/export.dto';

@ApiTags('export')
@Controller('export')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * 导出为 PDF
   */
  @Post('pdf')
  @ApiOperation({ summary: '导出学习报告为 PDF' })
  @ApiConsumes('application/json')
  @ApiProduces('application/pdf')
  async exportPdf(
    @Request() req,
    @Body() options: ExportDto,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.exportService.exportToPdf(req.user.sub, {
        ...options,
        format: ExportFormat.PDF,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="mistakery-report-${new Date().toISOString().split('T')[0]}.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'PDF 生成失败',
        error: error.message,
      });
    }
  }

  /**
   * 导出为 Excel
   */
  @Post('excel')
  @ApiOperation({ summary: '导出学习报告为 Excel' })
  @ApiConsumes('application/json')
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
  async exportExcel(
    @Request() req,
    @Body() options: ExportDto,
    @Res() res: Response,
  ) {
    try {
      const excelBuffer = await this.exportService.exportToExcel(req.user.sub, {
        ...options,
        format: ExportFormat.EXCEL,
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="mistakery-report-${new Date().toISOString().split('T')[0]}.xlsx"`
      );
      res.setHeader('Content-Length', excelBuffer.length);

      res.send(excelBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Excel 生成失败',
        error: error.message,
      });
    }
  }

  /**
   * 获取导出模板（用于前端预览）
   */
  @Post('preview')
  @ApiOperation({ summary: '预览导出数据' })
  async previewExport(
    @Request() req,
    @Body() options: ExportDto,
  ) {
    try {
      // 返回预览数据（不实际生成文件）
      const previewData = {
        sections: options.includeSections || [],
        timeRange: options.timeRange || 'month',
        estimatedSize: '2MB',
        estimatedTime: '3秒',
      };

      return {
        success: true,
        data: previewData,
      };
    } catch (error) {
      return {
        success: false,
        message: '预览失败',
        error: error.message,
      };
    }
  }
}
