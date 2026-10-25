import { GetServerSideProps } from 'next';

// old seller page URL: every profile now lives at /member (cars, articles, reviews, followers)
export const getServerSideProps: GetServerSideProps = async ({ query, locale, defaultLocale }) => {
	const prefix = locale && locale !== defaultLocale ? `/${locale}` : '';
	const agentId = typeof query.agentId === 'string' ? query.agentId : '';
	return {
		redirect: {
			destination: agentId ? `${prefix}/member?memberId=${encodeURIComponent(agentId)}` : `${prefix}/agent`,
			permanent: true,
		},
	};
};

const AgentDetailRedirect = () => null;

export default AgentDetailRedirect;
