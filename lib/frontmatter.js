// Parses a `---` fenced block of `key: value` lines at the top of a file.
// Deliberately tiny: no nesting, no lists, no YAML library.
export function parseFrontmatter(source) {
  const text = source.replace(/^﻿/, '');
  const lines = text.split(/\r?\n/);
  if (lines[0].trim() !== '---') return { data: {}, body: source };

  const close = lines.findIndex((line, i) => i > 0 && line.trim() === '---');
  if (close === -1) throw new Error('Front matter opened with --- but never closed');

  const data = {};
  for (const line of lines.slice(1, close)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const colon = line.indexOf(':');
    if (colon === -1) throw new Error(`Invalid front matter line: ${line}`);
    const key = line.slice(0, colon).trim();
    data[key] = parseValue(line.slice(colon + 1).trim());
  }

  return { data, body: lines.slice(close + 1).join('\n') };
}

function parseValue(raw) {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  const quote = raw[0];
  if (raw.length >= 2 && (quote === '"' || quote === "'") && raw.at(-1) === quote) {
    return raw.slice(1, -1);
  }
  return raw;
}
