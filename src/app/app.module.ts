import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { env } from 'process';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ScheduleModule.forRoot(),
    MailerModule.forRoot({
      transport: {
        host: env.EMAIL_HOST,
        port: Number(env.EMAIL_PORT),
        secure: env.EMAIL_SSL === 'true',
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASSWORD,
        },
      },
      defaults: {
        from: env.EMAIL_FROM,
      },
    }),
  ],
})
export class AppModule {}
