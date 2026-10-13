# Go10

Go10, Engineering Animation: a small static blog about the software behind animated films and shows. Live at [go10.dev](https://go10.dev).

## Writing a post

Add a Markdown file to `content/posts/`. The file name becomes the URL, so `content/posts/render-farms.md` is published at `/render-farms/`.

```markdown
---
title: How a render farm decides what runs next
date: 2026-10-20
summary: Queues, priorities and why your shot is always last.
---

The post, in Markdown.
```

- `title`, `date` (YYYY-MM-DD) and `summary` are required. The build fails and names the file if one is missing.
- Add `draft: true` to keep a post out of the site and the feed.
- If a post has images, make it a folder instead: `content/posts/render-farms/index.md` with the images next to it, linked relatively (`![Farm diagram](farm.png)`).

The About page is `content/about.md`.

## Commands

```sh
npm install      # once
npm run build    # writes the site to dist/
npm test         # runs the tests
npx serve dist   # preview the built site locally
```

Requires Node 22 or newer.

## Deploying

Netlify builds the site on every push to `main` using `netlify.toml` (`npm run build`, publishing `dist/`). The generated `dist/` folder is not committed.

## Layout

- `content/`: posts and the About page.
- `static/`: CSS, the self-hosted Walter Turncoat font and the character drawings, copied to the site as is.
- `lib/`: front matter parsing, post loading, templates and the RSS feed.
- `build.js`: puts it all together.
- `scripts/make-characters.js`: one-off script that produced `static/characters/`. Not part of the build.
