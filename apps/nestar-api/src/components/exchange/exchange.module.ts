import { Module } from '@nestjs/common';
import { ExchangeResolver } from './exchange.resolver';

@Module({ providers: [ExchangeResolver] })
export class ExchangeModule {}
