import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { imageUrl } from '../../utils';

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
			className={'ma-lightbox'}
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
			<button className={'ma-lightbox__close'} onClick={onClose} aria-label={t('Close') as string}>
				<CloseIcon />
			</button>
			{images.length > 1 && (
				<button
					className={'ma-lightbox__nav ma-lightbox__nav--prev'}
					onClick={(e) => {
						e.stopPropagation();
						go(-1);
					}}
					aria-label={t('Previous photo') as string}
				>
					<ChevronLeftIcon />
				</button>
			)}
			<img src={imageUrl(images[index])} alt={alt ?? ''} onClick={(e) => e.stopPropagation()} />
			{images.length > 1 && (
				<button
					className={'ma-lightbox__nav ma-lightbox__nav--next'}
					onClick={(e) => {
						e.stopPropagation();
						go(1);
					}}
					aria-label={t('Next photo') as string}
				>
					<ChevronRightIcon />
				</button>
			)}
			<span className={'ma-lightbox__count'}>
				{index + 1} / {images.length}
			</span>
		</div>
	);
};

export default Lightbox;
