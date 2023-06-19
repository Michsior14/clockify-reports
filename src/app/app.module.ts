import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { env } from 'process';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BasicAuthGuard } from './auth/local-auth.guard';

@Module({
  imports: [
    AuthModule,
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
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: BasicAuthGuard,
    },
  ],
})
export class AppModule {}
