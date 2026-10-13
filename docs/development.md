# Development guide

Works on any machine with Node >= 22 and git. Windows (Git Bash or PowerShell), macOS and Linux are all fine.

## Setup

```
git clone <repo-url>
cd mateojacques
npm install
npm run build     # writes dist/
npm test
```

Preview: serve `dist/` with any static server (for example `npx serve dist`), or open `dist/index.html` directly. Absolute paths like `/styles.css` need a server, so prefer one. There is no watch mode; rebuild after each change.

## Where to change what

| I want to... | Edit |
| --- | --- |
| Add or edit a post | `content/posts/` (see [writing-posts.md](writing-posts.md)) |
| Edit the About page | `content/about.md` (front matter plus Markdown) |
| Change page HTML, nav, meta tags, share links | `lib/templates.js` |
| Change styling | `static/styles.css` (one hand-written file, light mode only) |
| Add an author | `lib/authors.js` |
| Change feed output | `lib/feed.js` |
| Add a validation rule for posts | `lib/posts.js` plus a fixture in `test/fixtures/invalid/` and a test |
| Change site name, tagline, URL | `SITE` in `lib/templates.js` |

## Testing

`node:test`, no extra tooling. `npm test` runs everything; `node --test test/feed.test.js` runs one file; add `--test-name-pattern="text"` to filter by test name.

Build tests copy `test/fixtures/` into a temp folder and call `build()` against it, so they never depend on real content. Invalid-content cases live under `test/fixtures/invalid/<case>/` (each is a posts directory with one broken post) and are excluded from the shared copy. Run `npm test` before committing; there is no CI in the repo besides Netlify's build.

## Gotchas

- `build()` wipes its output directory. Never point `outDir` at a folder you care about (it guards against the obvious cases only).
- A new slug can clash with a file in `static/` or a reserved page name, and the build will say so.
- `distinctRandom` in `lib/characters.js` is inlined into HTML via `toString()`. Keep it self-contained ES5.
- `static/characters/` holds the committed 128px character PNGs. `scripts/make-characters.js` needs the original drawings in `scratch/originals/` (gitignored, Windows only). You should not need to run it.
- `scratch/` is gitignored working space (research notes, originals). `.claude/worktrees/` and `.superpowers/` are tool state; ignore them.
- Commit style: conventional prefixes (`feat:`, `fix:`, `chore:`). Pushing to `main` deploys to production.

## Working with Claude Code

`CLAUDE.md` at the repo root is the agent briefing. The project skill `.claude/skills/new-post/` drives the full blog-writing workflow, including the owner's voice guide in `references/voice.md`.
