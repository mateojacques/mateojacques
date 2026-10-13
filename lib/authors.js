// Everyone who can sign a post. A post picks one with `author: <id>` in its
// front matter and falls back to DEFAULT_AUTHOR, so existing posts need no change.
export const AUTHORS = {
  'mateo-jacques': {
    name: 'Mateo Jacques',
    avatar: '/assets/profile.jpg',
    url: '/about/',
  },
};

export const DEFAULT_AUTHOR = 'mateo-jacques';

export function getAuthor(id = DEFAULT_AUTHOR) {
  const author = Object.hasOwn(AUTHORS, id) ? AUTHORS[id] : undefined;
  if (!author) {
    throw new Error(`Unknown author "${id}"; add them to lib/authors.js (known: ${Object.keys(AUTHORS).join(', ')})`);
  }
  return author;
}
