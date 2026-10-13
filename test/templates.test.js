import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHtml, escapeXml } from '../lib/escape.js';
import { SITE, renderHome, renderPost, renderAbout, renderNotFound } from '../lib/templates.js';
import { CHARACTERS } from '../lib/characters.js';

const staticDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'static');

const post = (slug, date, extra = {}) => ({
  slug,
  title: `Title of ${slug}`,
  date,
  summary: `Summary of ${slug}.`,
  html: `<p>Body of ${slug}.</p>`,
  assetsDir: null,
  ...extra,
});
const posts = [post('newest', '2026-10-12'), post('middle', '2026-09-28'), post('oldest', '2026-09-03')];
const nasty = post('nasty', '2026-10-01', { title: 'Tom & "Jerry" <Rig>', summary: 'A & B < C > D "E"' });

const homeImgs = (html) => [...html.matchAll(/<img\b[^>]*class="ch"[^>]*data-row[^>]*>/g)].map((m) => m[0]);
const attr = (tag, name) => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];
const allPages = () => [renderHome(posts), renderHome([]), renderPost(posts[0]), renderAbout('<p>Hi</p>'), renderNotFound()];

test('escapeHtml escapes & < > " and \'', () => {
  assert.equal(escapeHtml(`a & b < c > d "e" 'f'`), 'a &amp; b &lt; c &gt; d &quot;e&quot; &#39;f&#39;');
  assert.equal(escapeXml('<&>'), '&lt;&amp;&gt;');
});

test('SITE describes Go10 on go10.dev', () => {
  assert.deepEqual(SITE, { name: 'Go10', tagline: 'Engineering Animation', url: 'https://go10.dev' });
});

test('home lists posts newest first with date, linked title and summary', () => {
  const html = renderHome(posts);
  const positions = posts.map((p) => html.indexOf(`<a href="/${p.slug}/">${p.title}</a>`));
  assert.ok(positions.every((p) => p > 0), 'every title is linked');
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.match(html, /<time datetime="2026-10-12">Oct 12, 2026<\/time>/);
  assert.match(html, /<time datetime="2026-09-03">Sep 3, 2026<\/time>/);
  for (const p of posts) assert.ok(html.includes(p.summary));
});

test('home has nav links to /, /about/ and /feed.xml', () => {
  const html = renderHome(posts);
  const nav = /<nav\b[\s\S]*?<\/nav>/.exec(html)[0];
  assert.match(nav, /<a href="\/">Posts<\/a>/);
  assert.match(nav, /<a href="\/about\/">About<\/a>/);
  assert.match(nav, /<a href="\/feed.xml">RSS<\/a>/);
});

test('home shows a friendly message when there are no posts', () => {
  const html = renderHome([]);
  assert.match(html, /No posts yet/);
  assert.equal(homeImgs(html).length, 0);
  assert.doesNotMatch(html, /<ol/);
});

test('escapes & < > " in title and summary in body, title tag and meta attributes', () => {
  const home = renderHome([nasty]);
  assert.ok(home.includes('Tom &amp; &quot;Jerry&quot; &lt;Rig&gt;'));
  assert.ok(home.includes('A &amp; B &lt; C &gt; D &quot;E&quot;'));
  assert.ok(!home.includes('<Rig>'));

  const page = renderPost(nasty);
  assert.match(page, /<title>Tom &amp; &quot;Jerry&quot; &lt;Rig&gt; · Go10<\/title>/);
  assert.match(page, /<meta name="description" content="A &amp; B &lt; C &gt; D &quot;E&quot;">/);
  assert.match(page, /<meta property="og:title" content="Tom &amp; &quot;Jerry&quot; &lt;Rig&gt;">/);
  assert.match(page, /<h1>Tom &amp; &quot;Jerry&quot; &lt;Rig&gt;<\/h1>/);
  assert.ok(!page.includes('<Rig>'));
});

