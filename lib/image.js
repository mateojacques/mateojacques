import fs from 'node:fs';
import path from 'node:path';

export const MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.webp', '.gif', '.avif'];

// Decides the type from the file's own bytes, not its name or the server's
// Content-Type header, so a mislabelled download can't sneak in (SVG is never accepted).
export function sniffExtension(bytes) {
  const starts = (sig, offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (starts([0x89, 0x50, 0x4e, 0x47])) return '.png';
  if (starts([0xff, 0xd8, 0xff])) return '.jpg';
  if (starts([0x47, 0x49, 0x46, 0x38])) return '.gif';
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return '.webp';
  if (starts([0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66], 4)) return '.avif';
  return null;
}

async function readSource(source, fetchImpl) {
  if (/^https?:\/\//i.test(source)) {
    const res = await fetchImpl(source);
    if (!res.ok) throw new Error(`Could not download ${source}: HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  if (!fs.existsSync(source)) throw new Error(`No such file: ${source}`);
  return fs.readFileSync(source);
}

// Attaches `source` (a local path or an http(s) URL) to a post as its cover image.
// The image is copied into the post's folder, so the build never touches the network.
// A single-file post `<slug>.md` becomes `<slug>/index.md` to make room for it.
export async function addImage({ postsDir, slug, source, alt, fetchImpl = fetch }) {
  if (!alt || !alt.trim() || /[\r\n]/.test(alt)) throw new Error('Provide the image description as a single line of alt text');

  const folder = path.join(postsDir, slug);
  const flatFile = path.join(postsDir, `${slug}.md`);
  const folderFile = path.join(folder, 'index.md');
  if (!fs.existsSync(folderFile) && !fs.existsSync(flatFile)) throw new Error(`No post with the slug "${slug}" in ${postsDir}`);

  const bytes = await readSource(source, fetchImpl);
  if (bytes.length > MAX_BYTES) throw new Error(`Image is ${(bytes.length / 1048576).toFixed(1)} MB; the limit is ${MAX_BYTES / 1048576} MB`);
  const ext = sniffExtension(bytes);
  if (!ext) throw new Error(`Unsupported image: expected PNG, JPEG, WebP, GIF or AVIF`);

  if (!fs.existsSync(folderFile)) {
    fs.mkdirSync(folder, { recursive: true });
    fs.renameSync(flatFile, folderFile);
  }
  const name = `cover${ext}`;
  fs.writeFileSync(path.join(folder, name), bytes);

  const text = fs.readFileSync(folderFile, 'utf8');
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  const close = lines.findIndex((line, i) => i > 0 && line.trim() === '---');
  if (lines[0].trim() !== '---' || close === -1) throw new Error(`${folderFile}: front matter is missing or unclosed`);

  const kept = lines.slice(1, close).filter((line) => !/^\s*(image|imageAlt)\s*:/.test(line));
  const next = ['---', ...kept, `image: ${name}`, `imageAlt: ${alt.trim()}`, ...lines.slice(close)];
  fs.writeFileSync(folderFile, next.join(eol));

  // A previous cover with another extension would otherwise be published for nothing.
  for (const other of IMAGE_EXTENSIONS) {
    if (other !== ext) fs.rmSync(path.join(folder, `cover${other}`), { force: true });
  }
  return { file: folderFile, image: name };
}
