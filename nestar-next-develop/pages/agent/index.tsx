import React, { ChangeEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Pagination } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SellerCard from '../../libs/components/seller/SellerCard';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Member } from '../../libs/types/member/member';
import { GET_AGENTS } from '../../apollo/user/query';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { LIKE_TARGET_MEMBER } from '../../apollo/user/mutation';
import { T } from '../../libs/types/common';
import { Messages } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const AgentList: NextPage = ({ initialInput, ...props }: any) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [searchFilter, setSearchFilter] = useState<any>(
		router?.query?.input ? JSON.parse(router?.query?.input as string) : initialInput,
	);
	const [agents, setAgents] = useState<Member[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [searchText, setSearchText] = useState<string>('');

	/** APOLLO REQUESTS **/
	const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);

	const {
		loading: getAgentsLoading,
		data: getAgentsData,
		error: getAgentsError,
		refetch: getAgentsRefetch,
	} = useQuery(GET_AGENTS, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setAgents(data?.getAgents?.list);
			setTotal(data?.getAgents?.metaCounter[0]?.total);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.input) {
			const input_obj = JSON.parse(router?.query?.input as string);
			setSearchFilter(input_obj);
		} else
			router.replace(`/agent?input=${JSON.stringify(searchFilter)}`, `/agent?input=${JSON.stringify(searchFilter)}`);

		setCurrentPage(searchFilter.page === undefined ? 1 : searchFilter.page);
	}, [router]);

	/** HANDLERS **/
	const sortOptions = [
		{ id: 'recent', label: 'Newest first', sort: 'createdAt', direction: 'DESC' },
		{ id: 'rank', label: 'Top ranked', sort: 'memberRank', direction: 'DESC' },
		{ id: 'likes', label: 'Most liked', sort: 'memberLikes', direction: 'DESC' },
		{ id: 'views', label: 'Most viewed', sort: 'memberViews', direction: 'DESC' },
	];
	const currentSort =
		sortOptions.find((item) => item.sort === searchFilter.sort && item.direction === searchFilter.direction)?.id ??
		'recent';

	const sortingHandler = (id: string) => {
		const option = sortOptions.find((item) => item.id === id)!;
		setSearchFilter({ ...searchFilter, page: 1, sort: option.sort, direction: option.direction });
	};

	const paginationChangeHandler = async (event: ChangeEvent<unknown>, value: number) => {
		searchFilter.page = value;
		await router.push(`/agent?input=${JSON.stringify(searchFilter)}`, `/agent?input=${JSON.stringify(searchFilter)}`, {
			scroll: false,
		});
		setCurrentPage(value);
	};

	const likeMemberHandler = async (user: any, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);

			await likeTargetMember({
				variables: {
					input: id,
				},
			});

			await getAgentsRefetch({ input: searchFilter });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	return (
		<div className={'ma-page ma-list-page'}>
			<div className={'ma-container'}>
				<div className={'ma-results__bar'}>
					<div>
						<span>
							{total || 0} {t('sellers found')}
						</span>
					</div>
					<div className={'ma-toolbar'}>
						<div className={'ma-filter__search'}>
							<SearchIcon />
							<input
								type="text"
								value={searchText}
								placeholder={t('Search sellers') as string}
								onChange={(e: any) => setSearchText(e.target.value)}
								onKeyDown={(event: any) => {
									if (event.key == 'Enter') {
										setSearchFilter({ ...searchFilter, search: { ...searchFilter.search, text: searchText } });
									}
								}}
							/>
						</div>
						<label className={'ma-sort'}>
							<span>{t('Sort by')}</span>
							<select value={currentSort} onChange={(e) => sortingHandler(e.target.value)}>
								{sortOptions.map((item) => (
									<option value={item.id} key={item.id}>
										{t(item.label)}
									</option>
								))}
							</select>
						</label>
					</div>
				</div>

				{agents?.length === 0 ? (
					<div className={'ma-empty'}>{getAgentsLoading ? t('Loading...') : t('No sellers found')}</div>
				) : (
					<div className={'ma-grid ma-grid--4'}>
						{agents.map((agent: Member) => (
							<SellerCard dealer={agent} key={agent._id} onLike={(id) => likeMemberHandler(user, id)} />
						))}
					</div>
				)}

				{total > searchFilter.limit && (
					<div className={'ma-pagination'}>
						<Pagination
							page={currentPage}
							count={Math.ceil(total / searchFilter.limit)}
							onChange={paginationChangeHandler}
							shape="rounded"
						/>
					</div>
				)}
			</div>
		</div>
	);
};

AgentList.defaultProps = {
	initialInput: {
		page: 1,
		limit: 12,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withLayoutBasic(AgentList);
