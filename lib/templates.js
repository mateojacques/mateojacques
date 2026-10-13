import { escapeHtml as e } from './escape.js';
import { CHARACTERS, assignDefaults, distinctRandom } from './characters.js';

export const SITE = { name: 'Go10', tagline: 'Engineering Animation', url: 'https://go10.dev' };

const HOME_DESCRIPTION = 'Go10: Engineering Animation. Notes on the software and pipeline engineering behind animated films and shows.';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-09-03" -> "Sep 3, 2026", without depending on the build machine's locale.
function formatDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

function time(iso) {
  return `<time datetime="${iso}">${formatDate(iso)}</time>`;
}

function character(file, attribute) {
  return `<img class="ch" ${attribute} src="/characters/${file}" width="64" height="64" alt="">`;
}

// Swaps the build-time default characters for random ones on each visit.
// Without JavaScript the defaults stay, so nothing breaks.
function rerollScript(selector) {
  return `<script>(function(){var pick=${distinctRandom.toString()};` +
    `var imgs=document.querySelectorAll('${selector}');` +
    `var files=pick(imgs.length,${JSON.stringify(CHARACTERS)},Math.random);` +
    `for(var i=0;i<imgs.length;i++)imgs[i].src='/characters/'+files[i];})();</script>`;
}

// `title` is the <title>; `shareTitle` is what Open Graph and Twitter show.
function layout({ title, shareTitle, description, path, type = 'website', main, robots }) {
  const url = `${SITE.url}${path}`;
  const indexing = robots
    ? `<meta name="robots" content="${robots}">`
    : `<link rel="canonical" href="${url}">
<meta property="og:url" content="${url}">`;
  const isHome = path === '/';
  const brand = isHome
    ? `<h1 class="site-title"><a href="/">${SITE.name}</a></h1>
<p class="tagline">${SITE.tagline}</p>`
    : `<p class="site-title"><a href="/">${SITE.name}</a></p>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${e(title)}</title>
<meta name="description" content="${e(description)}">
${indexing}
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${e(shareTitle)}">
<meta property="og:description" content="${e(description)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${e(shareTitle)}">
<meta name="twitter:description" content="${e(description)}">
<link rel="icon" type="image/png" href="/characters/c1.png">
<link rel="preload" href="/fonts/walter-turncoat-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css">
<link rel="alternate" type="application/rss+xml" title="${SITE.name}" href="/feed.xml">
</head>
<body${isHome ? ' class="home"' : ''}>
<header class="site-header">
${brand}
<nav aria-label="Main"><a href="/">Posts</a><a href="/about/">About</a><a href="/feed.xml">RSS</a></nav>
</header>
<main>
${main}
</main>
</body>
</html>
`;
}

export function renderHome(posts) {
  let main;
  if (posts.length === 0) {
    main = `<p class="empty">No posts yet. The first one is on its way.</p>`;
  } else {
    const defaults = assignDefaults(posts.map((post) => post.slug));
    const rows = posts.map((post) => `<li class="post-row">
${character(defaults[post.slug], 'data-row')}
<div>
<p class="date">${time(post.date)}</p>
<h2 class="post-title"><a href="/${post.slug}/">${e(post.title)}</a></h2>
<p class="summary">${e(post.summary)}</p>
</div>
</li>`);
    main = `<ol class="post-list">
${rows.join('\n')}
</ol>
${rerollScript('img.ch[data-row]')}`;
  }
  return layout({ title: `${SITE.name} · ${SITE.tagline}`, shareTitle: SITE.name, description: HOME_DESCRIPTION, path: '/', main });
}

export function renderPost(post) {
  const signoff = assignDefaults([post.slug])[post.slug];
  const main = `<article>
<header class="post-header">
<h1>${e(post.title)}</h1>
<p class="date">${time(post.date)}</p>
</header>
<div class="prose">
${post.html}
</div>
<p class="signoff">${character(signoff, 'data-signoff')}</p>
</article>
${rerollScript('img.ch[data-signoff]')}
<footer class="post-footer"><a href="/">← All posts</a></footer>`;
  return layout({ title: `${post.title} · ${SITE.name}`, shareTitle: post.title, description: post.summary, path: `/${post.slug}/`, type: 'article', main });
}

export function renderAbout(html) {
  const main = `<article>
<header class="post-header"><h1>About</h1></header>
<div class="prose">
${html}
</div>
</article>`;
  return layout({ title: `About · ${SITE.name}`, shareTitle: 'About', description: `About Mateo Jacques, who writes ${SITE.name}.`, path: '/about/', main });
}

export function renderNotFound() {
  const main = `<article>
<header class="post-header"><h1>Page not found</h1></header>
<div class="prose">
<p>There is nothing at this address. Try the <a href="/">list of posts</a>.</p>
</div>
</article>`;
  return layout({ title: `Not found · ${SITE.name}`, shareTitle: 'Page not found', description: 'Page not found.', path: '/404.html', main, robots: 'noindex' });
}
