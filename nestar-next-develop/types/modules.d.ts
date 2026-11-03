// side-effect imports without type declarations (moment locales, until moment is replaced)
declare module 'moment/locale/*';

// apollo-upload-client 20 ships JavaScript only
declare module 'apollo-upload-client/UploadHttpLink.mjs' {
	import { ApolloLink } from '@apollo/client';
	export default class UploadHttpLink extends ApolloLink {
		constructor(options?: { uri?: string; credentials?: string; headers?: Record<string, string> });
	}
}
