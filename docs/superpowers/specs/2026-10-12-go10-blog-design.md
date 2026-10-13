# Go10 blog: design

Date: 2026-10-12. Repo: `mateojacques` (to be renamed/re-pointed to Go10 by the owner; not part of this work).

## Intent

Turn the current personal site into **Go10**, a blog at **go10.dev** with the tagline **"Engineering Animation"**. The blog is about software engineering applied to animation: how programming and pipeline engineering are involved in producing animated films and shows.

Why: Mateo Jacques is a full-stack software engineer (5+ years) who wants to work in animation as a Pipeline Developer / Technical Director. The blog is both a genuine writing outlet and evidence of interest and depth for hiring people at animation studios.

Readers:
- Developers and animation students curious about the pipeline side.
- People with software skills who want to enter the animation industry.
- Hiring managers / interviewers evaluating Mateo for pipeline and TD roles. They should land on a post and simply read it, then find who the author is.

## Goals

- Extremely readable, no-distraction reading experience. The content is the product.
- Minimal, indie, nostalgic look. Light mode only.
- Writing a post = adding one Markdown file to the repo and pushing. No backend, no CMS.
- Output is simple, lightweight static HTML. Tiny CSS, almost no JavaScript, no framework, no tracking, no third-party requests at runtime.
- Personality comes from small decorations: the author's own character drawings (see below).

## Non-goals

- No dark mode, no theme switcher.
- No comments, search, tags/categories, newsletter, analytics, or pagination for now.
- No page loaders or loading animations. Decided: the characters are enough.
- No art gallery, games, music, or Plazem iframe. The personal multi-topic site is gone.
- No client-side framework, no bundler, no CMS.

## Anti-goals (a failure even if it "works")

- Decoration competes with or interrupts the text.
- Anything fake or slow added for effect (artificial delays, heavy animation).
- Heavy pages: images that are far larger than they display, external font or script requests.
- Using official or third-party artwork of copyrighted characters. Only the author's own drawings are used.

## Decisions made with the owner

- **Name / domain / tagline:** Go10, go10.dev, "Engineering Animation". (The current README says `go10.blog`; the owner said go10.dev. Treat go10.dev as correct and fix the README.)
- **Hosting:** Netlify, permanently. It builds on every push. Generated HTML is **not** committed; Netlify runs the build command and publishes the output folder (via `netlify.toml`).
- **Font:** keep Walter Turncoat (hand-drawn). It is the signature of the site.
- **Colours:** text `#111`, secondary `#333`/`#666`, white background. Same as current.
- **Home page layout** (chosen from mockups, "A" with only the character from "B"):
  - `Go10` title, tagline under it, nav (`Posts`, `About`, `RSS`) in the hand-drawn style with a wavy underline.
  - Posts listed newest first as: date, title (underlined link), one-line summary.
  - Each post row has a small (about 64px) character picture on its left.
  - No tags, no categories, no intro paragraph.
- **Characters:** the owner's own drawings of animated characters, picked by the owner from `assets/art/digital/`. The selected set is the 15 drawings numbered **1, 8, 9, 26, 44, 45, 46, 47, 54, 56, 57, 60, 61, 62, 63** (thumbnail versions in `assets/art/digital/thumbnails/`). They are decoration only. Which character appears next to a post is **random on each visit**.
- **Everything else in the repo is removed:** the other 48 drawings, the full-size images, the `art.html`, `games.html`, `main.js` gallery code, the nav button PNGs, `buttons.psd`, unused `bg.png`.

## Calls made by the designer (the owner has not weighed in; flag if wrong)

