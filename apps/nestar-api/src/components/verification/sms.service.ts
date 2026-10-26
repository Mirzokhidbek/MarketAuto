import { Injectable, Logger } from '@nestjs/common';

/**
 * SMS delivery:
 *  - Uzbek numbers (998...) via Eskiz.uz   — ESKIZ_EMAIL, ESKIZ_PASSWORD, ESKIZ_FROM (default 4546)
 *  - other countries via Twilio          — TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM
 * Without credentials (development) the code is only written to the server log.
 */
@Injectable()
export class SmsService {
	private readonly logger = new Logger('SmsService');
	private eskizToken: string | null = null;

	public hasProvider(phone: string): boolean {
		return phone.startsWith('998') ? !!process.env.ESKIZ_EMAIL : !!process.env.TWILIO_SID;
	}

	public async send(phone: string, text: string): Promise<boolean> {
		if (!this.hasProvider(phone)) {
			this.logger.warn(`[DEV SMS] to +${phone}: ${text}`);
			return true;
		}
		try {
			return phone.startsWith('998') ? await this.sendEskiz(phone, text) : await this.sendTwilio(phone, text);
		} catch (err: any) {
			this.logger.error(`SMS to +${phone} failed: ${err.message}`);
			return false;
		}
	}

	private async eskizLogin(): Promise<string> {
		const body = new FormData();
		body.append('email', process.env.ESKIZ_EMAIL ?? '');
		body.append('password', process.env.ESKIZ_PASSWORD ?? '');
		const response = await fetch('https://notify.eskiz.uz/api/auth/login', { method: 'POST', body });
		const json: any = await response.json();
		if (!json?.data?.token) throw new Error('Eskiz login failed');
		return json.data.token;
	}

	private async sendEskiz(phone: string, text: string, retry = true): Promise<boolean> {
		if (!this.eskizToken) this.eskizToken = await this.eskizLogin();
		const body = new FormData();
		body.append('mobile_phone', phone);
		body.append('message', text);
		body.append('from', process.env.ESKIZ_FROM ?? '4546');
		const response = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
			method: 'POST',
			headers: { Authorization: `Bearer ${this.eskizToken}` },
			body,
		});
		// token expires every 30 days: log in again once
		if (response.status === 401 && retry) {
			this.eskizToken = null;
			return await this.sendEskiz(phone, text, false);
		}
		return response.ok;
	}

	private async sendTwilio(phone: string, text: string): Promise<boolean> {
		const sid = process.env.TWILIO_SID ?? '';
		const auth = Buffer.from(`${sid}:${process.env.TWILIO_TOKEN ?? ''}`).toString('base64');
		const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
			method: 'POST',
			headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ To: `+${phone}`, From: process.env.TWILIO_FROM ?? '', Body: text }),
		});
		return response.ok;
	}
}
