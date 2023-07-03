import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IsNumber, IsOptional } from 'class-validator';
import Clockify, {
  RequestSummaryReportAmountShownEnum,
  RequestSummaryReportContainsFilterEnum,
  RequestSummaryReportExportTypeEnum,
  RequestSummaryReportGroupsEnum,
  RequestSummaryReportSortColumnEnum,
  RequestSummaryReportSortOrderEnum,
  RequestSummaryReportType,
  RequestSummaryReportUserStatusFilterEnum,
} from 'clockify-ts';
import { Workbook, WorksheetModel } from 'exceljs';
import { env } from 'process';
import { stringify } from 'qs';

export class SimpleDate {
  @IsNumber()
  @IsOptional()
  year: number;
  @IsNumber()
  @IsOptional()
  month: number;
}

export type SimpleDateOrTag = SimpleDate | 'current' | 'last';

@Injectable()
export class AppService {
  readonly #api = new Clockify(env.CLOCKIFY_API_KEY);
  readonly #workspace = this.#api.workspaces.withId(env.CLOCKIFY_WORKSPACE_ID);
  readonly #logger = new Logger(AppService.name);

  constructor(private readonly mailerService: MailerService) {}

  public async generateReport(
    dateOrTag: SimpleDateOrTag
  ): Promise<{ report: Buffer; date: SimpleDate }> {
    try {
      const date = this.getDateDetails(dateOrTag);
      const [summaryData, users] = await Promise.all([
        this.getXlsxReport(
          {
            summaryFilter: {
              groups: [RequestSummaryReportGroupsEnum.project],
              sortColumn: RequestSummaryReportSortColumnEnum.group,
            },
          },
          date
        ),
        this.#workspace.users.get({}),
      ]);

      const userWorksheets = await Promise.all(
        users.map(async (user) => ({
          name: `${user.name}`,
          model: await this.getWorksheetModel(
            await this.getXlsxReport(
              {
                users: {
                  ids: [user.id],
                  contains: RequestSummaryReportContainsFilterEnum.contains,
                  status: RequestSummaryReportUserStatusFilterEnum.all,
                },
                summaryFilter: {
                  groups: [
                    RequestSummaryReportGroupsEnum.date,
                    RequestSummaryReportGroupsEnum.project,
                    RequestSummaryReportGroupsEnum.timeEntry,
                  ],
                  sortColumn: RequestSummaryReportSortColumnEnum.group,
                },
              },
              date
            )
          ),
        }))
      );

      const worksheetsToWrite = [
        { name: 'Summary', model: await this.getWorksheetModel(summaryData) },
        ...userWorksheets,
      ];

      const result = new Workbook();
      for (const { name, model } of worksheetsToWrite) {
        const worksheet = result.addWorksheet();
        worksheet.model = model;
        worksheet.name = name;
      }

      const report = (await result.xlsx.writeBuffer({
        zip: { compression: 'DEFLATE' },
      })) as Buffer;

      return {
        report,
        date,
      };
    } catch (e) {
      this.#logger.error(e);
    }
  }

  @Cron(env.EMAIL_SCHEDULE)
  async sendMonthlyReport(): Promise<void> {
    const { report, date } = await this.generateReport('last');
    const { year, month } = date;
    return this.mailerService.sendMail({
      to: env.EMAIL_TO.split(','),
      subject: `${env.EMAIL_SUBJECT} ${month + 1}/${year}`,
      text: env.EMAIL_BODY,
      attachments: [
        {
          filename: `clockify-report-${month + 1}-${year}.xlsx`,
          content: report,
        },
      ],
    });
  }

  private async getXlsxReport(
    summary: Omit<
      RequestSummaryReportType,
      | 'dateRangeStart'
      | 'dateRangeEnd'
      | 'exportType'
      | 'amountShown'
      | 'sortOrder'
    >,
    date: SimpleDate
  ): Promise<Buffer> {
    const { data } = await this.#workspace.reports.summary._api.post(
      this.#workspace.reports.summary.resourceSubPath(),
      {
        ...this.getMonthRange(date),
        ...summary,
        sortOrder: RequestSummaryReportSortOrderEnum.ascneding,
        amountShown: RequestSummaryReportAmountShownEnum.hideAmount,
        exportType: RequestSummaryReportExportTypeEnum.xlsx,
      },
      { responseType: 'arraybuffer', paramsSerializer: this.paramsSerializer }
    );
    return data;
  }

  private async getWorksheetModel(buffer: Buffer): Promise<WorksheetModel> {
    const temp = new Workbook();
    await temp.xlsx.load(buffer);
    return temp.getWorksheet(1).model;
  }

  private getMonthRange(date: SimpleDate): {
    dateRangeStart: Date;
    dateRangeEnd: Date;
  } {
    const { year, month } = date;
    const dateRangeStart = new Date(Date.UTC(year, month, 1, 0, 0));
    const dateRangeEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59));
    return { dateRangeStart, dateRangeEnd };
  }

  // Copy from 'clockify-ts'
  private paramsSerializer(params: unknown) {
    return stringify(params, {
      arrayFormat: 'repeat',
      serializeDate: (d: Date) => d.toISOString(),
    });
  }

  private getDateDetails(date?: SimpleDate | 'current' | 'last'): SimpleDate {
    if (typeof date !== 'string') {
      return date;
    }
    const today = new Date(Date.now());
    let year = today.getFullYear();
    let month = today.getMonth();
    if (date === 'last') {
      if (month === 0) {
        year -= 1;
        month = 11;
      } else {
        month -= 1;
      }
    }
    return { year, month };
  }
}
