import { App, applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { GoogleAuth } from 'google-auth-library';
import type { MongooseModuleOptions } from '@nestjs/mongoose';

/**
 * Server-side access to Firebase project FIREBASE_PROJECT_ID.
 * Credentials (Google Application Default Credentials, looked up only when first needed):
 * the service account JSON named by GOOGLE_APPLICATION_CREDENTIALS, else the developer's own login
 * from `gcloud auth application-default login`, else the service account attached on Google Cloud.
 * Without any of them only ID-token verification works (it needs just the project id).
 */
export const firebaseAdminApp = (): App => {
	const existing = getApps().find((app) => app.name === 'admin');
	if (existing) return existing;
	return initializeApp(
		{
			projectId: process.env.FIREBASE_PROJECT_ID,
			storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
			credential: applicationDefault(),
		},
		'admin',
	);
};

/**
 * Mongoose options for MONGO_DEV / MONGO_PROD.
 * Firestore with MongoDB compatibility (host *.firestore.goog) signs in with a short-lived Google access
 * token of the Google account in use (needs the "Cloud Datastore User" role); a plain MongoDB URI is used as is.
 */
export const mongooseOptions = (uri?: string): MongooseModuleOptions => {
	if (!uri || !uri.includes('.firestore.goog')) return { uri };
	const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
	// Firestore requirements: load-balanced mode (the driver accepts it only in the URI), TLS, no retryable writes
	if (!/[?&]loadBalanced=true/.test(uri)) uri += `${uri.includes('?') ? '&' : '?'}loadBalanced=true`;
	return {
		uri,
		tls: true,
		retryWrites: false,
		authMechanism: 'MONGODB-OIDC',
		authMechanismProperties: {
			// the driver sends OIDC tokens only to hosts on this list
			ALLOWED_HOSTS: ['*.firestore.goog'],
			OIDC_CALLBACK: async () => {
				const { token } = await (await auth.getClient()).getAccessToken();
				if (!token) throw new Error('No Google access token for Firestore (run: gcloud auth application-default login)');
				// Google access tokens live one hour; the driver asks again before this runs out
				return { accessToken: token, expiresInSeconds: 50 * 60 };
			},
		},
	};
};
