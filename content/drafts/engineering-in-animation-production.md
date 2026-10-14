---
title: Where software engineers fit in animation production
date: 2026-10-14
summary: A map of where engineers work in animated series and films, how a small studio differs from a big one, and a first project to try.
author: mateo-jacques
draft: true
---
An animated show is made in departments. Story artists draw the boards, modelers build the characters, riggers give them controls, animators move them, lighters light the scenes, and a renderer turns everything into frames. Each handoff is a place where files can break, and engineers work in those gaps. This post is a map of where, written for a developer wondering whether animation has room for them.

I'm only covering animated productions: series, films and shorts. Games have animation too, but their jobs are a different set.

I don't work in a studio yet. What follows comes from studio pages, open source projects and a few case studies, plus one small thing I built, which I'll get to at the end.

## Where engineers work

**Pipeline and tools.** This is the job I'm aiming for. The software artists use (Maya, Houdini, Blender and similar, often called DCCs, for digital content creation) is general purpose, and the studio's pipeline is the glue and the custom tools around it. A pipeline TD (technical director) writes that code. A [Sony Pictures Imageworks listing](https://builtin.com/job/pipeline-td/2611011) describes it as tools for the Maya animation pipeline across rigging, animation, simulation, layout, cameras and asset management, and asks for strong Maya and Python, plus PyQt/PySide for building interfaces.

**Scenes, color and editorial.** Every application in a pipeline tends to have its own scene format, and no other application can read it. [USD](https://openusd.org/release/intro.html) is the shared one. It started at Pixar in 2012 and lets artists layer changes on top of an asset without editing the asset itself. [OpenTimelineIO](https://opentimelineio.readthedocs.io/en/latest/) does a similar job for editorial data like cuts and tracks, and [OpenColorIO](https://opencolorio.org/) keeps color consistent across more than 40 applications.

**Rendering.** A renderer computes the final image from the scene. Studios write their own. DreamWorks built [MoonRay](https://openmoonray.org/), which renders its features and has been open source since 2023. Netflix Animation has a proprietary path tracer called Glimpse, and lists rendering as its own engineering discipline on [its technology page](https://www.netflixanimation.com/technology).

**Render farms.** Rendering a film takes many machines, and something has to decide which job runs where. [OpenCue](https://docs.opencue.io/) grew out of Sony Pictures Imageworks' in-house render manager and is now an Academy Software Foundation project. Normaal Studio had no farm budget, so according to [CGWire's case study](https://blog.cg-wire.com/normaal-oss-pipeline) it ran OpenCue on idle artist workstations. This is the part of the field closest to infrastructure work. Netflix's page even says continuous integration and delivery "is not just for software."

**Tracking and review.** A series has thousands of shots, and someone needs to know which are done, which are waiting on notes and which are late. [Flow Production Tracking](https://www.autodesk.com/campaigns/flow-production-tracking) (formerly ShotGrid) tracks shots, assets, tasks and reviews. [Kitsu](https://kitsu.cg-wire.com/) is an open source alternative. It's a web application with a Vue front end, a Python and Flask API called Zou, a REST API and a Python client called gazu. For a web developer this is the most familiar ground I found. It's also where [FOST](https://blog.cg-wire.com/fost-animation-studio-kitsu/), a 2D studio, builds Toon Boom Harmony scenes automatically from Kitsu's casting data (this comes from CGWire's own write-up).

**2D and TV.** Series run on episodes and deadlines, and a lot of them are 2D. Harmony, a common 2D tool, can be scripted in [Qt Script](https://docs.toonboom.com/help/harmony-24/premium/scripting/about-scripting.html), which looks like JavaScript. My read is that TV pipeline work is more about naming, automation and tracking than renderers and USD, but I don't have a source that says so directly.

**Show-specific tools.** Some films need engineering for their look. A SIGGRAPH talk on [Spider-Man: Into the Spider-Verse](https://history.siggraph.org/learning/repainting-the-spider-verse-by-maccari-grochola-nicol-blaskovic-and-fapso) covers bringing a watercolor painting application into Imageworks' pipeline.

## Small studio or big studio

The jobs change shape with the size of the studio. A TD at Pearl Studio says in [an interview](https://sagar.substack.com/p/talking-to-satish-goda-pearl-studio) that at a small studio they touch a lot of departments, and that the pipeline stays lean, mostly off-the-shelf software with a few custom scripts. Wizz, a Paris studio with about 20 employees and 40 permanent artists, has [a two-person dev team](https://blog.cg-wire.com/wizz-hybrid-pipeline). They maintain a fork of an open source publishing tool and a service that listens to Kitsu events. The hard parts they describe are about people: 2D artists want freedom, and 3D pipelines need constraints.

Big studios split the work. Netflix Animation lists separate disciplines for engineers (animation and rigging, rendering, procedural geometry and simulation, production systems, pipeline, toolchain) and separate TD groups for lighting, imaging, core assets and others. The Pearl TD says that at big studios TDs are tied to a department, and that studios that have been around longer find it harder to change how they work. Normaal Studio sits in between: about 80 animators, and a pipeline team that grew from one lead to five TDs.

Getting in looks different too. Pixar's most recent technical director internship I found (summer 2026, now closed) was for students in computer science or graphics, asking for C/C++ or Python. One [guide to the Pipeline TD role](https://artblast.co/what-does-a-pipeline-td-do/) says smaller studios are often easier first doors and that studios hire junior TDs to grow them internally. As far as I can tell, a small studio is the realistic first door, and a big one is where you go deep on a single thing.

## A first step

Pipeline TD isn't usually an entry-level title. The same guide suggests building small tools that fix a problem you've run into, publishing the code with a written breakdown, and leaving the animated shots out of the portfolio.

I picked CGWire's [tutorial](https://blog.cg-wire.com/blender-kitsu-low-res-preview/) as my first tool. Blender renders a low-resolution preview of a spinning cube, ffmpeg stamps a timestamp and a watermark on it, and gazu uploads it to a task in a Kitsu I run locally in Docker. I wrote it so one command does all three steps and stops at the first failure.

Three things went wrong that I'd have liked to know beforehand. The tutorial's render code fails on Blender 5.2.2, because Blender 5 added a media type setting that has to be set to video before the ffmpeg format is allowed. Logging in to Kitsu with gazu failed with a 405 error because my host address was missing `/api`, and the error never mentions it. And Blender exits with code 0 when your script crashes unless you pass `--python-exit-code 1`, so a chained command keeps going after a failed render.

If you're a developer thinking about this field, that's a good first evening: it touches a DCC's scripting, a tracker's API and a bit of automation. Next I'll write about what I'd study first if you want to interview for these roles.
