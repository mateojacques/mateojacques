import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { marked } from 'marked';
import { parseFrontmatter } from './lib/frontmatter.js';
import { loadPosts } from './lib/posts.js';
import { SITE, renderHome, renderPost, renderAbout, renderNotFound } from './lib/templates.js';
import { renderFeed } from './lib/feed.js';

// Reads <root>/content and <root>/static, writes the whole site to outDir.
export async function build({ root, outDir }) {
  root = path.resolve(root);
  outDir = path.resolve(outDir);
  if (root === outDir || root.startsWith(outDir + path.sep)) {
    throw new Error(`Refusing to build: outDir ${outDir} would delete the site root`);
  }

  const contentDir = path.join(root, 'content');
  const postsDir = path.join(contentDir, 'posts');
  const staticDir = path.join(root, 'static');

  const posts = loadPosts(postsDir);
  const reserved = new Set(['about', '404.html', 'feed.xml', 'index.html', ...(await listNames(staticDir))]);
  for (const post of posts) {
    if (reserved.has(post.slug)) {
      const file = post.assetsDir ? path.join(post.assetsDir, 'index.md') : path.join(postsDir, `${post.slug}.md`);
      throw new Error(`${file}: slug "${post.slug}" clashes with a page or file the site already publishes`);
    }
  }
  const aboutFile = path.join(contentDir, 'about.md');
  const about = parseFrontmatter(await fs.readFile(aboutFile, 'utf8'));

  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
  await fs.cp(staticDir, outDir, { recursive: true });

  const write = async (rel, text) => {
    const file = path.join(outDir, rel);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, text);
  };

  await write('index.html', renderHome(posts));
  for (const post of posts) {
    if (post.assetsDir) {
      const source = path.join(post.assetsDir, 'index.md');
      await fs.cp(post.assetsDir, path.join(outDir, post.slug), { recursive: true, filter: (src) => src !== source });
    }
    await write(path.join(post.slug, 'index.html'), renderPost(post));
  }
  await write(path.join('about', 'index.html'), renderAbout(marked.parse(about.body)));
  await write('404.html', renderNotFound());
  await write('feed.xml', renderFeed(posts, SITE.url));

  return { posts: posts.length };
}

async function listNames(dir) {
  try {
    return await fs.readdir(dir);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const root = path.dirname(fileURLToPath(import.meta.url));
  try {
    const { posts } = await build({ root, outDir: path.join(root, 'dist') });
    console.log(`Built ${posts} post${posts === 1 ? '' : 's'} into dist/`);
  } catch (err) {
    console.error(`Build failed: ${err.message}`);
    process.exitCode = 1;
  }
}
