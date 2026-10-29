import { imageUrl } from '../../utils';
import { useTranslation } from 'next-i18next';
import React, { useMemo, useRef, useState } from 'react';
import { Box, Button, FormControl, MenuItem, Stack, Typography, Select, TextField } from '@mui/material';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { Editor } from '@toast-ui/react-editor';
import { getFreshToken } from '../../auth';
import { REACT_APP_API_URL } from '../../config';
import { useRouter } from 'next/router';
import axios from 'axios';
import { T } from '../../types/common';
import '@toast-ui/editor/dist/toastui-editor.css';
import { editorLanguage } from './editorLanguages';
import { CREATE_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { useMutation } from '@apollo/client';
import { Message } from '../../enums/common.enum';
import { sweetErrorHandling, sweetTopSuccessAlert } from '../../sweetAlert';

const TuiEditor = () => {
	const { t } = useTranslation('common');
	const editorRef = useRef<Editor>(null),
		router = useRouter();
	const [articleCategory, setArticleCategory] = useState<BoardArticleCategory>(BoardArticleCategory.FREE);

	/** APOLLO REQUESTS **/
	const [createBoardArticle] = useMutation(CREATE_BOARD_ARTICLE);

	const memoizedValues = useMemo(() => {
		const articleTitle = '',
			articleContent = '',
			articleImage = '';

		return { articleTitle, articleContent, articleImage };
	}, []);

	/** HANDLERS **/
	const uploadImage = async (image: any) => {
		try {
			const formData = new FormData();
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImageUploader($file: Upload!, $target: String!) {
						imageUploader(file: $file, target: $target) 
				  }`,
					variables: {
						file: null,
						target: 'article',
					},
				}),
			);
			formData.append(
				'map',
				JSON.stringify({
					'0': ['variables.file'],
				}),
			);
			formData.append('0', image);

			const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${await getFreshToken()}`,
				},
			});

			if (response.data?.errors?.length) throw new Error(response.data.errors[0].message);
			const responseImage = response.data.data.imageUploader;
			memoizedValues.articleImage = responseImage;

			return imageUrl(responseImage);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const changeCategoryHandler = (e: any) => {
		setArticleCategory(e.target.value);
	};

	const articleTitleHandler = (e: T) => {
		memoizedValues.articleTitle = e.target.value;
	};

	const handleRegisterButton = async () => {
		try {
			const instance = editorRef.current?.getInstance();
			memoizedValues.articleContent = (instance?.getHTML() as string) ?? '';

			// an empty editor still returns "<p><br></p>": check the text, and both fields must be filled
			const hasText = !!instance?.getMarkdown()?.trim();
			if (!memoizedValues.articleTitle.trim() || !hasText) {
				throw new Error(Message.INSERT_ALL_INPUTS);
			}

			await createBoardArticle({
				variables: {
					input: { ...memoizedValues, articleCategory },
				},
			});

			await sweetTopSuccessAlert(t('Article published successfully') as string, 700);
			await router.push({
				pathname: '/mypage',
				query: {
					category: 'myArticles',
				},
			});
		} catch (err: any) {
			// show the real reason (empty fields, text too long, not logged in, ...)
			sweetErrorHandling(new Error(err?.graphQLErrors?.[0]?.message ?? err?.message ?? Message.INSERT_ALL_INPUTS)).then();
		}
	};

	const doDisabledCheck = () => {
		if (memoizedValues.articleContent === '' || memoizedValues.articleTitle === '') {
			return true;
		}
	};

	return (
		<div className={'ma-editor'}>
			<div className={'ma-form-grid'}>
				<label className={'ma-input'}>
					<span>{t('Category')}</span>
					<select value={articleCategory} onChange={changeCategoryHandler as any}>
						<option value={BoardArticleCategory.NEWS}>{t('Car News')}</option>
						<option value={BoardArticleCategory.RECOMMEND}>{t('Reviews & Tips')}</option>
						<option value={BoardArticleCategory.FREE}>{t('Free Talk')}</option>
						<option value={BoardArticleCategory.SERVICE}>{t('Repair & Service')}</option>
					</select>
				</label>
				<label className={'ma-input'}>
					<span>{t('Title')}</span>
					<input type="text" placeholder={t('Article title') as string} onChange={articleTitleHandler as any} />
				</label>
			</div>

			<Editor
				language={editorLanguage(router.locale)}
				initialValue={''}
				placeholder={t('Write your article here...') as string}
				previewStyle={'vertical'}
				height={'520px'}
				// @ts-ignore
				initialEditType={'WYSIWYG'}
				toolbarItems={[
					['heading', 'bold', 'italic', 'strike'],
					['image', 'table', 'link'],
					['ul', 'ol', 'task'],
				]}
				ref={editorRef}
				hooks={{
					addImageBlobHook: async (image: any, callback: any) => {
						const uploadedImageURL = await uploadImage(image);
						callback(uploadedImageURL);
						return false;
					},
				}}
				events={{
					load: function (param: any) {},
				}}
			/>

			<div className={'ma-form-actions'}>
				<button className={'ma-btn ma-btn--primary'} onClick={handleRegisterButton}>
					{t('Publish article')}
				</button>
			</div>
		</div>
	);
};

export default TuiEditor;
