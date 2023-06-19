import { Controller, Get, Param, StreamableFile } from '@nestjs/common';
import { AppService, DateQuery } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('report/:month/:year')
  public async generateReport(
    @Param() date: DateQuery
  ): Promise<StreamableFile> {
    const buffer = await this.appService.generateReport({
      year: Number(date.year),
      month: Number(date.month) - 1,
    });
    return new StreamableFile(buffer, {
      disposition: `attachment; filename=report-${date.month}-${date.year}.xlsx`,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  @Get('send-last-month-report')
  public async generateReportForLastMonth(): Promise<{ message: string }> {
    try {
      await this.appService.sendMonthlyReport();
      return { message: 'Report sent' };
    } catch (error) {
      return { message: 'Error sending report' };
    }
  }
}
