import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

// video embeds allowed in articles (the API keeps the same list when it saves an article)
const VIDEO_HOSTS = ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'];

const isVideoUrl = (src: string | null) => {
	try {
		const url = new URL(src ?? '');
		return url.protocol === 'https:' && VIDEO_HOSTS.includes(url.hostname);
	} catch {
		return false;
	}
};

/**
 * Article body. The API already cleans the HTML when it is saved; it is cleaned here once more,
 * keeping only https iframes of known video sites.
 */
const clean = (html: string): string => {
	DOMPurify.addHook('uponSanitizeElement', (node, data) => {
		if (data.tagName === 'iframe' && !isVideoUrl((node as Element).getAttribute('src'))) node.parentNode?.removeChild(node);
	});
	const result = DOMPurify.sanitize(html, {
		ADD_TAGS: ['iframe'],
		ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder'],
		FORBID_ATTR: ['style', 'srcdoc'],
	});
	DOMPurify.removeHook('uponSanitizeElement');
	return result;
};

const ArticleViewer = ({ markdown, className }: { markdown?: string; className?: string }) => {
	// "markdown" is the stored article HTML (the prop name is kept from the old editor)
	const html = useMemo(() => (markdown ? clean(markdown) : ''), [markdown]);
	if (!html) return null;
	return <div className={`ma-prose ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default ArticleViewer;
