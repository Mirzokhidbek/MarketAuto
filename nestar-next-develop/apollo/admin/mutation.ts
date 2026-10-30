import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const UPDATE_MEMBER_BY_ADMIN = gql`
	mutation UpdateMemberByAdmin($input: MemberUpdate!) {
		updateMemberByAdmin(input: $input) {
			_id
			memberType
			memberStatus
			memberAdminRole
			memberBlockReason
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

/**************************
 *        PROPERTY        *
 *************************/

export const UPDATE_PROPERTY_BY_ADMIN = gql`
	mutation UpdatePropertyByAdmin($input: PropertyUpdate!) {
		updatePropertyByAdmin(input: $input) {
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
		}
	}
`;

export const REMOVE_PROPERTY_BY_ADMIN = gql`
	mutation RemovePropertyByAdmin($input: String!) {
		removePropertyByAdmin(propertyId: $input) {
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

export const UPDATE_BOARD_ARTICLE_BY_ADMIN = gql`
	mutation UpdateBoardArticleByAdmin($input: BoardArticleUpdate!) {
		updateBoardArticleByAdmin(input: $input) {
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

export const REMOVE_BOARD_ARTICLE_BY_ADMIN = gql`
	mutation RemoveBoardArticleByAdmin($input: String!) {
		removeBoardArticleByAdmin(articleId: $input) {
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

export const REMOVE_COMMENT_BY_ADMIN = gql`
	mutation RemoveCommentByAdmin($input: String!) {
		removeCommentByAdmin(commentId: $input) {
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
 *         NOTICE         *
 *************************/

export const CREATE_NOTICE = gql`
	mutation CreateNotice($input: NoticeInput!) {
		createNotice(input: $input) {
			_id
		}
	}
`;

export const UPDATE_NOTICE_BY_ADMIN = gql`
	mutation UpdateNoticeByAdmin($input: NoticeUpdate!) {
		updateNoticeByAdmin(input: $input) {
			_id
			noticeStatus
			noticeAnswer
		}
	}
`;

export const REMOVE_NOTICE_BY_ADMIN = gql`
	mutation RemoveNoticeByAdmin($input: String!) {
		removeNoticeByAdmin(noticeId: $input) {
			_id
		}
	}
`;

export const RESOLVE_REPORT = gql`
	mutation ResolveReport($input: ResolveReportInput!) {
		resolveReport(input: $input) {
			_id
			reportStatus
		}
	}
`;

export const BULK_MODERATE_BY_ADMIN = gql`
	mutation BulkModerateByAdmin($input: BulkModerationInput!) {
		bulkModerateByAdmin(input: $input)
	}
`;

export const UPDATE_SITE_SETTINGS = gql`
	mutation UpdateSiteSettings($input: SiteSettingsInput!) {
		updateSiteSettings(input: $input) {
			supportPhone
			supportEmail
			telegramUrl
			instagramUrl
			facebookUrl
		}
	}
`;

export const UPDATE_IMPORT_TARIFF = gql`
	mutation UpdateImportTariff($input: ImportTariffInput!) {
		updateImportTariff(input: $input) {
			updatedAt
		}
	}
`;
