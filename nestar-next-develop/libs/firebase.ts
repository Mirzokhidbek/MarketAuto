import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';

/** web app "AutoMarket Web" in Firebase project kixora-99964 (values come from .env) */
const config = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Firebase sign-in buttons are shown only when the web config is present */
export const firebaseEnabled = !!(config.apiKey && config.projectId && config.appId);

/** browser only: call from event handlers / effects, never during server rendering */
export const firebaseApp = (): FirebaseApp => (getApps().length ? getApp() : initializeApp(config));

export const firebaseAuth = (): Auth => {
	const auth = getAuth(firebaseApp());
	// SMS and emails from Firebase follow the visitor's browser language
	auth.useDeviceLanguage();
	return auth;
};
