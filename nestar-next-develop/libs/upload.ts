import { getFreshToken } from './auth';

export type UploadTarget = 'member' | 'property' | 'article' | 'message';

/** sends a GraphQL multipart request (graphql-multipart-request-spec) and returns `data[field]` */
const postMultipart = async <R>(field: string, query: string, variables: object, files: File[], map: object): Promise<R> => {
	const formData = new FormData();
	formData.append('operations', JSON.stringify({ query, variables }));
	formData.append('map', JSON.stringify(map));
	files.forEach((file, index) => formData.append(String(index), file));
	// the browser sets the multipart boundary itself, so no Content-Type here
	const response = await fetch(`${process.env.REACT_APP_API_GRAPHQL_URL}`, {
		method: 'POST',
		body: formData,
		headers: { 'apollo-require-preflight': 'true', Authorization: `Bearer ${await getFreshToken()}` },
	});
	const body = await response.json().catch(() => null);
	if (body?.errors?.length) throw new Error(body.errors[0].message);
	if (!response.ok || !body?.data) throw new Error(`Upload failed (${response.status})`);
	return body.data[field] as R;
};

/** uploads one image and returns its stored path, or throws with the server message */
export const uploadImage = (file: File, target: UploadTarget): Promise<string> =>
	postMultipart<string>(
		'imageUploader',
		'mutation ImageUploader($file: Upload!, $target: String!) { imageUploader(file: $file, target: $target) }',
		{ file: null, target },
		[file],
		{ '0': ['variables.file'] },
	);

/** uploads several images in one request; files the server could not read are skipped */
export const uploadImages = async (files: File[], target: UploadTarget): Promise<string[]> =>
	(await postMultipart<string[] | null>(
		'imagesUploader',
		'mutation ImagesUploader($files: [Upload!]!, $target: String!) { imagesUploader(files: $files, target: $target) }',
		{ files: files.map(() => null), target },
		files,
		Object.fromEntries(files.map((_, index) => [String(index), [`variables.files.${index}`]])),
	)) ?? [];
