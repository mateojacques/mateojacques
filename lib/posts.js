import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import { parseFrontmatter } from './frontmatter.js';

const REQUIRED = ['title', 'date', 'summary'];
// Slugs go straight into URLs and the feed, so keep them URL- and XML-safe.
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Reads content/posts: `<slug>.md` files and `<slug>/index.md` folders.
// Returns published posts, newest first, ties broken by slug.
export function loadPosts(postsDir) {
  if (!fs.existsSync(postsDir)) return [];

  const posts = [];
  const fileBySlug = new Map();
  for (const entry of fs.readdirSync(postsDir, { withFileTypes: true })) {
    const entryPath = path.join(postsDir, entry.name);
    let file, slug, assetsDir;
    if (entry.isDirectory()) {
      file = path.join(entryPath, 'index.md');
      if (!fs.existsSync(file)) continue;
      slug = path.basename(entryPath);
      assetsDir = entryPath;
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      file = entryPath;
      slug = path.basename(entry.name, '.md');
      assetsDir = null;
    } else {
      continue;
    }

    if (!SLUG.test(slug)) {
      throw new Error(`${file}: slug "${slug}" must be lowercase letters, digits and single hyphens, like my-first-post`);
    }
    if (fileBySlug.has(slug)) {
      throw new Error(`${fileBySlug.get(slug)} and ${file} both use the slug "${slug}"; keep only one`);
    }
    fileBySlug.set(slug, file);

    const post = readPost(file);
    if (post.draft) continue;
    posts.push({ slug, title: post.title, date: post.date, summary: post.summary, html: post.html, assetsDir });
  }

  return posts.sort((a, b) => (a.date === b.date ? compare(a.slug, b.slug) : compare(b.date, a.date)));
}

function readPost(file) {
  let parsed;
  try {
    parsed = parseFrontmatter(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`${file}: ${err.message}`);
  }
  const { data, body } = parsed;

  for (const key of REQUIRED) {
    if (typeof data[key] !== 'string' || !data[key].trim()) {
      throw new Error(`${file}: missing front matter field "${key}"`);
    }
  }
  if ('draft' in data && typeof data.draft !== 'boolean') {
    throw new Error(`${file}: draft must be true or false, got "${data.draft}"`);
  }
  if (!isRealDate(data.date)) {
    throw new Error(`${file}: date "${data.date}" is not a real YYYY-MM-DD date`);
  }

  return { ...data, draft: data.draft === true, html: marked.parse(body) };
}

function isRealDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function compare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
