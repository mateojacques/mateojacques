import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPosts } from '../lib/posts.js';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const postsDir = path.join(fixtures, 'content', 'posts');
const slugs = (posts) => posts.map((p) => p.slug);

test('excludes drafts', () => {
  assert.ok(!slugs(loadPosts(postsDir)).includes('unfinished'));
});

test('sorts newest first', () => {
  const dates = loadPosts(postsDir).map((p) => p.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.equal(dates[0], '2026-10-01');
});

test('breaks date ties by slug', () => {
  const s = slugs(loadPosts(postsDir));
  assert.equal(s.indexOf('tie-b'), s.indexOf('tie-a') + 1);
});

test('derives slug from file name and folder name', () => {
  assert.deepEqual(slugs(loadPosts(postsDir)), ['hello-world', 'tie-a', 'tie-b', 'folder-post', 'cafe-and-co']);
});

test('renders markdown to html', () => {
  const post = loadPosts(postsDir).find((p) => p.slug === 'hello-world');
  assert.match(post.html, /<p>Hello <strong>world<\/strong>\.<\/p>/);
});

test('keeps accents and ampersands in title untouched', () => {
  const post = loadPosts(postsDir).find((p) => p.slug === 'cafe-and-co');
  assert.equal(post.title, 'Café & Co <Rigs> "Quoted"');
  assert.equal(post.summary, 'Accents & ampersands <b>not bold</b> "quoted".');
});

test('reports assetsDir for folder posts and null for file posts', () => {
  const posts = loadPosts(postsDir);
  assert.equal(posts.find((p) => p.slug === 'folder-post').assetsDir, path.join(postsDir, 'folder-post'));
  assert.equal(posts.find((p) => p.slug === 'hello-world').assetsDir, null);
});

test('throws naming the file when summary is missing', () => {
  assert.throws(() => loadPosts(path.join(fixtures, 'invalid', 'missing-summary')), /no-summary\.md.*summary/);
});

test('throws on an impossible date like 2026-02-31', () => {
  assert.throws(() => loadPosts(path.join(fixtures, 'invalid', 'bad-date')), /impossible-date\.md.*date/);
});

test('returns [] for an empty or missing posts directory', () => {
  assert.deepEqual(loadPosts(path.join(fixtures, 'empty')), []);
  assert.deepEqual(loadPosts(path.join(fixtures, 'does-not-exist')), []);
});
