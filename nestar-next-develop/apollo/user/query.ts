import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const GET_AGENTS = gql`
	query GetAgents($input: AgentsInquiry!) {
		getAgents(input: $input) {
			list {
				_id
				memberType
				memberPhoneVerified
				memberDealerVerified
				memberResponseMinutes
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
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MEMBER = gql(`
  query GetMember($input: String!) {
    getMember(memberId: $input) {
        _id
        memberType
        memberStatus
        memberPhoneVerified
        memberDealerVerified
        memberResponseMinutes
        memberAuthType
        memberPhone
        memberNick
        memberFullName
        memberImage
        memberAddress
        memberDesc
        memberProperties
        memberArticles
        memberComments
        memberLikes
        memberViews
        memberFollowings
				memberFollowers
        memberRank
        deletedAt
        createdAt
        updatedAt
        accessToken
        meFollowed {
					followingId
					followerId
					myFollowing
				}
    }
}
`);

/**************************
 *        PROPERTY        *
 *************************/

export const GET_PROPERTY = gql`
	query GetProperty($input: String!) {
		getProperty(propertyId: $input) {
			_id
			propertyType
			propertyStatus
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
				memberPhoneVerified
				memberDealerVerified
				memberResponseMinutes
				memberStatus
				memberAuthType
				memberPhone
				memberNick
				memberFullName
				memberImage
				memberAddress
				memberDesc
				memberLikes
				memberViews
				deletedAt
				createdAt
				updatedAt
				accessToken
			}
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
		}
	}
`;

export const GET_PROPERTIES = gql`
	query GetProperties($input: PropertiesInquiry!) {
		getProperties(input: $input) {
			list {
				_id
				propertyType
				propertyStatus
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
				propertyRank
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
				}
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_AGENT_PROPERTIES = gql`
	query GetAgentProperties($input: AgentPropertiesInquiry!) {
		getAgentProperties(input: $input) {
			list {
				_id
				propertyType
				propertyStatus
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
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_FAVORITES = gql`
	query GetFavorites($input: OrdinaryInquiry!) {
		getFavorites(input: $input) {
			list {
				_id
				propertyType
				propertyStatus
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
				propertyComments
				propertyRank
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
					memberArticles
					memberLikes
					memberViews
					memberComments
					memberFollowings
					memberFollowers
					memberRank
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

export const GET_VISITED = gql`
	query GetVisited($input: OrdinaryInquiry!) {
		getVisited(input: $input) {
			list {
				_id
				propertyType
				propertyStatus
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
				propertyComments
				propertyRank
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
					memberArticles
					memberLikes
					memberViews
					memberComments
					memberFollowings
					memberFollowers
					memberRank
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

export const GET_BOARD_ARTICLE = gql`
	query GetBoardArticle($input: String!) {
		getBoardArticle(articleId: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			articleComments
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
			}
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
		}
	}
`;

export const GET_BOARD_ARTICLES = gql`
	query GetBoardArticles($input: BoardArticlesInquiry!) {
		getBoardArticles(input: $input) {
			list {
				_id
				articleCategory
				articleStatus
				articleTitle
				articleContent
				articleImage
				articleViews
				articleLikes
				articleComments
				memberId
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
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
 *         FOLLOW        *
 *************************/
export const GET_MEMBER_FOLLOWERS = gql`
	query GetMemberFollowers($input: FollowInquiry!) {
		getMemberFollowers(input: $input) {
			list {
				_id
				followingId
				followerId
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				meFollowed {
					followingId
					followerId
					myFollowing
				}
				followerData {
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
					memberArticles
					memberLikes
					memberViews
					memberComments
					memberFollowings
					memberFollowers
					memberRank
					deletedAt
					createdAt
					updatedAt
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MEMBER_FOLLOWINGS = gql`
	query GetMemberFollowings($input: FollowInquiry!) {
		getMemberFollowings(input: $input) {
			list {
				_id
				followingId
				followerId
				createdAt
				updatedAt
				followingData {
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
					memberArticles
					memberLikes
					memberViews
					memberComments
					memberFollowings
					memberFollowers
					memberRank
					deletedAt
					createdAt
					updatedAt
					accessToken
				}
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				meFollowed {
					followingId
					followerId
					myFollowing
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *  NOTIFICATION / NOTICE *
 *************************/

export const GET_NOTIFICATIONS = gql`
	query GetNotifications($input: OrdinaryInquiry!) {
		getNotifications(input: $input) {
			unreadCount
			list {
				_id
				notificationType
				notificationStatus
				notificationGroup
				notificationTitle
				authorId
				propertyId
				articleId
				createdAt
				authorData {
					_id
					memberNick
					memberFullName
					memberImage
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_NOTICES = gql`
	query GetNotices($input: NoticesInquiry!) {
		getNotices(input: $input) {
			list {
				_id
				noticeCategory
				noticeTitle
				noticeContent
				createdAt
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MY_INQUIRIES = gql`
	query GetMyInquiries($input: NoticesInquiry!) {
		getMyInquiries(input: $input) {
			list {
				_id
				noticeStatus
				noticeTitle
				noticeContent
				noticeAnswer
				createdAt
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *   RATE / MODELS / LISTS *
 *************************/

export const GET_EXCHANGE_RATE = gql`
	query GetExchangeRate {
		getExchangeRate {
			usdToUzs
			updatedAt
			source
		}
	}
`;

export const GET_CAR_MODELS = gql`
	query GetCarModels($brand: CarBrand!) {
		getCarModels(brand: $brand)
	}
`;

export const GET_SAVED_SEARCHES = gql`
	query GetSavedSearches {
		getSavedSearches {
			_id
			title
			search
			lastNotifiedAt
			createdAt
		}
	}
`;

/**************************
 *        MESSAGES        *
 *************************/

export const GET_CONVERSATIONS = gql`
	query GetConversations($input: OrdinaryInquiry!) {
		getConversations(input: $input) {
			list {
				_id
				propertyId
				lastMessage
				lastSenderId
				lastMessageAt
				unreadCount
				otherMember {
					_id
					memberNick
					memberFullName
					memberImage
					memberType
				}
				propertyData {
					_id
					propertyTitle
					propertyPrice
					propertyPriceCurrency
					propertyPriceOriginal
					propertyImages
					propertyStatus
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MESSAGES = gql`
	query GetMessages($input: MessagesInquiry!) {
		getMessages(input: $input) {
			list {
				_id
				conversationId
				senderId
				text
				image
				readAt
				createdAt
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_UNREAD_MESSAGES_COUNT = gql`
	query GetUnreadMessagesCount {
		getUnreadMessagesCount
	}
`;

export const GET_PRICE_ESTIMATE = gql`
	query GetPriceEstimate($propertyId: String!) {
		getPriceEstimate(propertyId: $propertyId) {
			average
			count
			verdict
		}
	}
`;
