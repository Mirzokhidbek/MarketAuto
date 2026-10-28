import sanitizeHtml from 'sanitize-html';

// video embeds allowed in community articles
export const allowedIframeHosts = ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'];

/**
 * Article text comes from the rich-text editor as HTML. Only the formatting the editor produces is kept:
 * no scripts, event handlers, javascript: links, forms or iframes from other sites, whichever client sent it.
 */
export const sanitizeArticleHtml = (html: string): string =>
	sanitizeHtml(html ?? '', {
		allowedTags: [
			'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'del', 's', 'u', 'span', 'div',
			'blockquote', 'ul', 'ol', 'li', 'pre', 'code', 'hr', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
			'iframe',
		],
		allowedAttributes: {
			a: ['href', 'target', 'rel'],
			img: ['src', 'alt', 'width', 'height'],
			span: ['style'],
			th: ['colspan', 'rowspan', 'align'],
			td: ['colspan', 'rowspan', 'align'],
			ol: ['start'],
			li: ['class', 'data-task', 'data-task-checked'],
			pre: ['class'],
			code: ['data-language'],
			div: ['class'],
			iframe: ['src', 'width', 'height', 'allowfullscreen', 'frameborder', 'allow'],
		},
		allowedStyles: { span: { color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^[a-z]+$/i] } },
		allowedSchemes: ['http', 'https', 'mailto', 'tel'],
		allowedSchemesByTag: { img: ['http', 'https'], iframe: ['https'] },
		allowedIframeHostnames: allowedIframeHosts,
		transformTags: {
			a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: 'noopener noreferrer nofollow' } }),
		},
	});
