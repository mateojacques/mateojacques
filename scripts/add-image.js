import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { addImage } from '../lib/image.js';

const usage = 'Usage: node scripts/add-image.js <slug> <image-path-or-url> --alt "Description of the image"';
const { positionals, values } = (await import('node:util')).parseArgs({
  allowPositionals: true,
  options: { alt: { type: 'string' } },
});
const [slug, source] = positionals;
if (!slug || !source) {
  console.error(usage);
  process.exit(1);
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
try {
  const { file, image } = await addImage({ postsDir: path.join(root, 'content', 'posts'), slug, source, alt: values.alt });
  console.log(`Attached ${image} to ${path.relative(root, file)}`);
} catch (err) {
  console.error(`Failed: ${err.message}`);
  process.exit(1);
}
