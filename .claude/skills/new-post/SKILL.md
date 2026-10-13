---
name: new-post
description: Write a new Go10 blog post from topic to published commit. Runs the full workflow, which is topic, deep research, a Q&A conversation so Mateo actually learns the topic, a draft in his voice, review and refinement, then commit and push. Use this whenever Mateo proposes a post topic, says "new post", "let's write about X", "draft a post", or wants to research a software-engineering-for-animation subject (pipelines, USD, render farms, asset management, rigging tools, review tools, etc.), even if he doesn't mention the blog explicitly.
---

# New Go10 post

Go10 (go10.dev) is Mateo's blog about software engineering applied to animation. He is a full-stack developer working toward a Pipeline Developer / TD role. He is **learning this field while writing about it**. That shapes the whole workflow: the research and the conversation exist so he understands the topic well enough to write honestly about it, and the post is what he learned, in his voice.

Work through the phases in order. Don't skip ahead to drafting; the Q&A phase is the point, not a formality.

## Phase 1: Topic

Mateo proposes a topic. It should almost always be software engineering applied to animation. If it drifts far from that, say so once and let him decide.

Before researching, check `content/posts/` for posts that already cover it, so the new post builds on them or links to them instead of repeating them. If the topic is too broad for one short post, propose a narrower angle and confirm it. Posts are short and concrete.

## Phase 2: Deep research

Research the topic properly before saying anything substantive. Use the `anthropic-skills:deep-research` skill if available; otherwise run WebSearch (use `extended` mode for niche pipeline topics) and fetch primary sources directly.

Prefer sources in this order: official docs and specs (e.g. OpenUSD, OpenColorIO, OpenTimelineIO, ShotGrid/Flow Production Tracking docs), studio engineering blogs and conference talks (SIGGRAPH, DigiPro, Autodesk/Pixar/DreamWorks/Disney/Netflix Animation engineering posts), open-source repos, then reputable articles. Treat forum threads and marketing pages as weak evidence.

Save notes to `scratch/<slug>-research.md` (the folder is gitignored). Keep them organized by claim with the source URL next to each, and mark each claim as **solid** (primary source), **reported** (secondary), or **unverified**. The distinction matters later: the post must never state an unverified claim as fact.

Then give Mateo a briefing in chat: what the thing is, where it sits in the production pipeline (who uses it, what comes before and after it, what breaks without it), the key concepts, and what's contested or uncertain. Aim for something he can absorb in a few minutes. Don't dump the notes.

## Phase 3: Conversation

Mateo will ask questions to understand the topic from both the production side and the pipeline/engineering side. Your job is to be a knowledgeable, honest teacher.

- Answer from the research. When it isn't covered, search again rather than guess.
- Say plainly when something is uncertain, studio-specific, or changed over time. Studios do things differently, and "it depends on the studio" is often the true answer. Say what it depends on.
- Translate to what he already knows. He is a web developer, so analogies to web systems (build pipelines, package managers, CI, schemas, queues) are useful when they're accurate, and should be flagged when they break down.
- Explain production context, not just technology: which department hands what to which, who the artist is, what a bad day looks like without this tool.
- Add new findings to the research notes as they come up.
- Keep going until he says he's ready to draft. Don't push him toward drafting; offer when his questions slow down.

## Phase 4: Draft

Read `references/voice.md` in full before writing a word. It defines the tone and the AI-writing patterns to avoid, and the draft is judged against it.

Facts rule: every factual claim in the draft must trace back to a **solid** note. Mateo is not yet working in the industry, so never write first-person experience he doesn't have ("at my studio...", "I've seen this break in production..."). What he can honestly say is "I read...", "I built a small version...", "this is how I understand it". Anything he built or tried himself comes from the conversation, not from you.

Post format (the build in `lib/posts.js` enforces this):

- File: `content/posts/<slug>.md`. The slug is lowercase letters, digits and single hyphens.
- Front matter, with these fields and nothing exotic:

```
---
title: <plain title, sentence case>
date: <today, YYYY-MM-DD>
summary: <one line, what the reader gets. Shown on the home page and in RSS>
author: mateo-jacques
draft: true
---
```

- Keep `draft: true` while drafting so a stray push can't publish it. Remove it only at publish time.
- Body is Markdown starting with prose. The title comes from front matter, so don't repeat it as an H1. Use `##` for sections, and only when the post is long enough to need them.
- Length: short. Roughly 600 to 1,200 words unless the topic earns more.

Before showing the draft, run the checklist at the end of `references/voice.md` against it and fix what it catches. Then present the draft in chat along with a short list of claims you're least sure of and where each came from.

## Phase 5: Review and refine

Mateo reviews. Apply his edits faithfully and make the smallest change that does what he asked, since rewriting around his edit tends to bring the AI-sounding phrasing back. After each round, re-run the voice checklist on the changed parts.

When he corrects something that reflects a general preference ("I never say X", "too formal here"), append it to the "Learned preferences" section of `references/voice.md` so the next post starts better. Tell him you did.

**Image (optional).** Ask once whether he wants a cover image. If so, he gives a local path or URL and a one-line alt text describing it, then run:

```
node scripts/add-image.js <slug> <path-or-url> --alt "<description>"
```

This copies it into `content/posts/<slug>/`, turns the post into `<slug>/index.md`, and sets `image` and `imageAlt` in the front matter. Max 5 MB; PNG, JPEG, WebP, GIF or AVIF. Don't generate or source artwork on his behalf, and don't use official artwork of copyrighted characters (the site's anti-goal). Diagrams and screenshots he makes are fine.

Verify before publishing: `npm run build` must succeed, and `npm test` should still pass.

## Phase 6: Publish

Pushing to `main` deploys the site on Netlify, which makes it public. So wait for Mateo to explicitly say the post is final (e.g. "publish it", "ship it"). Approval of a draft is not approval to push.

Then:

1. Remove `draft: true` and confirm `date` is today's date.
2. Run `npm run build`, and confirm the post appears in `dist/`.
3. Stage only the post (`content/posts/<slug>*` including its folder if it has an image), not other files.
4. Commit with the configured git identity so Mateo is the author, using a message like `feat: add post "<title>"`. Don't add a Claude co-author trailer to post commits; the post is his writing and he asked to be the author. Check `git config user.name` and `git config user.email` first, and stop and ask if they're unset or aren't his.
5. `git push` to the current branch. If that isn't `main`, say so, since the post won't go live until it's merged.
6. Report the commit hash and the expected URL, `https://go10.dev/<slug>/`, noting the Netlify deploy may take a minute.
