import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { useMutation } from '@apollo/client/react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { imageUrl } from '../../utils';
import { uploadImage } from '../../upload';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { CREATE_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { Message } from '../../enums/common.enum';
import { sweetErrorHandling, sweetTopSuccessAlert } from '../../sweetAlert';

const toolButton =
	'inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent px-2 text-sm font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-40 data-[on=true]:bg-primary-soft data-[on=true]:text-primary';

/** writing an article: title, category and a rich text body (HTML, cleaned again by the API on save) */
const ArticleEditor = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const [articleCategory, setArticleCategory] = useState<BoardArticleCategory>(BoardArticleCategory.FREE);
	const [articleTitle, setArticleTitle] = useState('');
	const [articleImage, setArticleImage] = useState('');
	const [uploading, setUploading] = useState(false);
	const [createBoardArticle, { loading: saving }] = useMutation<any>(CREATE_BOARD_ARTICLE);

	const editor = useEditor({
		extensions: [StarterKit.configure({ link: { openOnClick: false } }), Image],
		immediatelyRender: false,
		editorProps: {
			attributes: {
				class: 'ma-prose min-h-[360px] px-4 py-3 outline-none',
				'aria-label': t('Write your article here...') as string,
			},
		},
	});
	// re-render the toolbar when the selection changes (active marks)
	const marks = useEditorState({
		editor,
		selector: ({ editor: e }) => ({
			bold: !!e?.isActive('bold'),
			italic: !!e?.isActive('italic'),
			strike: !!e?.isActive('strike'),
			h2: !!e?.isActive('heading', { level: 2 }),
			h3: !!e?.isActive('heading', { level: 3 }),
			bullet: !!e?.isActive('bulletList'),
			ordered: !!e?.isActive('orderedList'),
			quote: !!e?.isActive('blockquote'),
			link: !!e?.isActive('link'),
		}),
	});

	const addImage = async (file?: File) => {
		if (!file || !editor) return;
		try {
			setUploading(true);
			const path = await uploadImage(file, 'article');
			// the first picture becomes the article cover
			if (!articleImage) setArticleImage(path);
			editor.chain().focus().setImage({ src: imageUrl(path) }).run();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		} finally {
			setUploading(false);
		}
	};

	const addLink = () => {
		if (!editor) return;
		const previous = editor.getAttributes('link').href as string | undefined;
		const url = window.prompt(t('Link') as string, previous ?? 'https://');
		if (url === null) return;
		if (!url.trim()) editor.chain().focus().unsetLink().run();
		else if (/^https?:\/\//i.test(url.trim())) editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
	};

	const publishHandler = async () => {
		try {
			const articleContent = editor?.getHTML() ?? '';
			// an empty editor still returns "<p></p>": check the text, and both fields must be filled
			if (!articleTitle.trim() || !editor?.getText().trim()) throw new Error(Message.INSERT_ALL_INPUTS);
			await createBoardArticle({
				variables: { input: { articleTitle, articleContent, articleImage, articleCategory } },
			});
			await sweetTopSuccessAlert(t('Article published successfully') as string, 700);
			await router.push({ pathname: '/mypage', query: { category: 'myArticles' } });
		} catch (err: any) {
			// show the real reason (empty fields, text too long, not logged in, ...)
			sweetErrorHandling(new Error(err?.errors?.[0]?.message ?? err?.message ?? Message.INSERT_ALL_INPUTS)).then();
		}
	};

	const tools: { label: string; text: string; on?: boolean; run: () => void }[] = editor
		? [
				{ label: 'Heading', text: 'H2', on: marks?.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
				{ label: 'Subheading', text: 'H3', on: marks?.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
				{ label: 'Bold', text: 'B', on: marks?.bold, run: () => editor.chain().focus().toggleBold().run() },
				{ label: 'Italic', text: 'I', on: marks?.italic, run: () => editor.chain().focus().toggleItalic().run() },
				{ label: 'Strikethrough', text: 'S', on: marks?.strike, run: () => editor.chain().focus().toggleStrike().run() },
				{ label: 'Bulleted list', text: '•', on: marks?.bullet, run: () => editor.chain().focus().toggleBulletList().run() },
				{ label: 'Numbered list', text: '1.', on: marks?.ordered, run: () => editor.chain().focus().toggleOrderedList().run() },
				{ label: 'Quote', text: '❝', on: marks?.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
				{ label: 'Link', text: '🔗', on: marks?.link, run: addLink },
		  ]
		: [];

	return (
		<div className={'flex flex-col gap-4 font-sans'}>
			<div className={'grid grid-cols-1 gap-4 sm:grid-cols-2'}>
				<label className={'flex flex-col gap-1.5 text-sm font-medium text-ink'}>
					{t('Category')}
					<select
						className={'h-12 rounded-xl border border-line bg-surface px-3 text-base'}
						value={articleCategory}
						onChange={(e) => setArticleCategory(e.target.value as BoardArticleCategory)}
					>
						<option value={BoardArticleCategory.NEWS}>{t('Car News')}</option>
						<option value={BoardArticleCategory.RECOMMEND}>{t('Reviews & Tips')}</option>
						<option value={BoardArticleCategory.FREE}>{t('Free Talk')}</option>
						<option value={BoardArticleCategory.SERVICE}>{t('Repair & Service')}</option>
					</select>
				</label>
				<label className={'flex flex-col gap-1.5 text-sm font-medium text-ink'}>
					{t('Title')}
					<input
						className={'h-12 rounded-xl border border-line bg-surface px-3 text-base'}
						type="text"
						value={articleTitle}
						placeholder={t('Article title') as string}
						onChange={(e) => setArticleTitle(e.target.value)}
					/>
				</label>
			</div>

			<div className={'overflow-hidden rounded-xl border border-line bg-white'}>
				<div className={'flex flex-wrap items-center gap-1 border-b border-line p-1.5'} role={'toolbar'}>
					{tools.map((tool) => (
						<button
							key={tool.label}
							type={'button'}
							className={toolButton}
							data-on={!!tool.on}
							title={t(tool.label) as string}
							aria-label={t(tool.label) as string}
							aria-pressed={!!tool.on}
							onClick={tool.run}
						>
							{tool.text}
						</button>
					))}
					<label className={`${toolButton} cursor-pointer`} title={t('Insert image') as string}>
						{uploading ? '…' : '🖼'}
						<input
							type={'file'}
							accept={'image/jpeg,image/png,image/webp'}
							className={'hidden'}
							onChange={(e) => {
								addImage(e.target.files?.[0]);
								e.target.value = '';
							}}
						/>
					</label>
				</div>
				<EditorContent editor={editor} />
			</div>

			<div className={'flex justify-end'}>
				<button
					className={'h-12 rounded-xl bg-primary px-6 font-semibold text-white disabled:opacity-60'}
					disabled={saving || uploading}
					onClick={publishHandler}
				>
					{t('Publish article')}
				</button>
			</div>
		</div>
	);
};

export default ArticleEditor;