test('home images have width and height 64, empty alt and a src from CHARACTERS', () => {
  const imgs = homeImgs(renderHome(posts));
  assert.equal(imgs.length, posts.length);
  for (const img of imgs) {
    assert.equal(attr(img, 'width'), '64');
    assert.equal(attr(img, 'height'), '64');
    assert.equal(attr(img, 'alt'), '');
    const src = attr(img, 'src');
    assert.ok(src.startsWith('/characters/') && CHARACTERS.includes(src.slice('/characters/'.length)), src);
  }
});

test('home rows use distinct default characters', () => {
  const many = Array.from({ length: 12 }, (_, i) => post(`post-${i}`, `2026-01-${String(i + 10)}`));
  const srcs = homeImgs(renderHome(many)).map((img) => attr(img, 'src'));
  assert.equal(new Set(srcs).size, 12);
});

test('home re-rolls characters with an inline script', () => {
  const html = renderHome(posts);
  assert.match(html, /<script>[\s\S]*function distinctRandom[\s\S]*img\.ch\[data-row\][\s\S]*<\/script>/);
  assert.doesNotMatch(renderHome([]), /<script>/);
});

test('post page contains title, date, html body, a back link and one sign-off character', () => {
  const html = renderPost(posts[0]);
  assert.match(html, /<h1>Title of newest<\/h1>/);
  assert.match(html, /<time datetime="2026-10-12">Oct 12, 2026<\/time>/);
  assert.ok(html.includes('<p>Body of newest.</p>'));
  assert.match(html, /<a href="\/">[^<]*All posts<\/a>/);
  const chars = [...html.matchAll(/<img\b[^>]*class="ch"[^>]*>/g)];
  assert.equal(chars.length, 1);
  assert.equal(attr(chars[0][0], 'alt'), '');
  assert.match(html, /<script>[\s\S]*function distinctRandom[\s\S]*<\/script>/);
});

