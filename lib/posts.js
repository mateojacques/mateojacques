import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import { parseFrontmatter } from './frontmatter.js';
import { DEFAULT_AUTHOR, getAuthor } from './authors.js';
import { IMAGE_EXTENSIONS } from './image.js';

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

    const post = readPost(file, assetsDir);
    if (post.draft) continue;
    posts.push({ slug, title: post.title, date: post.date, summary: post.summary, author: post.author, image: post.image ?? null, imageAlt: post.imageAlt ?? null, html: post.html, assetsDir });
  }

  return posts.sort((a, b) => (a.date === b.date ? compare(a.slug, b.slug) : compare(b.date, a.date)));
}

function readPost(file, assetsDir) {
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
  if ('author' in data) {
    try {
      getAuthor(data.author);
    } catch (err) {
      throw new Error(`${file}: ${err.message}`);
    }
  }
  if ('image' in data) checkImage(file, assetsDir, data);
  if (!isRealDate(data.date)) {
    throw new Error(`${file}: date "${data.date}" is not a real YYYY-MM-DD date`);
  }

  return { ...data, author: data.author ?? DEFAULT_AUTHOR, draft: data.draft === true, html: marked.parse(body) };
}

// A cover image is a file sitting next to a folder post's index.md.
// Links are fetched ahead of time by scripts/add-image.js, never at build time.
function checkImage(file, assetsDir, data) {
  const fix = 'run: node scripts/add-image.js <slug> <path-or-url> --alt "..."';
  const { image } = data;
  if (typeof image !== 'string' || !image.trim()) throw new Error(`${file}: image must be a file name`);
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(image)) throw new Error(`${file}: image "${image}" is a link; ${fix}`);
  if (!assetsDir) throw new Error(`${file}: image needs a post folder (<slug>/index.md); ${fix}`);
  const resolved = path.resolve(assetsDir, image);
  if (!resolved.startsWith(path.resolve(assetsDir) + path.sep)) throw new Error(`${file}: image "${image}" must live inside the post's folder`);
  if (!IMAGE_EXTENSIONS.includes(path.extname(image).toLowerCase())) {
    throw new Error(`${file}: image "${image}" must be one of ${IMAGE_EXTENSIONS.join(', ')}`);
  }
  if (!fs.existsSync(resolved)) throw new Error(`${file}: image "${image}" does not exist next to index.md`);
  if (typeof data.imageAlt !== 'string' || !data.imageAlt.trim()) {
    throw new Error(`${file}: image needs an "imageAlt" description for screen readers`);
  }
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
