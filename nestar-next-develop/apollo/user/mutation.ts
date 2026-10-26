import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const SIGN_UP = gql`
	mutation Signup($input: MemberInput!) {
		signup(input: $input) {
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
			memberArticles
			memberLikes
			memberViews
			deletedAt
			createdAt
			updatedAt
			accessToken
			refreshToken
		}
	}
`;

export const LOGIN = gql`
	mutation Login($input: LoginInput!) {
		login(input: $input) {
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
			refreshToken
			twoFactorRequired
			devCode
		}
	}
`;

export const VERIFY_ADMIN_LOGIN = gql`
	mutation VerifyAdminLogin($input: AdminCodeInput!) {
		verifyAdminLogin(input: $input) {
			_id
			memberType
			accessToken
			refreshToken
		}
	}
`;

export const UPDATE_MEMBER = gql`
	mutation UpdateMember($input: MemberUpdate!) {
		updateMember(input: $input) {
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
			memberArticles
			memberLikes
			memberViews
			deletedAt
			createdAt
			updatedAt
			accessToken
		}
	}
`;

export const LIKE_TARGET_MEMBER = gql`
	mutation LikeTargetMember($input: String!) {
		likeTargetMember(memberId: $input) {
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
`;

/**************************
 *        PROPERTY        *
 *************************/

export const CREATE_PROPERTY = gql`
	mutation CreateProperty($input: PropertyInput!) {
		createProperty(input: $input) {
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
	}
`;

export const UPDATE_PROPERTY = gql`
	mutation UpdateProperty($input: PropertyUpdate!) {
		updateProperty(input: $input) {
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
	}
`;

export const LIKE_TARGET_PROPERTY = gql`
	mutation LikeTargetProperty($input: String!) {
		likeTargetProperty(propertyId: $input) {
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
	}
`;

/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const CREATE_BOARD_ARTICLE = gql`
	mutation CreateBoardArticle($input: BoardArticleInput!) {
		createBoardArticle(input: $input) {
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
		}
	}
`;

export const UPDATE_BOARD_ARTICLE = gql`
	mutation UpdateBoardArticle($input: BoardArticleUpdate!) {
		updateBoardArticle(input: $input) {
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
		}
	}
`;

export const LIKE_TARGET_BOARD_ARTICLE = gql`
	mutation LikeTargetBoardArticle($input: String!) {
		likeTargetBoardArticle(articleId: $input) {
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
		}
	}
`;

/**************************
 *         COMMENT        *
 *************************/

export const CREATE_COMMENT = gql`
	mutation CreateComment($input: CommentInput!) {
		createComment(input: $input) {
			_id
			commentStatus
			commentGroup
			commentContent
			commentRefId
			memberId
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_COMMENT = gql`
	mutation UpdateComment($input: CommentUpdate!) {
		updateComment(input: $input) {
			_id
			commentStatus
			commentGroup
			commentContent
			commentRefId
			memberId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *         FOLLOW        *
 *************************/

export const SUBSCRIBE = gql`
	mutation Subscribe($input: String!) {
		subscribe(input: $input) {
			_id
			followingId
			followerId
			createdAt
			updatedAt
		}
	}
`;

export const UNSUBSCRIBE = gql`
	mutation Unsubscribe($input: String!) {
		unsubscribe(input: $input) {
			_id
			followingId
			followerId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *   PASSWORD / NOTIFY    *
 *************************/

export const CHANGE_PASSWORD = gql`
	mutation ChangePassword($input: PasswordInput!) {
		changePassword(input: $input) {
			_id
			accessToken
		}
	}
`;

export const MARK_NOTIFICATIONS_READ = gql`
	mutation MarkNotificationsRead {
		markNotificationsRead
	}
`;

export const CREATE_INQUIRY = gql`
	mutation CreateInquiry($input: InquiryInput!) {
		createInquiry(input: $input) {
			_id
			noticeTitle
			noticeStatus
			createdAt
		}
	}
`;

/**************************
 *   PHONE / SESSION      *
 *************************/

export const REQUEST_PHONE_CODE = gql`
	mutation RequestPhoneCode($input: PhoneCodeInput!) {
		requestPhoneCode(input: $input) {
			sent
			expiresIn
			devCode
		}
	}
`;

export const RESET_PASSWORD = gql`
	mutation ResetPassword($input: ResetPasswordInput!) {
		resetPassword(input: $input) {
			_id
			accessToken
			refreshToken
		}
	}
`;

export const CHANGE_PHONE = gql`
	mutation ChangePhone($input: ChangePhoneInput!) {
		changePhone(input: $input) {
			_id
			memberPhone
			accessToken
		}
	}
`;

/**************************
 *  REPORT / SAVED SEARCH *
 *************************/

export const REPORT_PROPERTY = gql`
	mutation ReportProperty($input: ReportInput!) {
		reportProperty(input: $input) {
			_id
		}
	}
`;

export const SAVE_SEARCH = gql`
	mutation SaveSearch($input: SavedSearchInput!) {
		saveSearch(input: $input) {
			_id
			title
			search
		}
	}
`;

export const REMOVE_SAVED_SEARCH = gql`
	mutation RemoveSavedSearch($id: String!) {
		removeSavedSearch(id: $id)
	}
`;

/**************************
 *        MESSAGES        *
 *************************/

export const SEND_MESSAGE = gql`
	mutation SendMessage($input: SendMessageInput!) {
		sendMessage(input: $input) {
			_id
			conversationId
			senderId
			text
			image
			createdAt
		}
	}
`;

export const LOGIN_WITH_CODE = gql`
	mutation LoginWithCode($input: CodeLoginInput!) {
		loginWithCode(input: $input) {
			_id
			memberType
			accessToken
			refreshToken
		}
	}
`;
