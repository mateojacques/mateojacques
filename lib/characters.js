// The owner's drawings 1, 8, 9, 26, 44, 45, 46, 47, 54, 56, 57, 60, 61, 62, 63,
// in that order, as c1.png .. c15.png (see scripts/make-characters.js).
export const CHARACTERS = Array.from({ length: 15 }, (_, i) => `c${i + 1}.png`);

// Build-time default character per slug: start at a hash of the slug and move
// to the next unused character on collision. Distinct while slugs <= 15.
export function assignDefaults(slugs) {
  const result = {};
  let used = new Set();
  for (const slug of slugs) {
    if (used.size === CHARACTERS.length) used = new Set();
    let index = hash(slug) % CHARACTERS.length;
    while (used.has(index)) index = (index + 1) % CHARACTERS.length;
    used.add(index);
    result[slug] = CHARACTERS[index];
  }
  return result;
}

// FNV-1a, 32 bit.
function hash(text) {
  let h = 0x811c9dc5;
  for (const char of text) {
    h ^= char.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

// Shuffled picks with no repeats until count exceeds the pool, then a fresh
// shuffle. Self-contained on purpose: the build inlines it with toString().
export function distinctRandom(count, pool, rng) {
  var out = [];
  var bag = [];
  while (out.length < count) {
    if (bag.length === 0) {
      bag = pool.slice();
      for (var i = bag.length - 1; i > 0; i--) {
        var j = Math.floor(rng() * (i + 1));
        var tmp = bag[i];
        bag[i] = bag[j];
        bag[j] = tmp;
      }
    }
    out.push(bag.pop());
  }
  return out;
}
