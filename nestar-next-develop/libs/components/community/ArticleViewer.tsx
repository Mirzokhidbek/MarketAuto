import React, { useEffect, useState } from 'react';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Viewer } from '@toast-ui/react-editor';
import { Box, Stack, CircularProgress } from '@mui/material';

// video embeds allowed in articles (the API keeps the same list when it saves an article)
const VIDEO_HOSTS = ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'];

const pick = (attrs: Record<string, string> | undefined, names: string[]) =>
	Object.fromEntries(names.filter((name) => attrs?.[name] !== undefined).map((name) => [name, attrs![name]]));

/** https iframe from a known video site, with layout attributes only (no srcdoc, sandbox escapes or handlers) */
const safeIframeAttrs = (attrs: Record<string, string> | undefined) => {
	try {
		const url = new URL(attrs?.src ?? '');
		if (url.protocol !== 'https:' || !VIDEO_HOSTS.includes(url.hostname)) return null;
		return { ...pick(attrs, ['width', 'height', 'allowfullscreen', 'frameborder', 'allow']), src: url.toString() };
	} catch (err) {
		return null;
	}
};

const TViewer = (props: any) => {
	const [editorLoaded, setEditorLoaded] = useState(false);

	/** LIFECYCLES **/
	useEffect(() => {
		if (props.markdown) {
			setEditorLoaded(true);
		} else {
			setEditorLoaded(false);
		}
	}, [props.markdown]);

	return (
		<Stack>
			<Box component={'div'}>
				{editorLoaded ? (
					<Viewer
						initialValue={props.markdown}
						customHTMLRenderer={{
							htmlBlock: {
								iframe(node: any) {
									// only video players from known sites; other embeds are dropped
									const attributes = safeIframeAttrs(node.attrs);
									if (!attributes) return { type: 'html', content: '' };
									return [
										{ type: 'openTag', tagName: 'iframe', outerNewLine: true, attributes },
										{ type: 'closeTag', tagName: 'iframe', outerNewLine: true },
									];
								},
								div(node: any) {
									return [
										{ type: 'openTag', tagName: 'div', outerNewLine: true, attributes: pick(node.attrs, ['class']) },
										{ type: 'html', content: node.childrenHTML ?? '' },
										{ type: 'closeTag', tagName: 'div', outerNewLine: true },
									];
								},
							},
							htmlInline: {
								big(node: any, { entering }: any) {
									return entering
										? { type: 'openTag', tagName: 'big', attributes: node.attrs }
										: { type: 'closeTag', tagName: 'big' };
								},
							},
						}}
					/>
				) : (
					<CircularProgress />
				)}
			</Box>
		</Stack>
	);
};

export default TViewer;
