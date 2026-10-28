import { sanitizeArticleHtml } from './html';

describe('sanitizeArticleHtml', () => {
	it('removes scripts, event handlers and javascript: links', () => {
		const html = sanitizeArticleHtml(
			'<p onclick="x()">Hi<script>alert(1)</script></p><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">a</a>',
		);
		expect(html).not.toMatch(/script|onclick|onerror|javascript:/i);
		expect(html).toContain('<p>Hi</p>');
	});

	it('keeps editor formatting, images and YouTube embeds', () => {
		const html = sanitizeArticleHtml(
			'<h2>Title</h2><p><strong>b</strong> <span style="color: #ff0000">red</span></p>' +
				'<img src="https://api.marketauto.uz/uploads/article/a.webp" alt="car">' +
				'<iframe src="https://www.youtube.com/embed/abc" allowfullscreen></iframe>',
		);
		expect(html).toContain('<h2>Title</h2>');
		expect(html).toContain('<span style="color:#ff0000">red</span>');
		expect(html).toContain('src="https://api.marketauto.uz/uploads/article/a.webp"');
		expect(html).toContain('src="https://www.youtube.com/embed/abc"');
	});

	it('drops iframes from other sites and srcdoc', () => {
		const html = sanitizeArticleHtml('<iframe src="https://evil.example/x"></iframe><iframe srcdoc="<script>x</script>"></iframe>');
		expect(html).not.toMatch(/evil|srcdoc|script/);
	});

	it('marks links as nofollow', () => {
		expect(sanitizeArticleHtml('<a href="https://x.uz" target="_blank">x</a>')).toContain('rel="noopener noreferrer nofollow"');
	});
});
