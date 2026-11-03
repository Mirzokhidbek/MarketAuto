import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { Bot, Context, InlineKeyboard, Keyboard } from 'grammy';
import type { ObjectId } from 'mongoose';
import { settings } from '../../libs/env';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { Member } from '../../libs/dto/member/member';
import { MemberService } from '../member/member.service';
import { StorageService } from '../storage/storage.service';

const TEXT = {
	welcome: (name: string) =>
		`Assalomu alaykum, ${name}! CarPort — Oʻzbekistonda avtomobil oldi-sotdisi.\n\n` +
		'Roʻyxatdan oʻtishni yakunlash uchun pastdagi tugma orqali telefon raqamingizni yuboring.',
	askPhone: 'Telefon raqamingizni pastdagi tugma orqali yuboring.',
	phoneButton: '📱 Raqamni yuborish',
	notOwnPhone: 'Iltimos, boshqa odamning emas, oʻz raqamingizni pastdagi tugma orqali yuboring.',
	saved: 'Rahmat! Siz CarPort’da roʻyxatdan oʻtdingiz.',
	linked: 'Rahmat! Bu raqam bilan CarPort’dagi hisobingiz topildi va Telegram’ga bogʻlandi.',
	taken: 'Bu raqam boshqa CarPort hisobiga bogʻlangan. Yordam uchun qoʻllab-quvvatlash xizmatiga yozing.',
	invalid: 'Raqamni oʻqib boʻlmadi. Iltimos, tugma orqali qayta yuboring.',
	ready: 'Siz roʻyxatdan oʻtgansiz.',
	openApp: 'Mashinalar bozoriga kirish uchun pastdagi tugmani bosing.',
	appButton: '🚗 Bozorga kirish',
	menuButton: 'Bozorga kirish',
	adminButton: '🛠 Admin panel',
	blocked: 'Hisobingiz bloklangan. Yordam uchun qoʻllab-quvvatlash xizmatiga yozing.',
	deleted: 'Bu Telegram hisobi bilan bogʻlangan CarPort hisobi oʻchirilgan.',
	error: 'Xatolik yuz berdi. Birozdan keyin /start ni qayta bosing.',
};

/**
 * @CarPort bot: /start registers the person as a member (name, @username, Telegram id, profile photo),
 * then asks for the phone with Telegram's contact button. Runs with long polling, so it needs no public URL;
 * only one API instance may poll at a time (Telegram allows one getUpdates connection per bot).
 */
@Injectable()
export class TelegramBotService implements OnApplicationBootstrap, OnModuleDestroy {
	private readonly logger = new Logger('TelegramBot');
	private bot: Bot | null = null;

	constructor(
		private readonly memberService: MemberService,
		private readonly storageService: StorageService,
	) {}

	public onApplicationBootstrap(): void {
		const { botToken } = settings.telegram;
		if (!botToken || process.env.NODE_ENV === 'test') return;
		this.bot = this.createBot(botToken);
		void this.start(this.bot);
	}

	public async onModuleDestroy(): Promise<void> {
		await this.bot?.stop();
	}

	/** the handlers; kept apart from start() so tests can feed updates without polling */
	public createBot(token: string): Bot {
		const bot = new Bot(token);
		bot.use(async (ctx, next) => {
			const kind = ctx.message?.contact ? 'contact' : (ctx.message?.text?.split(' ')[0] ?? 'update');
			this.logger.log(
				`Update ${ctx.update.update_id}: ${kind} from ${ctx.from?.id ?? '?'} (${ctx.chat?.type ?? '?'} chat)`,
			);
			await next();
		});
		const pm = bot.chatType('private');
		pm.command('start', (ctx) => this.onStart(ctx));
		pm.on('message:contact', (ctx) => this.onContact(ctx));
		pm.on('message', (ctx) => this.onOther(ctx));
		bot.catch(({ error, ctx }) => {
			this.logger.error(`Update ${ctx.update.update_id} failed: ${error instanceof Error ? error.message : error}`);
			void ctx.reply(TEXT.error).catch(() => undefined);
		});
		return bot;
	}

	private async start(bot: Bot): Promise<void> {
		try {
			const { webAppUrl } = settings.telegram;
			if (this.appUrl())
				await bot.api.setChatMenuButton({
					menu_button: { type: 'web_app', text: TEXT.menuButton, web_app: { url: webAppUrl! } },
				});
			await bot.start({
				allowed_updates: ['message'],
				onStart: (me) => this.logger.log(`@${me.username} is listening (long polling)`),
			});
		} catch (err) {
			this.logger.error(`Bot stopped: ${err instanceof Error ? err.message : err}`);
		}
	}

