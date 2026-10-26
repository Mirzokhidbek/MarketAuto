import { useMemo } from 'react';
import { ApolloClient, ApolloLink, InMemoryCache, from, NormalizedCacheObject, Observable } from '@apollo/client';
import createUploadLink from 'apollo-upload-client/public/createUploadLink.js';
import { onError } from '@apollo/client/link/error';
import { getMainDefinition } from '@apollo/client/utilities';
import { getJwtToken, getRefreshToken, isTokenExpired, logOut, refreshAccessToken } from '../libs/auth';
import { sweetErrorAlert } from '../libs/sweetAlert';
let apolloClient: ApolloClient<NormalizedCacheObject>;

function getHeaders() {
	const headers = {} as HeadersInit;
	const token = getJwtToken();
	// @ts-ignore
	if (token) headers['Authorization'] = `Bearer ${token}`;
	return headers;
}

// messages that mean the session cannot continue
const SESSION_ENDED = ['You have been blocked!', 'You are not authenticated', 'Your session has expired'];

function createIsomorphicLink() {
	if (typeof window !== 'undefined') {
		/* renew an expired access token with the refresh token before sending the request */
		const refreshLink = new ApolloLink((operation, forward) => {
			const token = getJwtToken();
			if (!token || !isTokenExpired(token) || !getRefreshToken()) return forward(operation);
			return new Observable((observer) => {
				let subscription: any;
				refreshAccessToken()
					.then(() => {
						subscription = forward(operation).subscribe(observer);
					})
					.catch((err) => observer.error(err));
				return () => subscription?.unsubscribe();
			});
		});

		const authLink = new ApolloLink((operation, forward) => {
			operation.setContext(({ headers = {} }) => ({
				headers: {
					...headers,
					...getHeaders(),
				},
			}));
			return forward(operation);
		});

		// @ts-ignore
		const link = new createUploadLink({
			uri: process.env.REACT_APP_API_GRAPHQL_URL,
		});

		const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
			// mutations are started by a form/button that shows its own error (inline or popup); only queries alert here
			const isMutation = getMainDefinition(operation.query)?.kind === 'OperationDefinition' &&
				(getMainDefinition(operation.query) as any).operation === 'mutation';
			if (graphQLErrors) {
				graphQLErrors.forEach(({ message }) => {
					// blocked/removed account or a dead session: end it instead of failing every request
					const sessionEnded = SESSION_ENDED.some((text) => message.startsWith(text));
					if (sessionEnded && getJwtToken()) {
						sweetErrorAlert(message).then(() => logOut());
						return;
					}
					// a logged-out visitor on a members-only page is redirected anyway: no extra alert
					if (message === 'Bearer Token is not provided!' && !getJwtToken()) return;
					if (!isMutation && !message.includes('input')) sweetErrorAlert(message);
				});
			}
			if (networkError) console.warn(`[Network error]: ${networkError}`);
		});

		return from([errorLink, refreshLink, authLink, link]);
	}
}

function createApolloClient() {
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		link: createIsomorphicLink(),
		cache: new InMemoryCache(),
		resolvers: {},
	});
}

export function initializeApollo(initialState = null) {
	const _apolloClient = apolloClient ?? createApolloClient();
	if (initialState) _apolloClient.cache.restore(initialState);
	if (typeof window === 'undefined') return _apolloClient;
	if (!apolloClient) apolloClient = _apolloClient;

	return _apolloClient;
}

export function useApollo(initialState: any) {
	return useMemo(() => initializeApollo(initialState), [initialState]);
}
