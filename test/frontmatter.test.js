import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter } from '../lib/frontmatter.js';

test('parses key value pairs', () => {
  const { data, body } = parseFrontmatter('---\ntitle: Hello\ndate: 2026-10-12\n---\nBody text\n');
  assert.deepEqual(data, { title: 'Hello', date: '2026-10-12' });
  assert.equal(body, 'Body text\n');
});

test('converts true and false to booleans', () => {
  const { data } = parseFrontmatter('---\ndraft: true\nfeatured: false\n---\n');
  assert.equal(data.draft, true);
  assert.equal(data.featured, false);
});

test('strips matching quotes', () => {
  const { data } = parseFrontmatter(`---\na: "double"\nb: 'single'\nc: "mismatched'\n---\n`);
  assert.equal(data.a, 'double');
  assert.equal(data.b, 'single');
  assert.equal(data.c, `"mismatched'`);
});

test('keeps colons inside values', () => {
  const { data } = parseFrontmatter('---\ntitle: Foo: Bar\n---\n');
  assert.equal(data.title, 'Foo: Bar');
});

test('returns empty data and full body when there is no front matter', () => {
  const source = '# Just markdown\n\nNo front matter.\n';
  assert.deepEqual(parseFrontmatter(source), { data: {}, body: source });
});

test('throws on unclosed front matter', () => {
  assert.throws(() => parseFrontmatter('---\ntitle: Hello\nBody without fence\n'), Error);
});

test('handles CRLF line endings', () => {
  const { data, body } = parseFrontmatter('---\r\ntitle: Hello\r\ndraft: true\r\n---\r\nBody\r\n');
  assert.deepEqual(data, { title: 'Hello', draft: true });
  assert.equal(body.trim(), 'Body');
});
