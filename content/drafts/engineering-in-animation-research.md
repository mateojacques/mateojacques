# Research: what engineering looks like in animation production

Scope: TV, feature, short animation production. NOT games.
Existing posts: only `welcome-to-go10` (promises: pipeline concepts, small tools, honest about gaps).

## Roles
- Pipeline TD: hybrid programmer/artist, Python scripts, custom tools, keeps asset flow between departments. **reported** (career guides, DNEG listing)
  - https://3dvf.com/en/jobs-cards/pipeline-td-technical-director/
  - https://jobs.jobvite.com/double-negative-visual-effects/job/oLLL5fw6 (DNEG: tools/workflows for VFX and feature animation, tool dev + artist support, mostly Python)
- Netflix Animation Studios Technology dept: software engineers (animation and rigging, rendering, procedural geometry and simulation, production systems, pipeline, toolchain); TDs (tools per craft group: front end, core assets, procedural assets/FX, performance, lighting, imaging, pipeline, digital resources); project managers. Offices Sydney, Vancouver, Burbank. **solid** (employer page) https://www.netflixanimation.com/technology
  - Same page: proprietary path-tracer "Glimpse"; USD adopted and contributed to; ALab (Animal Logic's USD scene, now Netflix-maintained, free); in-house render farm; versioned "atomic" asset workflows; "CI/CD is not just for software"; works with ASWF; publishes at SIGGRAPH and DigiPro.
- Portfolio for TD roles favors custom tools and technical breakdowns over animated clips. **reported** (guide)
- Pay figures: conflicting sources. **unverified**, do not state.

## Rendering
- MoonRay: DreamWorks production renderer, used for all its feature films; films listed: Hidden World, Bad Guys, Puss in Boots: Last Wish, Kung Fu Panda 4, Wild Robot, Bad Guys 2. Open sourced, first release 2023-03-15; hosted by Linux Foundation / ASWF. USD Hydra delegate, multi-machine and cloud rendering via Arras. **solid** https://openmoonray.org/
- Glimpse (Netflix, proprietary path tracer): **solid** (employer page above)
- Imageworks used Katana and Arnold as primary lighting/render tools on Into the Spider-Verse. **reported** (search summary; verify before use)

## Scene description / interchange
- USD: open-source 3D scene description framework; each app in a pipeline otherwise has its own format unreadable by others; non-destructive layered overrides; assemble assets into sets, shots, worlds. Core of Pixar's pipeline. Started 2012 combining Presto's composition engine and TidScene; ~4th generation of composed scene description (Marionette, Presto, TidScene before). **solid** https://openusd.org/release/intro.html
- Open-sourced by Pixar 2016; Alliance for OpenUSD (Adobe, Apple, Autodesk, Nvidia, Pixar). **reported** (VentureBeat)
- Presto: Pixar's proprietary in-house animation system, replaced menv in 2012. **reported** (Wikipedia)
- OpenTimelineIO: API + interchange format for editorial cut info (clips, timing, tracks, transitions, markers, metadata); media referenced externally; adapters for editing tools. **solid** (docs) https://opentimelineio.readthedocs.io/en/latest/ (creator not stated on page; don't claim Pixar without checking)
- OpenColorIO: color management for motion picture production, 40+ apps (Nuke, Maya, Houdini, Blender, ...), v2.5.0 adds ACES 2.0. **solid** https://opencolorio.org/ (origin NOT confirmed there)

## Render management
- OpenCue: open source render management system, from Sony Pictures Imageworks' in-house manager (Cue1, Cue2, Cue3), core open-sourced with Google, joined ASWF 2023. Distributes jobs across compute, on-prem/cloud/hybrid, monitoring via CueGUI/OpenCueWeb. **solid** https://docs.opencue.io/

## Production tracking
- Flow Production Tracking (formerly ShotGrid, Autodesk): tracks shots/assets/tasks, review with notes/versions/statuses, scheduling and resource planning. **solid** for features (vendor page) https://www.autodesk.com/campaigns/flow-production-tracking
- API automation of status/publish/notifications: **reported** (third-party review). Check developer docs before detailing.

## Ecosystem
- Academy Software Foundation: neutral forum for open source in content creation, supported by the Academy; hosts OpenCue, MoonRay, etc. **solid** https://www.aswf.io/

## Stylized / show-specific tools
- Spider-Verse: Imageworks SIGGRAPH talks: "Puppeteering the Pixels" (CreaseLines, variable motion blur), "Repainting the Spider-Verse" (Rebelle watercolor app integrated into VFX pipeline). **reported** (search summary of SIGGRAPH history pages). No evidence for ML line work; don't claim.

## 2D / TV
- Toon Boom Harmony called standard for 2D TV/feature (vendor-ish blogs); TVPaint, CelAction2D also used. **reported/weak**. Need better source on 2D pipeline engineering before claiming specifics.

## Gaps (unverified / to research if asked)
- What day-to-day looks like for a studio TD (only job listings so far)
- Rigging/animation tooling engineering, simulation/FX engineering, ML in animation (nothing animation-specific found), real-time/virtual production in animation
- Small studios / TV series pipeline reality; Blender role
- Where junior web devs realistically enter (production engineering, tracking, review tools)

---
# Round 2 (2D/TV, Kitsu, interview prep)

## Kitsu (CGWire, France)
- Collaboration platform for animation and VFX productions; web app; AGPL-3.0; repo says "more than 300 studios" use it (README); CGWire says ~400 (**vendor claims**). https://kitsu.cg-wire.com/ , https://github.com/cgwire/kitsu
- Front end (package.json, master, checked directly): Vue 2.7.16, Vuex 3.6, vue-router 3.6, Vite 5, socket.io-client 4.7, superagent, vitest. **solid** (raw file; versions will drift) https://github.com/cgwire/kitsu/blob/master/package.json
- Back end Zou: Python + Flask; "the Kitsu API"; stores projects, shots, assets, tasks, file metadata, previews/versions, publishes event stream of changes; AGPL-3.0. **solid** https://github.com/cgwire/zou . Database not confirmed on the page (don't claim Postgres without checking).
- Dev docs: REST API with OpenAPI docs (api-docs.kitsu.cloud); Gazu = Python client "for scripting and pipeline tools"; JS SDK; CLI; custom actions, plugins with backend routes + embedded UI, event listeners, bots. **solid** https://dev.kitsu.cloud
- Data model: TV = Episode > Sequence > Shot; assets; task types; statuses default Todo / In Progress / Waiting for Approval / Approved / Retake; CSV import, EDL import (Avid/Premiere); roles Admin/Supervisor/Producer/Artist/Vendor/Client. **solid** (vendor blog) https://blog.cg-wire.com/kitsu-2d-production-setup/
- 2D shot pipeline example task types: Storyboard, Layout, Animation, Cleanup, Ink & Paint, Compositing, Background. (vendor blog, an example not a rule)
- FOST case study (2D service studio, Paris/Angouleme, founded 2018; Netflix series Splinter Cell; 60 -> 150 people; >8,000 shots on the instance; self-hosted Kitsu; pipeline team ~1.5 FTE across 3 people). **reported** (CGWire's own blog) https://blog.cg-wire.com/fost-animation-studio-kitsu/
  - FOST chose Kitsu in 2021 after finding ShotGrid-class tools too demanding to set up/maintain without dedicated IT (their words, per CGWire).
  - Automations: Kitsu casting data drives automated assembly of Toon Boom Harmony scenes; layout briefs stored as Kitsu metadata injected into Harmony scenes; quota tracking via the Kitsu API into custom views; custom supervisor "Validation Page". Publishing/latency issues as load grew.
- CGWire's TV page lists studios (Folimage, Xilam, Studio Liddell, ...): **curated logos, unverified usage**.
- Independent view: "perfect for indie and mid-sized studios", fewer bells than ShotGrid (one third-party review; weak).

## 2D / TV pipeline
- Toon Boom Harmony scripting: Qt Script (ECMAScript, ".js" files); interfaces include Extended Scripting, Control Center scripting (batch on Harmony Server DB, command line), Python interface (Harmony 24 docs; may vary by edition/version). External packages via TB_EXTERNAL_SCRIPT_PACKAGES_FOLDER. **solid** (official docs, version 24 era) https://docs.toonboom.com/help/harmony-24/premium/scripting/about-scripting.html
- 2D pipeline director (ScreenSkills, ~6 yrs old, DeadEndina on Netflix): folder structures, naming conventions, Harmony database, documentation; learned Harmony scripting via Toon Boom TD course. **reported/dated** https://www.screenskills.com/case-studies/animation-2d-pipeline-director-niki-kehoe/
- TV production reality: tight schedules, many episodes, service studios, outsourcing across studios; pipeline = naming + automation + tracking, much less renderer/USD than features. (Inference from the above; **unverified** as a general claim.)

## Interview prep: what job postings ask for
- Sony Pictures Imageworks Vancouver, Pipeline TD (mid): required "strong knowledge of Maya and Python", "PyQt/PySide UIs", "Linux", "git", CG/VFX production experience; plus: C++, Katana/Unreal/Houdini/USD. Responsibilities: tools for the Maya animation pipeline (rigging, animation, sim, layout, cameras, asset mgmt), scene dependencies, automated publishing, data validation. **solid** (single employer listing) https://builtin.com/job/pipeline-td/2611011
- Search summary across postings (aggregators, may be stale): Python baseline; ShotGrid (API, event handlers, SGTK/toolkit) most common tracker, ftrack alternative; USD a plus not hard requirement (sometimes with Alembic, OCIO); Docker/CI/cloud preferred in some; render managers Deadline/Tractor; Git/Perforce; Qt/PySide; entry-level postings exist (FutureWorks: 0-3 yrs, will train). **reported** (small sample)
  - https://futureworks.recruitee.com/o/python-pipeline-developer , https://www.hollylist.com/jobs/JYZXGBT2KGxZYwKKT (Scanline), https://jobgether.com/offer/6a804df0490731f1e1a50ad8-developpeur-pipeline---pipeline-developer-maya
- Glassdoor-style reports: mostly behavioural/portfolio; "have you written relevant Python", "walk through code you wrote", working with artists, inheriting messy code. **reported/weak**. No actual technical-test formats found.
- VFX Reference Platform CY2027 (finalized 2026-08-30): C++20, Python 3.13.x, Qt 6.8.x (PySide 6.8), EL9-class Linux (glibc 2.34), NumPy 2.4, OpenEXR 3.5, OCIO 2.6, ACES 2.0, Alembic 1.8. Defines the versions DCC vendors build against, so it tells you which Python/Qt your tools will run on. **solid** https://vfxplatform.com/
- Kitsu did NOT appear in any job posting found. Don't claim it's required.

## Still unverified
- Frequency data: no real survey; the "most used" ranking is from a handful of postings.
- Which tracker dominates TV/2D vs features (ShotGrid vs ftrack vs Kitsu): only anecdotal.

---
# Round 3: small vs big studio, starting point (map post = post 1; study guide = post 2)

## Small vs large (general pattern: **reported**, interviews/blogs, no survey)
- Small studios: generalist TDs touching many departments ("we're a small studio, so I get to touch a lot of different departments"); pipeline kept lean; mostly off-the-shelf software + a few custom scripts. Pearl Studio TD interview (Satish Goda): https://sagar.substack.com/p/talking-to-satish-goda-pearl-studio
- Large studios: TDs dedicated per department (lighting, animation...); proprietary tools in some departments; long-established studios find change harder; big productions planned years ahead leaving little room to test new tools. Same interview. Netflix Animation's own page lists separate engineer disciplines (rendering, rigging, sim, production systems, pipeline, toolchain) and TD craft groups. **solid** for Netflix structure.
- Smaller studios/post houses "often more accessible entry points than major VFX houses" (ArtBlast guide, **reported**) https://artblast.co/what-does-a-pipeline-td-do/
- Pearl interview advice: CS degree not required; learn fast, care about helping artists; Python "bread and butter"; automate repetitive work. **reported** (single interview)

## Real small/mid studio examples (CGWire blog = vendor-written case studies; treat as **reported**)
- Wizz Studio (Paris, Quad group): ~20 employees and 40 permanent artists; 2-person dev team (lead dev + pipeline TD); maintain QuadPype (internal fork of OpenPype, now AYON) next to Kitsu; sync service listening to Kitsu events; tools: casting-based scene loading, publisher checking frame ranges vs Kitsu, "Build First Workfile"; also TVPaint, Photoshop, Nuke, Blender. Challenges: small team limits what they ship; 2D/3D culture gap; Windows accented filenames break things (they silently rename); advice: talk to artists before setting constraints. https://blog.cg-wire.com/wizz-hybrid-pipeline
- Normaal Studio (Angouleme/Paris/Quebec): ~80 animators, 52-episode series "Woolly Woolly", built a 3D pipeline on Blender + Kitsu + AYON + OpenCue (rendering on idle artist workstations since no farm budget); pipeline team grew from 1 lead to 5 pipeline TDs; lit low-def render published at each animation submission; hero versions; batch rig update tool; Kitsu<->AYON sync contributed back to AYON. Quote: "You cannot have your perfect universal pipeline that everyone could use. But you can build a good one which fits the studio culture." https://blog.cg-wire.com/normaal-oss-pipeline
- FOST (see round 2): ~1.5 FTE pipeline across 3 people at 60-150 staff.
- Blender Artists forum comment: even OpenPype needs a full-time Python/IT dev (community opinion, weak).

## Starting point / entry
- Pipeline TD usually not true entry level; junior title = assistant TD / junior pipeline TD (ScreenSkills page via search summary; page 403'd for me, **unverified direct**). ArtBlast: "Many studios hire junior TDs specifically to grow them internally"; artist/generalist/production assistant first is another route. Steps: Python -> DCC time -> get inside a studio -> build tools that solve a problem you hit -> technical portfolio (GitHub code, UI screenshots, written breakdowns, skip animated shots) -> apply to junior roles, small studios first. **reported**
- Pixar: "Technical Director Intern, Global Technology, Summer 2026" (Emeryville): writes pipeline software for departments like lighting and animation; asks C/C++ or Python; eligible: at least junior in CS/CG/digital art, or recent grads within first year. Pixar Undergraduate Program (PUP): 12-week course taught by Pixar TDs, judged on demo reel and coding work. **reported** (search summary of listing pages; Disney careers page not fetchable by me; cycles already closed)
- Netflix Animation: has an "Early Careers" nav link; no details found. **unverified**
- Entry-level small-studio posting: FutureWorks Python pipeline developer 0-3 yrs, will train. **reported**

## Concrete first project (**solid**: tutorial exists)
- CGWire tutorial: Blender (bpy) renders low-res preview of animated cube -> ffmpeg timestamp+watermark -> gazu uploads to a task in a local Kitsu (Kitsu Docker dev setup). Code repo: https://github.com/cgwire/blender-kitsu-low-res-preview . Tutorial: https://blog.cg-wire.com/blender-kitsu-low-res-preview/
- Follow-ons: Kitsu versioning add-on, breakdown-driven shot building (gazu + GLB import): https://blog.cg-wire.com/blender-kitsu-versioning-addon , https://blog.cg-wire.com/blender-kitsu-breakdown-automation
- Blender Studio Kitsu add-on (Sprite Fright) as mature reference: https://studio.blender.org/blog/kitsu-addon-for-blender
- Note: I have NOT run this tutorial. If Mateo builds it, first-person claims come from him.

## Decisions (2026-10-13)
- Two posts: map first, study guide second. Map outline agreed: intro, areas (show-specific tools cut to one sentence), small vs big, where to start, pointer to study guide.
- Mateo builds the CGWire tutorial first so the closing section is first-hand. Repo: ~/Repositorios/blender-kitsu-preview (see its HANDOFF.md). Post drafting waits on it. A clone of cgwire/kitsu-docker exists at ~/Repositorios/kitsu-docker.
