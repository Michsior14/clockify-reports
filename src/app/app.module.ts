import { MailerModule } from '@nestjs-modules/mailer';
import { ConsoleLogger, Module, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
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
    ConsoleLogger,
    {
      provide: APP_GUARD,
      useClass: BasicAuthGuard,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        whitelist: true,
        forbidUnknownValues: true,
      }),
    },
  ],
})
export class AppModule {}
