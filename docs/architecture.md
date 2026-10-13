# Architecture

Go10 is a static site generator in about 550 lines of Node. Input is Markdown plus a `static/` folder; output is plain HTML in `dist/`.

## Data flow

```
content/posts/*.md | */index.md --> lib/posts.js  (scan, validate, sort)
        |                                |
        |  lib/frontmatter.js            |  marked (Markdown -> HTML)
        v                                v
   post objects {slug,title,date,summary,author,image,imageAlt,html,assetsDir}
        |
        +--> lib/templates.js --> index.html, <slug>/index.html, about/index.html, 404.html
        +--> lib/feed.js     --> feed.xml
static/ ------------------------------------------> copied verbatim first
content/about.md ---------------------------------> marked -> renderAbout
```

`build({ root, outDir })` in `build.js` orchestrates this. It is also the CLI entry point (`node build.js` builds the repo into `dist/`); the `isMain` check at the bottom lets tests import it without side effects.

## Modules

| File | Responsibility |
| --- | --- |
| `build.js` | Orchestration, output-dir safety check, reserved-slug check, file writing |
| `lib/posts.js` | Directory scan, slug/front-matter/date/image validation, draft filtering, sorting |
| `lib/frontmatter.js` | Minimal `---` fenced `key: value` parser |
| `lib/templates.js` | All HTML: `SITE` constants, page shells, home list, post page, share links, inline scripts |
| `lib/feed.js` | RSS 2.0 with full content; `absolutizeUrls` rewrites relative `src`/`href` to `https://go10.dev/<slug>/...` |
| `lib/characters.js` | Character file list, deterministic default assignment, `distinctRandom` |
| `lib/authors.js` | Author registry and `getAuthor` |
| `lib/image.js` | Cover-image attach logic (magic-byte sniffing, size cap, flat-to-folder conversion) |
| `lib/escape.js` | HTML/XML escaping |
| `scripts/add-image.js` | CLI wrapper for `addImage` |
| `scripts/make-characters.js` | One-off art resizer (Windows only), not part of the build |

## Design decisions worth knowing

- **Errors, not warnings.** Bad content aborts the build with a message naming the file. Netlify then keeps serving the previous deploy.
- **Randomness without hurting no-JS.** Each character `<img>` is rendered with a deterministic default and explicit dimensions (no layout shift). A tiny inline script swaps in random, non-repeating characters on load. `distinctRandom` is serialised into the page with `toString()`, so it has to be dependency-free ES5.
- **Network only at authoring time.** `scripts/add-image.js` can download a cover image, but the build never fetches anything.
- **Output safety.** `build()` deletes `outDir` before writing, so it throws if `outDir` equals or contains `root`.
- **Folder posts.** For `<slug>/index.md`, every sibling file is copied to `dist/<slug>/`, which is why relative image paths in Markdown work on the page, and why the feed has to absolutize them.

## Deployment

`netlify.toml`: build `npm run build`, publish `dist`, `NODE_VERSION = "24"`. Pushing to `main` deploys. No redirects, no functions.

## History

`docs/superpowers/specs/2026-10-12-go10-blog-design.md` is the original design (goals, non-goals, decisions with the owner) and `docs/superpowers/plans/2026-10-12-go10-blog.md` the implementation plan. They are a record of intent; the code is the source of truth where they disagree (for example, the spec predates authors, share links and cover images).
