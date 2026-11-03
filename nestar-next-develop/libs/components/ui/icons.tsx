import React from 'react';
import * as L from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';

/**
 * Every icon of the site, drawn with lucide-react under the names the code already uses.
 * Icons are 1em × 1em like the old MUI icons, so a parent's font-size sets their size;
 * `fontSize="small" | "inherit"` and `sx={{ fontSize }}` keep working.
 */
type IconProps = Omit<LucideProps, 'fontSize'> & {
	fontSize?: 'small' | 'medium' | 'large' | 'inherit' | string;
	sx?: { fontSize?: string | number };
};

const SIZES: Record<string, string> = { small: '1.25rem', medium: '1.5rem', large: '2.1875rem', inherit: 'inherit' };

const make = (Icon: LucideIcon, filled = false) => {
	const Component = ({ fontSize, sx, size, style, className, ...rest }: IconProps) => {
		const font = fontSize ? (SIZES[fontSize] ?? fontSize) : sx?.fontSize;
		return (
			<Icon
				width={size ?? '1em'}
				height={size ?? '1em'}
				aria-hidden={true}
				focusable={false}
				fill={filled ? 'currentColor' : 'none'}
				className={`ma-icon ${className ?? ''}`}
				style={font !== undefined ? { fontSize: font, ...style } : style}
				{...rest}
			/>
		);
	};
	Component.displayName = `Icon(${Icon.displayName ?? 'lucide'})`;
	return Component;
};

/** brand marks are not in lucide: simple 24×24 outlines */
const brand = (name: string, path: React.ReactNode) => {
	const Component = ({ fontSize, sx, size, style, className, strokeWidth = 2, ...rest }: IconProps) => {
		const font = fontSize ? (SIZES[fontSize] ?? fontSize) : sx?.fontSize;
		return (
			<svg
				viewBox="0 0 24 24"
				width={size ?? '1em'}
				height={size ?? '1em'}
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden={true}
				focusable={false}
				className={`ma-icon ${className ?? ''}`}
				style={font !== undefined ? { fontSize: font, ...style } : style}
				{...(rest as React.SVGProps<SVGSVGElement>)}
			>
				{path}
			</svg>
		);
	};
	Component.displayName = `Icon(${name})`;
	return Component;
};

export const InstagramIcon = brand(
	'Instagram',
	<>
		<rect x="2" y="2" width="20" height="20" rx="5" />
		<circle cx="12" cy="12" r="4" />
		<line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
	</>,
);
export const FacebookIcon = brand('Facebook', <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />);
export const TelegramIcon = brand('Telegram', <path d="M21.5 4.5 2.5 11.8l6.2 2.3 2.4 7.2 3.5-4.6 5.2 3.8z M8.7 14.1l10.8-7.6" />);

// cars, browsing, actions
export const SearchIcon = make(L.Search);
export const CarIcon = make(L.Car);
export const CarFilledIcon = make(L.CarFront);
export const FavoriteBorderIcon = make(L.Heart);
export const FavoriteIcon = make(L.Heart, true);
export const CompareArrowsIcon = make(L.ArrowLeftRight);
export const ShareIcon = make(L.Share2);
export const TuneIcon = make(L.SlidersHorizontal);
export const ManageSearchIcon = make(L.TextSearch);
export const PublicIcon = make(L.Globe);
export const SpeedIcon = make(L.Gauge);
export const FuelIcon = make(L.Fuel);
export const EngineIcon = make(L.Cog);
export const SellIcon = make(L.Tag);
export const StorefrontIcon = make(L.Store);
export const TrendingDownIcon = make(L.TrendingDown);
export const CalendarIcon = make(L.Calendar);
export const EventAvailableIcon = make(L.CalendarCheck);
export const ScheduleIcon = make(L.Clock);
export const HistoryIcon = make(L.History);
export const EyeIcon = make(L.Eye);
export const InfoIcon = make(L.Info);
export const LightbulbIcon = make(L.Lightbulb);
export const StarIcon = make(L.Star);

// navigation
export const ArrowBackIcon = make(L.ArrowLeft);
export const ChevronLeftIcon = make(L.ChevronLeft);
export const ChevronRightIcon = make(L.ChevronRight);
export const ChevronDownIcon = make(L.ChevronDown);
export const MenuIcon = make(L.Menu);
export const CloseIcon = make(L.X);
export const HomeIcon = make(L.House);

// people, account
export const PersonIcon = make(L.User);
export const PersonAddIcon = make(L.UserPlus);
export const GroupIcon = make(L.Users);
export const AccountCircleIcon = make(L.CircleUser);
export const VerifiedIcon = make(L.BadgeCheck);
export const VerifiedUserIcon = make(L.ShieldCheck);
export const AdminIcon = make(L.ShieldUser);
export const SettingsIcon = make(L.Settings);
export const LogoutIcon = make(L.LogOut);
export const LockResetIcon = make(L.KeyRound);

// messages, notifications
export const ChatIcon = make(L.MessageSquare);
export const ChatFilledIcon = make(L.MessageSquare, true);
export const ForumIcon = make(L.MessagesSquare);
export const RateReviewIcon = make(L.MessageSquareText);
export const SendIcon = make(L.Send);
export const MailIcon = make(L.Mail);
export const PhoneIcon = make(L.Phone);
export const SmartphoneIcon = make(L.Smartphone);
export const BellIcon = make(L.Bell);
export const BellFilledIcon = make(L.Bell, true);
export const BellRingIcon = make(L.BellRing);
export const SupportAgentIcon = make(L.Headset);
export const HelpIcon = make(L.CircleHelp);
export const AttachFileIcon = make(L.Paperclip);

// content
export const ArticleIcon = make(L.FileText);
export const EditIcon = make(L.Pencil);
export const EditNoteIcon = make(L.NotebookPen);
export const ThumbUpIcon = make(L.ThumbsUp);
export const ThumbUpFilledIcon = make(L.ThumbsUp, true);
export const FlagIcon = make(L.Flag);
export const ReportIcon = make(L.TriangleAlert);
export const CloudUploadIcon = make(L.CloudUpload);
export const ComputerIcon = make(L.Monitor);

// states, small actions
export const AddIcon = make(L.Plus);
export const AddCircleIcon = make(L.CirclePlus);
export const DeleteIcon = make(L.Trash2);
export const DeleteSweepIcon = make(L.Trash);
export const DoneIcon = make(L.Check);
export const DoneAllIcon = make(L.CheckCheck);
export const CheckCircleIcon = make(L.CircleCheck);
export const CancelIcon = make(L.CircleX);
export const ErrorIcon = make(L.CircleAlert);
export const RadioUncheckedIcon = make(L.Circle);

// admin menu
export const ChartIcon = make(L.ChartColumn);
export const MegaphoneIcon = make(L.Megaphone);
export const ChatDotsIcon = make(L.MessageCircleMore);
export const ListChecksIcon = make(L.ListChecks);
export const CalculatorIcon = make(L.Calculator);
