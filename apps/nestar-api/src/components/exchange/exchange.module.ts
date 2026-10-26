import { Global, Module } from '@nestjs/common';
import { ExchangeResolver } from './exchange.resolver';
import { ExchangeService } from './exchange.service';

@Global()
@Module({ providers: [ExchangeResolver, ExchangeService], exports: [ExchangeService] })
export class ExchangeModule {}
