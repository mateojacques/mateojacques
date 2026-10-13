import { escapeXml as x } from './escape.js';
import { SITE } from './templates.js';

// Feed readers don't know where a post lives, so relative links and images
// are resolved against the post's URL. Anything with a scheme, protocol-relative
// URLs and in-page anchors are left as they are.
export function absolutizeUrls(html, postSlug, siteUrl) {
  const base = `${siteUrl}/${postSlug}/`;
  return html.replace(/\b(src|href)=(["'])(.*?)\2/g, (match, name, quote, value) => {
    if (!value || /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)) return match;
    return `${name}=${quote}${new URL(value, base).href}${quote}`;
  });
}

function cdata(text) {
  return `<![CDATA[${text.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;
}

function rfc822(isoDate) {
  return new Date(`${isoDate}T00:00:00Z`).toUTCString();
}

export function renderFeed(posts, siteUrl) {
  const items = posts.map((post) => {
    const url = `${siteUrl}/${post.slug}/`;
    return `<item>
<title>${x(post.title)}</title>
<link>${url}</link>
<guid isPermaLink="true">${url}</guid>
<pubDate>${rfc822(post.date)}</pubDate>
<description>${x(post.summary)}</description>
<content:encoded>${cdata(absolutizeUrls(post.html, post.slug, siteUrl))}</content:encoded>
</item>`;
  });
  // Derived from content, not the clock, so identical input gives identical output.
  const lastBuild = posts.length ? `\n<lastBuildDate>${rfc822(posts[0].date)}</lastBuildDate>` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${x(SITE.name)}</title>
<link>${siteUrl}/</link>
<description>${x(SITE.tagline)}</description>
<language>en</language>
<atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>${lastBuild}
${items.join('\n')}
</channel>
</rss>
`;
}