- **Tooling:** a small Node build script (`build.js`), Markdown via a single dependency such as `marked`, front matter parsed by a few lines of code. No static-site framework. Node is already installed on the owner's machine (v26).
- **Post format:** `posts/<slug>.md` with front matter: `title`, `date` (YYYY-MM-DD), `summary`, optional `draft: true` (excluded from the build). URL: `/<slug>/`.
- **Randomness without hurting no-JS or layout:** the build assigns each post a deterministic default character (e.g. by hashing the slug) and writes it into the HTML with explicit width/height. A tiny inline script (about 5 lines) swaps it for a random one on load. Without JavaScript the page still works and shows the default.
- **Character images:** despite their folder name, the "thumbnails" are full-size (up to 1696x2016, 4.7 MB total for the 15). Most are transparent PNGs; #8, #9 and #26 are palette PNGs. Aspect ratios vary from portrait to 16:9. Call: each picture sits in a fixed 64x64 box, scaled to fit and centered (`object-fit: contain`), so any ratio works with no layout shift. Produce 128px-long-edge optimized copies (PNG with transparency preserved, or WebP) with a **one-off conversion script** whose output is committed (no native image dependency on Netlify). Remove the originals once converted; the 15 originals remain in git history.
- **Distinct characters per page:** on the home page, rows get different characters (shuffle, no repeats) until there are more posts than characters, then repeat. A post page shows one random character as its sign-off.
- **Post images:** a post may be `posts/<slug>.md` or `posts/<slug>/index.md` with images beside it. The build copies them next to the output page. The RSS feed rewrites relative image and link URLs to absolute `https://go10.dev/...`.
- **Deploy:** `netlify.toml` sets the build command, publish folder and a pinned current LTS Node version. Old files are removed in the same change. No redirects (the old site's other pages are being retired on purpose).
- **Sample post:** a short, real welcome post ("Welcome to Go10"). It's fine for it to be public and in the feed; the owner replaces it with real writing.
- **Post page:** same header as the home page (small `Go10` link back to home), post title, date, body in a single narrow column (about 38 to 42em wide max, large line height, comfortable font size), and a footer with a link back to all posts. One random character as a small sign-off at the end of the post. Code in monospace blocks on a very light grey background; no syntax highlighting in v1. Images and figures are supported with captions. Headings use the hand-drawn font; keep sizes restrained.
- **About page:** `about.md` rendered with the same template. The builder writes a short placeholder the owner will replace. It should include space for who the owner is, a line about wanting to work in animation pipelines, and links (GitHub, LinkedIn, email), which the owner supplies.
- **RSS:** `/feed.xml` with full post content, generated at build time.
- **Fonts:** self-host Walter Turncoat (latin subset, woff2, SIL OFL license) instead of Google Fonts; use `font-display: swap`.
- **Metadata:** `<title>`, meta description, canonical URL on go10.dev, Open Graph and Twitter tags (text only; no per-post images), `lang="en"`, a favicon taken from one of the characters, `<meta name="color-scheme" content="light">`.
- **Sample content:** include one example post (`draft: false`, clearly an example) so the site is not empty, and so the owner can see the format. The owner will replace it with real writing.
- **Repo hygiene:** add `.gitignore` for `dist/`, `node_modules/`, `.superpowers/`. Update README to describe the blog and how to add a post.
- **Accessibility:** decorative characters use empty `alt=""`; visible focus styles on links; contrast at least AA; works at phone width (single column, 16px gutters).

## Constraints

- Static output only. No server code.
- Build must run on Netlify with just `npm install && node build.js` (or equivalent) and publish a single output folder.
- Windows development machine (Git Bash / PowerShell), so scripts must be cross-platform Node, not shell-specific.
- About page links, supplied by the owner: GitHub `https://github.com/mateojacques`, LinkedIn `https://linkedin.com/in/mateoleonjacques`, email `mateojacquesweb@gmail.com` (the owner chose to publish it; render it as a `mailto:` link).
- Page weight target for a typical post with no images: well under 100 KB total including the font and the character image.

## Left to the builder

- Exact CSS values and spacing; keep it minimal and cohesive with the existing look.
- Project file layout, the Markdown library, the image optimization method.
- The wording of the placeholder About text and the example post.
- Whether to add a tiny local preview/watch command (`npm run dev`).
