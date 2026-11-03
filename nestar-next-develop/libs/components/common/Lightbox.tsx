import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { imageUrl } from '../../utils';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from '../ui/icons';

interface LightboxProps {
	images: string[];
	index: number;
	onIndex: (index: number) => void;
	onClose: () => void;
	alt?: string;
}

/** full-screen photo viewer: arrows / keyboard / swipe, Esc or background click closes */
const Lightbox = ({ images, index, onIndex, onClose, alt }: LightboxProps) => {
	const { t } = useTranslation('common');
	const touchX = useRef<number | null>(null);
	const go = (step: number) => onIndex((index + step + images.length) % images.length);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
			if (e.key === 'ArrowRight') go(1);
			if (e.key === 'ArrowLeft') go(-1);
		};
		window.addEventListener('keydown', onKey);
		document.body.style.overflow = 'hidden';
		return () => {
			window.removeEventListener('keydown', onKey);
			document.body.style.overflow = '';
		};
	}, [index]);

	return (
		<div
			className="fixed inset-0 z-[2000] flex items-center justify-center bg-[rgba(2,6,23,0.94)]"
			role={'dialog'}
			aria-modal
			onClick={onClose}
			onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
			onTouchEnd={(e) => {
				if (touchX.current === null) return;
				const delta = e.changedTouches[0].clientX - touchX.current;
				if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
				touchX.current = null;
			}}
		>
			<button className="absolute inline-flex cursor-pointer items-center justify-center rounded-full border-0 bg-white/12 text-white hover:bg-white/24 top-[18px] right-[18px] size-11 [&_svg]:text-2xl" onClick={onClose} aria-label={t('Close') as string}>
				<CloseIcon />
			</button>
			{images.length > 1 && (
				<button
					className="absolute inline-flex cursor-pointer items-center justify-center rounded-full border-0 bg-white/12 text-white hover:bg-white/24 top-1/2 left-[18px] size-[52px] -translate-y-1/2 max-sm:hidden [&_svg]:text-[32px]"
					onClick={(e) => {
						e.stopPropagation();
						go(-1);
					}}
					aria-label={t('Previous photo') as string}
				>
					<ChevronLeftIcon />
				</button>
			)}
			<img
				src={imageUrl(images[index])}
				alt={alt ?? ''}
				className="max-h-[86vh] max-w-[92vw] rounded-lg object-contain select-none"
				onClick={(e) => e.stopPropagation()}
			/>
			{images.length > 1 && (
				<button
					className="absolute inline-flex cursor-pointer items-center justify-center rounded-full border-0 bg-white/12 text-white hover:bg-white/24 top-1/2 right-[18px] size-[52px] -translate-y-1/2 max-sm:hidden [&_svg]:text-[32px]"
					onClick={(e) => {
						e.stopPropagation();
						go(1);
					}}
					aria-label={t('Next photo') as string}
				>
					<ChevronRightIcon />
				</button>
			)}
			<span className="absolute bottom-[22px] text-sm text-[#e2e8f0]">
				{index + 1} / {images.length}
			</span>
		</div>
	);
};

export default Lightbox;
