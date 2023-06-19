import { Controller, Get, Header, Param, StreamableFile } from '@nestjs/common';
import { AppService, DateQuery } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('report/:year/:month')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
  @Header('Content-Disposition', 'attachment; filename=summary.xlsx')
  public async generateReport(
    @Param() date: DateQuery
  ): Promise<StreamableFile> {
    const buffer = await this.appService.generateReport({
      year: Number(date.year),
      month: Number(date.month) - 1,
    });
    return new StreamableFile(buffer);
  }

  @Get('send-last-month-report')
  public async generateReportForLastMonth(): Promise<{ message: string }> {
    try {
      console.log(process.env);
      await this.appService.sendMonthlyReport();
      return { message: 'Report sent' };
    } catch (error) {
      return { message: 'Error sending report' };
    }
  }
}
