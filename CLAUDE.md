# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

**Go10** (go10.dev, tagline "Engineering Animation"): a hand-rolled static blog by Mateo Jacques about software/pipeline engineering for animation. The GitHub repo is still called `mateojacques`, and `README.md` is the owner's GitHub profile blurb, not project docs. Leave it alone unless asked.

Deployed by Netlify on every push to `main` (`netlify.toml`: `npm run build`, publish `dist/`). Generated HTML is never committed.

Further docs: [docs/architecture.md](docs/architecture.md) (how the build works), [docs/development.md](docs/development.md) (setup, workflow, gotchas), [docs/writing-posts.md](docs/writing-posts.md) (post format and publishing). Original intent and non-goals live in `docs/superpowers/specs/2026-10-12-go10-blog-design.md`; read it before proposing features.

## Commands

Requires Node >= 22 (Netlify pins 24; local dev is on 26). Single runtime dependency: `marked`. No bundler, no framework, no linter or formatter is configured.

```
npm install
npm run build        # node build.js -> dist/
npm test             # node --test (runs test/*.test.js)
node --test test/posts.test.js                      # one test file
node --test --test-name-pattern="slug" test/        # tests matching a name
node scripts/add-image.js <slug> <path-or-url> --alt "..."   # attach a post cover image
```

There is no dev server; preview by building and opening `dist/index.html` (or any static server on `dist/`).

## Architecture (big picture)

`build.js` exports `build({ root, outDir })`, which reads `<root>/content` and `<root>/static` and writes the whole site into `outDir`. Tests call it against `test/fixtures/` copied to a temp dir, so `build()` must never assume the real repo root. It refuses to build if `outDir` would contain `root`, then deletes and recreates `outDir`.

Pipeline: `lib/posts.js` (`loadPosts`) scans `content/posts` -> `lib/frontmatter.js` parses front matter -> `marked` renders the body -> `lib/templates.js` produces HTML strings for home, post, about, 404 -> `lib/feed.js` produces `feed.xml` (full content, relative URLs rewritten to absolute). `static/` is copied verbatim into the output first.

Key behaviours that span files:

- **Posts**: `content/posts/<slug>.md` or `<slug>/index.md` (folder form carries images; everything but `index.md` is copied next to the output page). Slug = filename/folder name, must match `^[a-z0-9]+(-[a-z0-9]+)*$` and becomes the URL `/<slug>/`. `draft: true` excludes a post. Sorted newest first, ties by slug. Required front matter: `title`, `date` (real `YYYY-MM-DD`), `summary`; optional `author`, `draft`, `image` + `imageAlt`.
- **Fail loudly**: every validation problem throws an error that names the file, and `build.js` prints it and exits 1. Keep that style when adding checks. `build.js` also rejects slugs that collide with reserved outputs (`about`, `404.html`, `feed.xml`, `index.html`, anything in `static/`).
- **Front matter parser is deliberately tiny** (`key: value` lines only, booleans and optional quotes; no lists, nesting or YAML). Do not add a YAML dependency; extend the format only if truly needed.
- **Cover images** must be local files in the post's folder; `image` values that are URLs are rejected. `lib/image.js` (`addImage`, driven by `scripts/add-image.js`) downloads/copies, sniffs type from magic bytes (no SVG, 5 MB cap), converts a flat post into a folder post, and edits front matter. The build never touches the network.
- **Authors**: `lib/authors.js` is a registry; posts reference an id (`author:`), default `mateo-jacques`. Unknown ids fail the build.
- **Characters**: 15 of the owner's own drawings (`static/characters/c1..c15.png`, 128px). The build assigns deterministic defaults per slug (`assignDefaults`, FNV-1a hash, no repeats), and a small inline script in the page re-picks randomly on load using `distinctRandom`. That function is **inlined into the HTML via `Function.prototype.toString()`**, so it must stay self-contained, ES5-style (`var`, no imports or closures over module scope). The page must work without JS.
- **Inline scripts** exist only for character randomisation and the Share/Copy-link buttons (progressive enhancement; they start `hidden`). Share links are plain URLs with no SDKs or trackers.
- All interpolated text goes through `lib/escape.js` (`escapeHtml`, `escapeXml`).

## Constraints from the design (don't violate without asking)

- Static output only; light mode only; almost no JS; no tracking; no third-party requests at runtime (font is self-hosted Walter Turncoat in `static/fonts/`).
- Non-goals: dark mode, comments, search, tags, analytics, pagination, loaders, frameworks, CMS.
- Only the owner's own drawings as artwork; never official art of copyrighted characters.
- Keep pages light (a post without images should be well under 100 KB total). Decorative images use `alt=""`; keep a11y basics (focus styles, AA contrast, phone width).
- Scripts must be cross-platform Node (development is on Windows; Git Bash and PowerShell are both used). `scripts/make-characters.js` is a one-off Windows-only exception (PowerShell + System.Drawing) and is not part of the build.

## Conventions

- ESM everywhere (`"type": "module"`), `node:` import prefixes, no TypeScript, small modules in `lib/`, a `*.test.js` file per module in `test/` using `node:test` + `node:assert/strict`.
- Tests that build a site copy `test/fixtures` into a temp dir (see `tempSite()` in `test/build.test.js`); `test/fixtures/invalid/*` holds deliberately broken posts excluded from that copy. Add a fixture rather than touching real `content/`.
- Commit messages use conventional prefixes (`feat:`, `chore:`, ...).
- Gitignored: `dist/`, `node_modules/`, `scratch/` (research notes, original art), `.superpowers/`, `.claude/worktrees/`.

## Project skill

`.claude/skills/new-post/` defines the end-to-end workflow for writing a post (research, Q&A, draft in the owner's voice, publish). It has hard rules: never state first-person industry experience the owner lacks, keep `draft: true` until the owner explicitly says to publish, and pushing to `main` publishes the site. When asked to write or publish a post, use that skill; `references/voice.md` there is the voice guide.