	private async onStart(ctx: Context): Promise<void> {
		const from = ctx.from;
		if (!from || from.is_bot) return;
		const { member, created } = await this.memberService.telegramMember(from);
		if (member.memberStatus === MemberStatus.BLOCK) return void (await ctx.reply(TEXT.blocked));
		if (member.memberStatus === MemberStatus.DELETE) return void (await ctx.reply(TEXT.deleted));
		// a new member, or one that still has no picture (e.g. created before a profile photo was set)
		if (created || !member.memberImage) void this.saveAvatar(ctx, from.id, member._id);

		if (!member.memberPhone) {
			await ctx.reply(TEXT.welcome(from.first_name), { reply_markup: this.phoneKeyboard() });
			return;
		}
		await this.replyReady(ctx, TEXT.ready, member);
	}

	private async onContact(ctx: Context): Promise<void> {
		const from = ctx.from;
		const contact = ctx.message?.contact;
		if (!from || !contact) return;
		// a forwarded or picked contact of someone else is not proof of the person's own number
		if (contact.user_id !== from.id) {
			await ctx.reply(TEXT.notOwnPhone, { reply_markup: this.phoneKeyboard() });
			return;
		}
		// the contact can be the first message the bot sees (e.g. /start was sent while the bot was offline)
		const { member, created } = await this.memberService.telegramMember(from);
		if (created) void this.saveAvatar(ctx, from.id, member._id);
		const result = await this.memberService.setTelegramPhone(from, contact.phone_number);
		if (result === 'INVALID') return void (await ctx.reply(TEXT.invalid, { reply_markup: this.phoneKeyboard() }));
		if (result === 'TAKEN') return void (await ctx.reply(TEXT.taken, { reply_markup: { remove_keyboard: true } }));
		await this.replyReady(
			ctx,
			result === 'LINKED' ? TEXT.linked : TEXT.saved,
			(await this.memberService.telegramMember(from)).member,
		);
	}

	/** any other message: ask for the phone if it is still missing, else point to the app */
	private async onOther(ctx: Context): Promise<void> {
		if (!ctx.from || ctx.from.is_bot) return;
		const { member, created } = await this.memberService.telegramMember(ctx.from);
		if (created) void this.saveAvatar(ctx, ctx.from.id, member._id);
		if (member.memberStatus !== MemberStatus.ACTIVE) return;
		if (!member.memberPhone) await ctx.reply(TEXT.askPhone, { reply_markup: this.phoneKeyboard() });
		else await this.replyReady(ctx, TEXT.ready, member);
	}

	private async replyReady(ctx: Context, text: string, member: Member): Promise<void> {
		await ctx.reply(text, { reply_markup: { remove_keyboard: true } });
		const url = this.appUrl();
		if (!url) return;
		const keyboard = new InlineKeyboard().webApp(TEXT.appButton, url);
		// an admin whose Telegram id is allowed opens the admin panel straight from the bot
		if (member.memberType === MemberType.ADMIN && ctx.from && this.memberService.isTelegramAdmin(ctx.from.id))
			keyboard.row().webApp(TEXT.adminButton, `${url.replace(/\/$/, '')}/_admin`);
		await ctx.reply(TEXT.openApp, { reply_markup: keyboard });
	}

	private phoneKeyboard(): Keyboard {
		return new Keyboard().requestContact(TEXT.phoneButton).resized().oneTime();
	}

	/** Telegram opens Mini Apps only from https addresses */
	private appUrl(): string | null {
		const { webAppUrl } = settings.telegram;
		return webAppUrl?.startsWith('https://') ? webAppUrl : null;
	}

	/** the largest Telegram profile photo becomes the avatar; failures only cost the picture */
	private async saveAvatar(ctx: Context, telegramId: number, memberId: ObjectId): Promise<void> {
		try {
			const { photos } = await ctx.api.getUserProfilePhotos(telegramId, { limit: 1 });
			const sizes = photos[0];
			if (!sizes?.length) return;
			const file = await ctx.api.getFile(sizes[sizes.length - 1].file_id);
			if (!file.file_path) return;
			const response = await fetch(`https://api.telegram.org/file/bot${settings.telegram.botToken}/${file.file_path}`, {
				signal: AbortSignal.timeout(10_000),
			});
			if (!response.ok) return;
			const image = await this.storageService.saveImage(Buffer.from(await response.arrayBuffer()), 'member', memberId);
			if (!(await this.memberService.setAvatarIfEmpty(memberId, image))) await this.storageService.removeImage(image);
		} catch (err) {
			this.logger.warn(`Avatar of ${telegramId} not saved: ${err instanceof Error ? err.message : err}`);
		}
	}
}
