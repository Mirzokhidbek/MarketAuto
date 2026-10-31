import { settings } from '../../libs/env';
import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

const escapeHtml = (text: string) =>
	text.replace(
		/[&<>"']/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
	);

/**
 * Outgoing email over SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM).
 * Without SMTP_HOST (development) the message is only written to the server log.
 */
@Injectable()
export class MailService {
	private readonly logger = new Logger('MailService');
	private transporter: Transporter | null = null;

	public hasProvider(): boolean {
		return !!settings.smtp.host;
	}

	private transport(): Transporter {
		if (!this.transporter) {
			const { host, port, user, pass } = settings.smtp;
			this.transporter = nodemailer.createTransport({
				host,
				port,
				secure: port === 465,
				// port 587: STARTTLS is required, never plain text
				requireTLS: port !== 465,
				auth: user ? { user, pass } : undefined,
			});
		}
		return this.transporter;
	}

	/** plain text + a simple branded HTML version of the same lines */
	public async send(to: string, subject: string, lines: string[]): Promise<boolean> {
		const text = lines.join('\n\n');
		if (!this.hasProvider()) {
			this.logger.warn(`[DEV EMAIL] to ${to}: ${subject} — ${text}`);
			return true;
		}
		const html =
			`<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#10213c">` +
			`<h2 style="color:#015dea;margin:0 0 16px">CarPort</h2>` +
			lines.map((line) => `<p style="margin:0 0 12px;line-height:1.5">${escapeHtml(line)}</p>`).join('') +
			`<p style="margin-top:24px;font-size:12px;color:#5b6475">CarPort · Import · Trust · Drive</p></div>`;
		try {
			await this.transport().sendMail({ from: settings.smtp.from, to, subject, text, html });
			return true;
		} catch (err: any) {
			this.logger.error(`Email to ${to} failed: ${err.message}`);
			return false;
		}
	}
}
