/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Injectable()
export class BasicAuthGuard extends AuthGuard('basic') {
  public handleRequest<TUser = any>(
    err: any,
    user: any,
    _realm: string,
    context: ExecutionContext
  ): TUser {
    if (err || !user) {
      const ctx = context.switchToHttp();
      const response = ctx.getResponse<Response>();
      response.setHeader('WWW-Authenticate', 'Basic realm=clockify-report');
      throw new UnauthorizedException(err);
    }
    return user;
  }
}
