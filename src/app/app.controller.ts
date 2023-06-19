import { Controller, Get, Param, StreamableFile } from '@nestjs/common';
import { AppService, SimpleDate } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('report/:month?/:year?')
  public async generateReport(
    @Param() params: SimpleDate
  ): Promise<StreamableFile> {
    const { report, date } = await this.appService.generateReport(
      params.month && params.year ? params : 'current'
    );
    return new StreamableFile(report, {
      disposition: `attachment; filename=report-${date.month + 1}-${
        date.year
      }.xlsx`,
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
