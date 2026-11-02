import { Module } from '@nestjs/common';
import { MemberModule } from '../member/member.module';
import { TelegramBotService } from './telegram-bot.service';

@Module({
	imports: [MemberModule],
	providers: [TelegramBotService],
})
export class TelegramModule {}
