import { test } from 'node:test';
import assert from 'node:assert/strict';
import { absolutizeUrls, renderFeed } from '../lib/feed.js';

const SITE_URL = 'https://go10.dev';
const post = (slug, date, extra = {}) => ({
  slug,
  title: `Title ${slug}`,
  date,
  summary: `Summary ${slug}`,
  html: `<p>Body ${slug}</p>`,
  assetsDir: null,
  ...extra,
});
const items = (xml) => xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
// Text outside CDATA sections, where raw < & > would make the XML invalid.
const outsideCdata = (xml) => xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');

test('feed is valid rss 2.0 with one item per post', () => {
  const xml = renderFeed([post('a', '2026-10-12'), post('b', '2026-10-01')], SITE_URL);
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0"/);
  assert.match(xml, /xmlns:content="http:\/\/purl.org\/rss\/1.0\/modules\/content\/"/);
  assert.equal((xml.match(/<channel>/g) ?? []).length, 1);
  assert.match(xml, /<channel>\s*<title>Go10<\/title>\s*<link>https:\/\/go10.dev\/<\/link>\s*<description>Engineering Animation<\/description>/);
  assert.match(xml, /<atom:link href="https:\/\/go10.dev\/feed.xml" rel="self" type="application\/rss\+xml"\/>/);
  assert.equal(items(xml).length, 2);
  for (const item of items(xml)) {
    for (const tag of ['title', 'link', 'guid', 'pubDate', 'description', 'content:encoded']) {
      assert.match(item, new RegExp(`<${tag}[ >][\\s\\S]*</${tag}>`), tag);
    }
  }
  assert.match(xml, /<\/channel>\n<\/rss>\n$/);
});

test('feed with zero posts has a channel and no items', () => {
  const xml = renderFeed([], SITE_URL);
  assert.match(xml, /<channel>[\s\S]*<\/channel>/);
  assert.equal(items(xml).length, 0);
});

test('escapes & < > " in titles and summaries', () => {
  const xml = renderFeed([post('x', '2026-10-12', { title: 'Tom & "Jerry" <Rig>', summary: 'A & B < C > D' })], SITE_URL);
  assert.match(xml, /<title>Tom &amp; &quot;Jerry&quot; &lt;Rig&gt;<\/title>/);
  assert.match(xml, /<description>A &amp; B &lt; C &gt; D<\/description>/);
  assert.doesNotMatch(outsideCdata(xml), /&(?!amp;|lt;|gt;|quot;|#39;)/);
});

test('rewrites relative image src to absolute urls', () => {
  const html = '<p><img src="diagram.png" alt=""><img src="./img/b.png"><a href="/about/">About</a><a href="notes/">n</a></p>';
  const out = absolutizeUrls(html, 'my-post', SITE_URL);
  assert.ok(out.includes('src="https://go10.dev/my-post/diagram.png"'));
  assert.ok(out.includes('src="https://go10.dev/my-post/img/b.png"'));
  assert.ok(out.includes('href="https://go10.dev/about/"'));
  assert.ok(out.includes('href="https://go10.dev/my-post/notes/"'));
});

test('leaves absolute urls, mailto and anchors alone', () => {
  const html = '<a href="https://example.com/x">a</a><a href="http://example.com">b</a><a href="mailto:me@example.com">c</a><a href="#top">d</a><img src="//cdn.example.com/x.png">';
  assert.equal(absolutizeUrls(html, 'p', SITE_URL), html);
});

test('item link is https://go10.dev/<slug>/ with a pubDate in RFC 822 format', () => {
  const [item] = items(renderFeed([post('hello', '2026-10-12')], SITE_URL));
  assert.match(item, /<link>https:\/\/go10.dev\/hello\/<\/link>/);
  assert.match(item, /<guid isPermaLink="true">https:\/\/go10.dev\/hello\/<\/guid>/);
  assert.match(item, /<pubDate>Mon, 12 Oct 2026 00:00:00 GMT<\/pubDate>/);
});

test('item content is the full post html with absolute urls', () => {
  const [item] = items(renderFeed([post('pics', '2026-10-12', { html: '<p>Hi <img src="a.png" alt=""></p>' })], SITE_URL));
  assert.match(item, /<content:encoded><!\[CDATA\[<p>Hi <img src="https:\/\/go10.dev\/pics\/a.png" alt=""><\/p>\]\]><\/content:encoded>/);
});

test('content containing ]]> does not break the CDATA section', () => {
  const [item] = items(renderFeed([post('cdata', '2026-10-12', { html: '<pre><code>a[b[0]]>c</code></pre>' })], SITE_URL));
  const encoded = /<content:encoded>([\s\S]*)<\/content:encoded>/.exec(item)[1];
  // Concatenating every CDATA section must give back the original html.
  const sections = [...encoded.matchAll(/<!\[CDATA\[([\s\S]*?)\]\]>/g)].map((m) => m[1]).join('');
  assert.equal(sections, '<pre><code>a[b[0]]>c</code></pre>');
  assert.equal(encoded.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, ''), '');
});

test('feed items credit the post author with dc:creator', () => {
  const xml = renderFeed([post('a', '2026-10-12')], SITE_URL);
  assert.match(xml, /xmlns:dc="http:\/\/purl.org\/dc\/elements\/1.1\/"/);
  assert.match(items(xml)[0], /<dc:creator>Mateo Jacques<\/dc:creator>/);
});

test('feed puts the cover image first, with an absolute url', () => {
  const xml = renderFeed([post('pic', '2026-10-12', { image: 'cover.png', imageAlt: 'A rig' })], SITE_URL);
  assert.match(items(xml)[0], /<!\[CDATA\[<p><img src="https:\/\/go10.dev\/pic\/cover.png" alt="A rig"><\/p>\n<p>Body pic<\/p>/);
});