test('pages declare metadata: canonical, open graph, twitter, favicon', () => {
  const html = renderPost(posts[0]);
  assert.match(html, /<link rel="canonical" href="https:\/\/go10.dev\/newest\/">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/go10.dev\/newest\/">/);
  assert.match(html, /<meta property="og:type" content="article">/);
  assert.match(html, /<meta name="twitter:card" content="summary">/);
  assert.match(html, /<link rel="icon" type="image\/png" href="\/characters\/c1.png">/);
  assert.match(renderHome(posts), /<link rel="canonical" href="https:\/\/go10.dev\/">/);
  assert.match(renderAbout('<p>Hi</p>'), /<link rel="canonical" href="https:\/\/go10.dev\/about\/">/);
  assert.match(renderHome(posts), /<link rel="alternate" type="application\/rss\+xml"[^>]*href="\/feed.xml">/);
});

test('about and 404 pages render', () => {
  assert.match(renderAbout('<p>Hello from about</p>'), /<p>Hello from about<\/p>/);
  const notFound = renderNotFound();
  assert.match(notFound, /<meta name="robots" content="noindex">/);
  assert.match(notFound, /<a href="\/">/);
});

test('pages declare color-scheme light and lang en', () => {
  for (const html of allPages()) {
    assert.match(html, /^<!doctype html>/i);
    assert.match(html, /<html lang="en">/);
    assert.match(html, /<meta name="color-scheme" content="light">/);
    assert.match(html, /<meta charset="utf-8">/);
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  }
  assert.match(fs.readFileSync(path.join(staticDir, 'styles.css'), 'utf8'), /color-scheme:\s*light/);
});

test('pages request no external hosts', () => {
  const css = fs.readFileSync(path.join(staticDir, 'styles.css'), 'utf8');
  assert.doesNotMatch(css, /url\(\s*['"]?(https?:)?\/\//);
  for (const html of allPages()) {
    const tags = html.match(/<(link|script|img|iframe|source|video|audio)\b[^>]*>/g) ?? [];
    for (const tag of tags) {
      if (/rel="canonical"/.test(tag)) continue;
      assert.doesNotMatch(tag, /\b(src|href)="(https?:)?\/\//, tag);
    }
    assert.doesNotMatch(html, /url\(\s*['"]?(https?:)?\/\//);
  }
});

test('post page with no images is under 100 KB including font and character', () => {
  const size = (rel) => fs.statSync(path.join(staticDir, rel)).size;
  const largestCharacter = Math.max(...CHARACTERS.map((c) => size(path.join('characters', c))));
  const realistic = post('realistic', '2026-10-12', {
    html: '<p>A paragraph of reasonable length about pipelines and render farms.</p>\n'.repeat(60),
  });
  const total =
    Buffer.byteLength(renderPost(realistic)) +
    size('styles.css') +
    size(path.join('fonts', 'walter-turncoat-latin.woff2')) +
    largestCharacter;
  assert.ok(total < 100 * 1024, `total ${total} bytes`);
});

test('post page shows the author with avatar, linked to the about page', () => {
  const html = renderPost(posts[0]);
  assert.match(html, /<img class="avatar" src="\/assets\/profile.jpg" width="44" height="44" alt="">/);
  assert.match(html, /<a class="author" href="\/about\/" rel="author">Mateo Jacques<\/a>/);
  assert.match(html, /<meta name="author" content="Mateo Jacques">/);
  assert.match(html, /<meta property="article:published_time" content="2026-10-12">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/go10.dev\/assets\/profile.jpg">/);
  assert.ok(fs.existsSync(path.join(staticDir, 'assets', 'profile.jpg')));
});

test('home rows name the author', () => {
  const html = renderHome(posts);
  assert.equal(html.match(/· Mateo Jacques<\/p>/g).length, posts.length);
});

test('an unknown author fails loudly', () => {
  assert.throws(() => renderPost({ ...posts[0], author: 'nobody' }), /Unknown author "nobody"/);
});

test('post page offers share links with the canonical url, encoded and safe', () => {
  const html = renderPost(nasty);
  const share = /<section class="share"[\s\S]*?<\/section>/.exec(html)[0];
  const url = encodeURIComponent('https://go10.dev/nasty/');
  for (const name of ['X', 'LinkedIn', 'Bluesky', 'Reddit', 'Hacker News', 'Email']) {
    assert.match(share, new RegExp(`>${name}</a>`));
  }
  assert.ok(share.includes(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`));
  assert.ok(share.includes(`https://x.com/intent/post?text=${encodeURIComponent(nasty.title)}&amp;url=${url}`));
  assert.ok(share.includes(`mailto:?subject=${encodeURIComponent(nasty.title)}&amp;body=${url}`));
  assert.ok(!share.includes('<Rig>'));
  const external = share.match(/<a [^>]*href="https:[^>]*>/g);
  assert.equal(external.length, 5);
  for (const tag of external) assert.match(tag, /target="_blank" rel="noopener noreferrer"/);
});

test('copy and native share buttons start hidden and are revealed by script', () => {
  const html = renderPost(posts[0]);
  assert.match(html, /<button type="button" data-native hidden>/);
  assert.match(html, /<button type="button" data-copy hidden/);
  assert.match(html, /navigator\.share[\s\S]*navigator\.clipboard/);
  for (const page of [renderHome(posts), renderAbout('<p>Hi</p>'), renderNotFound()]) {
    assert.doesNotMatch(page, /class="share"/);
  }
});

test('a post with a cover image shows it and uses it for a large link preview', () => {
  const html = renderPost(post('pic', '2026-10-12', { image: 'cover one.png', imageAlt: 'A "rig" & its <bones>' }));
  assert.match(html, /<figure class="cover"><img src="cover%20one.png" alt="A &quot;rig&quot; &amp; its &lt;bones&gt;"><\/figure>/);
  assert.match(html, /<meta property="og:image" content="https:\/\/go10.dev\/pic\/cover%20one.png">/);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/go10.dev\/pic\/cover%20one.png">/);
  assert.match(html, /<meta property="og:image:alt" content="A &quot;rig&quot; &amp; its &lt;bones&gt;">/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
});

test('a post without a cover image keeps the small card and the author photo', () => {
  const html = renderPost(posts[0]);
  assert.doesNotMatch(html, /class="cover"/);
  assert.match(html, /<meta name="twitter:card" content="summary">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/go10.dev\/assets\/profile.jpg">/);
});
