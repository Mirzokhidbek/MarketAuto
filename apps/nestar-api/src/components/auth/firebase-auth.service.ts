import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { settings } from '../../libs/env';
import { Message } from '../../libs/enums/common.enum';
import { firebaseAdminApp } from '../../libs/firebase-admin';

/** what the API trusts about a Firebase user: only fields Firebase itself has verified */
export interface FirebaseIdentity {
	uid: string;
	provider: string; // 'password' | 'google.com' | 'phone'
	email?: string; // present only when Firebase marks it verified
	phone?: string; // E.164, verified by the SMS code
	name?: string;
	picture?: string;
}

/**
 * Verifies Firebase Authentication ID tokens sent by the apps.
 * Needs only FIREBASE_PROJECT_ID: signatures are checked with Google's public keys, no service account.
 */
@Injectable()
export class FirebaseAuthService {
	private readonly logger = new Logger('FirebaseAuthService');

	public async verify(idToken: string): Promise<FirebaseIdentity> {
		if (!settings.firebase.projectId) throw new ServiceUnavailableException(Message.NOT_ALLOWED_REQUEST);
		let decoded: DecodedIdToken;
		try {
			decoded = await getAuth(firebaseAdminApp()).verifyIdToken(idToken);
		} catch (err: any) {
			this.logger.warn(`Rejected Firebase ID token: ${err?.code ?? err?.message}`);
			throw new BadRequestException(Message.WRONG_LOGIN);
		}
		return {
			uid: decoded.uid,
			provider: decoded.firebase?.sign_in_provider ?? '',
			// an unverified email could belong to someone else: it is never used to find or create an account
			email: decoded.email && decoded.email_verified ? decoded.email.toLowerCase() : undefined,
			phone: decoded.phone_number,
			name: typeof decoded.name === 'string' ? decoded.name : undefined,
			picture: typeof decoded.picture === 'string' ? decoded.picture : undefined,
		};
	}
}
