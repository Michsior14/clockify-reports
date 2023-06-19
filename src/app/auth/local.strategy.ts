import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy as Strategy } from 'passport-http';
import { env } from 'process';

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({ realm: 'clockify-report' });
  }

  async validate(username: string, password: string): Promise<object> {
    if (username !== env.ACCESS_USERNAME || password !== env.ACCESS_PASSWORD) {
      throw new UnauthorizedException();
    }
    return {};
  }
}
