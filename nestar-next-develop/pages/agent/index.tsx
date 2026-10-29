import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import SellerCard from '../../libs/components/seller/SellerCard';
import PageContainer from '../../libs/components/ui/PageContainer';
import ListHeader from '../../libs/components/ui/ListHeader';
import SearchInput from '../../libs/components/ui/SearchInput';
import SortSelect from '../../libs/components/ui/SortSelect';
import EmptyState from '../../libs/components/ui/EmptyState';
import Pagination from '../../libs/components/ui/Pagination';
import { GET_AGENTS } from '../../apollo/user/query';
import { useLikeMember } from '../../libs/hooks/useLike';
import { parseQueryJson } from '../../libs/utils';
import { Member } from '../../libs/types/member/member';
import { AgentsInquiry } from '../../libs/types/member/member.input';
import { Direction } from '../../libs/enums/common.enum';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const DEFAULT_FILTER: AgentsInquiry = {
	page: 1,
	limit: 12,
	sort: 'createdAt',
	direction: Direction.DESC,
	search: {},
};

const SORT_OPTIONS = [
	{ value: 'recent', label: 'Newest first', sort: 'createdAt', direction: Direction.DESC },
	{ value: 'rank', label: 'Top ranked', sort: 'memberRank', direction: Direction.DESC },
	{ value: 'likes', label: 'Most liked', sort: 'memberLikes', direction: Direction.DESC },
	{ value: 'views', label: 'Most viewed', sort: 'memberViews', direction: Direction.DESC },
];

/** /agent — every seller (dealers and private sellers), searchable and sortable; the filter lives in ?input= */
const SellerList: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const filter = parseQueryJson<AgentsInquiry>(router.query.input, DEFAULT_FILTER);
	const [searchText, setSearchText] = useState<string>(filter.search?.text ?? '');

	const { data, previousData, loading, refetch } = useQuery(GET_AGENTS, {
		fetchPolicy: 'network-only',
		variables: { input: filter },
		skip: !router.isReady,
		notifyOnNetworkStatusChange: true,
	});
	const result = (data ?? previousData)?.getAgents;
	const sellers: Member[] = result?.list ?? [];
	const total: number = result?.metaCounter?.[0]?.total ?? 0;

	const likeSeller = useLikeMember(() => refetch());

	// back / forward and shared links bring their own search text
	useEffect(() => {
		setSearchText(filter.search?.text ?? '');
	}, [filter.search?.text]);

	/** HANDLERS **/
	const applyFilter = (next: AgentsInquiry, scrollToTop = false) => {
		const href = `/agent?input=${JSON.stringify(next)}`;
		router.push(href, href, { scroll: scrollToTop });
	};

	const searchHandler = (text: string) =>
		applyFilter({ ...filter, page: 1, search: { ...filter.search, text: text || undefined } });

	const sortHandler = (value: string) => {
		const option = SORT_OPTIONS.find((item) => item.value === value) ?? SORT_OPTIONS[0];
		applyFilter({ ...filter, page: 1, sort: option.sort, direction: option.direction });
	};

	const currentSort =
		SORT_OPTIONS.find((item) => item.sort === filter.sort && item.direction === filter.direction)?.value ?? 'recent';

	return (
		<div className={'bg-white pt-8 pb-20 font-sans text-text'}>
			<PageContainer>
				<ListHeader
					summary={`${total} ${t('sellers found')}`}
					actions={
						<>
							<SearchInput
								value={searchText}
								placeholder={t('Search sellers') as string}
								onChange={setSearchText}
								onSubmit={searchHandler}
								className={'w-full md:w-[260px]'}
							/>
							<SortSelect
								label={t('Sort by')}
								value={currentSort}
								options={SORT_OPTIONS.map((option) => ({ value: option.value, label: t(option.label) }))}
								onChange={sortHandler}
								className={'w-full sm:w-auto'}
							/>
						</>
					}
				/>

				{sellers.length === 0 ? (
					<EmptyState loading={loading || !result} text={t('No sellers found')} />
				) : (
					<div className={'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'}>
						{sellers.map((seller) => (
							<SellerCard seller={seller} key={seller._id} onLike={likeSeller} />
						))}
					</div>
				)}

				<Pagination
					page={filter.page}
					total={total}
					pageSize={filter.limit}
					onChange={(page) => applyFilter({ ...filter, page }, true)}
				/>
			</PageContainer>
		</div>
	);
};

export default withLayoutBasic(SellerList);
