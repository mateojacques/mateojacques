# Writing and publishing posts

A post is one Markdown file. No CMS.

## Format

`content/posts/<slug>.md`, or `content/posts/<slug>/index.md` when the post has images. The slug is lowercase letters, digits and single hyphens, and becomes the URL `go10.dev/<slug>/`.

```
---
title: Plain sentence-case title
date: 2026-10-12
summary: One line shown on the home page and in the RSS feed.
author: mateo-jacques
draft: true
---
Body in Markdown. The title comes from front matter, so don't add an H1.
Use ## for sections only when the post is long enough to need them.
```

| Field | Required | Notes |
| --- | --- | --- |
| `title`, `summary` | yes | Non-empty strings |
| `date` | yes | Real calendar date, `YYYY-MM-DD` |
| `author` | no | Id from `lib/authors.js`; defaults to `mateo-jacques` |
| `draft` | no | `true` keeps the post out of the build (and the feed) |
| `image`, `imageAlt` | no | Cover image next to `index.md`, plus alt text; set by the script below |

Front matter is parsed by a minimal custom parser: one `key: value` per line, no lists or nesting.

Posts are short: roughly 600 to 1,200 words. Code blocks are monospace without syntax highlighting. Images placed in a folder post are referenced relatively (`![alt](diagram.png)`).

## Cover image

```
node scripts/add-image.js <slug> <local-path-or-url> --alt "What the image shows"
```

Copies the image to `content/posts/<slug>/cover.<ext>`, converts a flat post into a folder post if needed, and writes `image`/`imageAlt`. PNG, JPEG, WebP, GIF or AVIF, up to 5 MB. Only use your own artwork, diagrams and screenshots.

## Verify

```
npm run build   # must succeed; errors name the offending file
npm test
```

Check `dist/<slug>/index.html` exists.

## Publish

Remove `draft: true`, make sure `date` is correct, commit the post (and its folder), and push to `main`. Netlify builds and deploys in about a minute. The feed at `/feed.xml` updates automatically.

## Voice and workflow

The owner is a developer learning animation pipelines while writing, so posts say "I read / I built / this is how I understand it" and never claim industry experience. The full workflow (research, Q&A, draft, review, publish) and the voice rules are in `.claude/skills/new-post/SKILL.md` and `.claude/skills/new-post/references/voice.md`.
