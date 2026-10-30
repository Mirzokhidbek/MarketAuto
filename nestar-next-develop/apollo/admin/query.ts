import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const GET_ALL_MEMBERS_BY_ADMIN = gql`
	query GetAllMembersByAdmin($input: MembersInquiry!) {
		getAllMembersByAdmin(input: $input) {
			list {
				_id
				memberType
				memberStatus
				memberAdminRole
				memberBlockReason
				memberTrusted
				memberDealerVerified
				memberPhoneVerified
				memberAuthType
				memberPhone
				memberNick
				memberFullName
				memberImage
				memberAddress
				memberDesc
				memberProperties
				memberRank
				memberArticles
				memberLikes
				memberViews
				deletedAt
				createdAt
				updatedAt
				accessToken
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *        PROPERTY        *
 *************************/

export const GET_ALL_PROPERTIES_BY_ADMIN = gql`
	query GetAllPropertiesByAdmin($input: AllPropertiesInquiry!) {
		getAllPropertiesByAdmin(input: $input) {
			list {
				_id
				propertyType
				propertyStatus
				propertyRejectReason
				propertyLocation
				propertyAddress
				propertyTitle
				propertyPrice
				carBrand
				carModel
				carYear
				carMileage
				carFuel
				carTransmission
				carColor
				carEngine
				carTrim
				carCountry
				propertyViews
				propertyLikes
				propertyImages
				propertyDesc
				propertyBarter
				propertyNegotiable
				propertyPriceCurrency
				propertyPriceOriginal
				carVin
				carAccidentHistory
				carOwners
				carCustomsCleared
				carDeliveryDays
				carDeliveryCost
				memberId
				soldAt
				deletedAt
				createdAt
				updatedAt
				memberData {
					_id
					memberType
					memberStatus
					memberAuthType
					memberPhone
					memberNick
					memberFullName
					memberImage
					memberAddress
					memberDesc
					memberProperties
					memberRank
					memberLikes
					memberViews
					deletedAt
					createdAt
					updatedAt
					accessToken
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const GET_ALL_BOARD_ARTICLES_BY_ADMIN = gql`
	query GetAllBoardArticlesByAdmin($input: AllBoardArticlesInquiry!) {
		getAllBoardArticlesByAdmin(input: $input) {
			list {
				_id
				articleCategory
				articleStatus
				articleTitle
				articleContent
				articleImage
				articleViews
				articleLikes
				memberId
				createdAt
				updatedAt
				memberData {
					_id
					memberType
					memberStatus
					memberAuthType
					memberPhone
					memberNick
					memberFullName
					memberImage
					memberAddress
					memberDesc
					memberProperties
					memberRank
					memberLikes
					memberViews
					deletedAt
					createdAt
					updatedAt
					accessToken
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         COMMENT        *
 *************************/

export const GET_COMMENTS = gql`
	query GetComments($input: CommentsInquiry!) {
		getComments(input: $input) {
			list {
				_id
				commentStatus
				commentGroup
				commentContent
				commentRefId
				memberId
				createdAt
				updatedAt
				memberData {
					_id
					memberType
					memberStatus
					memberAuthType
					memberPhone
					memberNick
					memberFullName
					memberImage
					memberAddress
					memberDesc
					memberProperties
					memberRank
					memberLikes
					memberViews
					deletedAt
					createdAt
					updatedAt
					accessToken
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         NOTICE         *
 *************************/

export const GET_ALL_NOTICES_BY_ADMIN = gql`
	query GetAllNoticesByAdmin($input: NoticesInquiry!) {
		getAllNoticesByAdmin(input: $input) {
			list {
				_id
				noticeCategory
				noticeStatus
				noticeTitle
				noticeContent
				noticeAnswer
				createdAt
				memberData {
					_id
					memberNick
					memberPhone
					memberImage
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_DASHBOARD_STATS = gql`
	query GetDashboardStats($days: Int) {
		getDashboardStats(days: $days) {
			topSellers {
				memberId
				memberNick
				memberImage
				memberType
				cars
				views
				likes
			}
			membersTotal
			membersBlocked
			dealers
			membersToday
			carsActive
			carsSold
			carsDeleted
			carsToday
			articlesActive
			inquiriesWaiting
			carsPending
			reportsOpen
			daily {
				date
				members
				cars
			}
		}
	}
`;

export const GET_REPORTS_BY_ADMIN = gql`
	query GetReportsByAdmin($input: ReportsInquiry!) {
		getReportsByAdmin(input: $input) {
			list {
				_id
				reportReason
				reportComment
				reportStatus
				createdAt
				memberData {
					_id
					memberNick
				}
				propertyData {
					_id
					propertyTitle
					propertyPrice
					propertyImages
					propertyStatus
					memberId
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/** small query for the menu badges, polled */
export const GET_ADMIN_BADGES = gql`
	query GetAdminBadges {
		getDashboardStats {
			carsPending
			reportsOpen
			inquiriesWaiting
		}
	}
`;

export const GET_MEMBER_ADMIN_DETAIL = gql`
	query GetMemberAdminDetail($memberId: String!) {
		getMemberAdminDetail(memberId: $memberId) {
			carsActive
			carsPending
			carsRejected
			carsSold
			carsDeleted
			reportsAgainst
			reportsMade
			reviewsReceived
			conversations
			activeSessions
			member {
				_id
				memberType
				memberStatus
				memberAdminRole
				memberBlockReason
				memberTrusted
				memberDealerVerified
				memberPhoneVerified
				memberPhone
				memberNick
				memberFullName
				memberImage
				memberAddress
				memberDesc
				memberProperties
				memberArticles
				memberFollowers
				memberFollowings
				createdAt
			}
		}
	}
`;

export const GET_ADMIN_LOGS = gql`
	query GetAdminLogs($input: AdminLogsInquiry!) {
		getAdminLogs(input: $input) {
			list {
				_id
				action
				targetType
				targetId
				details
				createdAt
				adminData {
					_id
					memberNick
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_CONVERSATIONS_BY_ADMIN = gql`
	query GetConversationsByAdmin($memberId: String!, $input: OrdinaryInquiry!) {
		getConversationsByAdmin(memberId: $memberId, input: $input) {
			list {
				_id
				propertyId
				lastMessage
				lastMessageAt
				otherMember {
					_id
					memberNick
					memberFullName
					memberImage
				}
				propertyData {
					_id
					propertyTitle
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MESSAGES_BY_ADMIN = gql`
	query GetMessagesByAdmin($input: MessagesInquiry!) {
		getMessagesByAdmin(input: $input) {
			list {
				_id
				senderId
				text
				image
				createdAt
			}
		}
	}
`;

/** the bell panel: the oldest waiting work of each kind (they have waited longest) */
export const GET_ADMIN_WAITING = gql`
	query GetAdminWaiting($cars: AllPropertiesInquiry!, $reports: ReportsInquiry!, $inquiries: NoticesInquiry!) {
		getAllPropertiesByAdmin(input: $cars) {
			list {
				_id
				propertyTitle
				propertyImages
				createdAt
				memberData {
					memberNick
				}
			}
		}
		getReportsByAdmin(input: $reports) {
			list {
				_id
				reportReason
				createdAt
				memberData {
					memberNick
				}
				propertyData {
					_id
					propertyTitle
					propertyImages
				}
			}
		}
		getAllNoticesByAdmin(input: $inquiries) {
			list {
				_id
				noticeTitle
				createdAt
				memberData {
					memberNick
					memberImage
				}
			}
		}
	}
`;

/** rules of the import cost estimate (public query, edited by super admins) */
export const GET_IMPORT_TARIFF = gql`
	query GetImportTariff {
		getImportTariff {
			vatPercent
			electricDutyPercent
			baseAmountUzs
			clearanceUsd
			defaultEngineCc
			duty {
				maxAgeYears
				maxEngineCc
				percent
				usdPerCc
				excisePercent
			}
			utilization {
				group
				maxAgeYears
				maxEngineCc
				baseAmounts
			}
			shipping {
				country
				costUsd
				days
			}
			updatedAt
		}
	}
`;
