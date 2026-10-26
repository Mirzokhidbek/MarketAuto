import axios from 'axios';
import { getJwtToken } from './auth';

/** uploads one image (multipart GraphQL) and returns its stored path, or throws with the server message */
export const uploadImage = async (file: File, target: 'member' | 'property' | 'article' | 'message'): Promise<string> => {
	const formData = new FormData();
	formData.append(
		'operations',
		JSON.stringify({
			query: 'mutation ImageUploader($file: Upload!, $target: String!) { imageUploader(file: $file, target: $target) }',
			variables: { file: null, target },
		}),
	);
	formData.append('map', JSON.stringify({ '0': ['variables.file'] }));
	formData.append('0', file);
	const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
			'apollo-require-preflight': true,
			Authorization: `Bearer ${getJwtToken()}`,
		},
	});
	if (response.data?.errors?.length) throw new Error(response.data.errors[0].message);
	return response.data.data.imageUploader;
};
