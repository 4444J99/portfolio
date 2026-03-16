---
title: "Provenance as Practice: Tracking 2,012 Files Across Eight Organs"
description: "Every creative practitioner accumulates material without structure. The ALCHEMIA sprint inventoried 2,012 files, classified 94.5%, and deployed 568 to repos — a case study in why provenance tracking is essential at institutional scale."
pubDate: 2026-02-13
featured: false
tags: ["Provenance", "Material-tracking", "Digital-archives", "Classification", "Ingestion"]
---

# Provenance as Practice: Tracking 2,012 Files Across Eight Organs

Every creative practitioner accumulates material. Sketches, drafts, prototypes, experiments, correspondence, references, notes, recordings, screenshots, exports, backups, and the uncategorizable detritus of a practice that has been running long enough to produce more than anyone can remember. The material accumulates in folders and drives and cloud accounts, and it accumulates without structure, because the creative process that produces it is not structured — it is associative, improvisational, opportunistic, and frequently chaotic.

At some point, the accumulation becomes a problem. Not because any individual file is lost (though many are), but because the relationships between files are lost. The sketch that inspired the prototype that became the product that funded the next project — that chain of provenance exists in the practitioner's memory, and when the memory fades, the chain breaks. The material persists, but its meaning degrades. A folder of unlabeled JPEG files is not an archive; it is a graveyard.

This essay is about what happens when you take the accumulation seriously — when you decide that the material deserves the same institutional attention as the finished work, and you build the infrastructure to provide it. During the ALCHEMIA sprint, we inventoried 2,012 files from across our creative practice, classified 94.5% of them into organ-specific categories, and deployed 568 to their proper repositories. The process was not glamorous. It was, in many ways, the least creative work we have done in the entire organvm project. It was also, we believe, among the most important.

## What Is Provenance?

The word "provenance" comes from the French provenir, to come from. In art history, provenance refers to the documented history of ownership of a work — the chain of custody from the artist's studio to the collector's wall to the museum's gallery. Provenance matters because it establishes authenticity (this painting is really by Vermeer) and legality (this painting was not looted during World War II) and context (this painting was owned by this collector, who displayed it alongside these other paintings, in this particular arrangement).

In archival science, provenance has a broader meaning. It refers to the relationship between records and the activities that produced them. The principle of provenance (also called respect des fonds) holds that records should be organized according to their origin — according to the person, organization, or process that created them — rather than according to their subject matter. A letter from Einstein to Bohr about quantum mechanics belongs in the Einstein archive, not in a folder labeled "quantum mechanics," because the letter's meaning depends on who wrote it, when, in response to what, and the archival arrangement should preserve that context.

For creative practitioners operating at institutional scale, provenance is both of these things: a chain of custody (where did this file come from? what process produced it? who touched it along the way?) and an organizational principle (this file belongs with these other files because they share an origin, not because they share a subject). The two meanings converge on a single insight: the context in which a thing was created is as important as the thing itself, and any system that strips that context away — that files the letter under "quantum mechanics" rather than "Einstein correspondence" — is destroying information that can never be recovered.

Digital creative practice makes provenance simultaneously easier and harder. Easier because digital files carry metadata — creation dates, modification dates, file types, sometimes GPS coordinates and device identifiers. Harder because digital files are trivially copyable, and every copy breaks the chain of custody. When you drag a file from your desktop to a Dropbox folder to a Google Drive to a GitHub repository, each transfer creates a new copy with new metadata, and the original provenance — the fact that this file was created on this date, on this device, in the context of this project — is progressively obscured.

The ALCHEMIA sprint was our attempt to arrest this degradation. Not to achieve perfect provenance (which is impossible for historical files whose metadata has already been stripped) but to achieve good-enough provenance — to classify each file by organ, assign it to a repository, and record the classification decision in a form that future operators can review and revise.

## The Inventory Challenge

The first step was to know what we had. This sounds simple. It was not.

The 2,012 files were distributed across multiple storage locations: local directories, cloud drives, email attachments, screenshot folders, export archives, and the download purgatory that every practitioner maintains without admitting it. Some files had meaningful names (`organ-ii-generative-palette-study-v3.png`). Most did not (`IMG_4382.jpg`, `Document (3).pdf`, `Untitled-1.sketch`). Some files had meaningful directory structures (organized by project). Most were in flat directories or in directory structures that reflected the storage medium's defaults rather than any intentional organization.

The inventory process itself was mechanical: traverse all storage locations, collect file paths, extract metadata (size, type, creation date, modification date), and produce a flat manifest. We used a Python script that walked directory trees and wrote CSV rows. The script was not sophisticated; it did not need to be. The difficulty was not technical but conceptual: deciding which storage locations to include, which to exclude, and how to handle duplicates (files that existed in multiple locations, sometimes with different names).

We chose to be inclusive — to inventory everything and filter later. This meant that the 2,012-file manifest included files we knew were irrelevant (system files, cache artifacts, temporary exports), files we suspected were duplicates, and files we could not identify without opening them. The manifest was a raw material, not a finished product. The classification step would refine it.

The inclusive approach was deliberate. In archival practice, the worst mistake is not to include too much; it is to exclude something that turns out to matter. The cost of including an irrelevant file in the inventory is low (one extra row in a CSV). The cost of excluding a relevant file is high (a broken provenance chain that cannot be repaired). We chose the lower-cost error.

## Classification Rules

With the manifest in hand, we needed to classify each file — to assign it to an organ and, ideally, to a specific repository within that organ. The classification rules had to be simple enough to apply consistently, flexible enough to handle the diversity of our material, and transparent enough to audit after the fact.

We developed three classification methods, applied in priority order.

The first method was directory-to-organ mapping (`dir_to_organ`). This was the simplest rule: if a file lived in a directory whose name matched an organ or project, classify it accordingly. Files in a directory called `theory/` or `theoria/` were classified as ORGAN-I. Files in a directory called `art/` or `poiesis/` were classified as ORGAN-II. Files in a directory called `commerce/` or `ergon/` were classified as ORGAN-III. And so on. This method was the most reliable because directory names, when they exist, are the strongest signal of provenance — the practitioner who created the directory was making an intentional organizational decision.

The second method was staging directory matching (`staging_dir_match`). During previous sprints, we had created staging directories for specific deployment operations — directories with names like `deploy-organ-ii-readmes/` or `staging-organ-iii-products/`. Files in these directories could be classified by the organ referenced in the directory name. This method was less reliable than the first (staging directories reflect intended deployment, not original provenance), but more reliable than the third.

The third method was content keyword analysis (`content_keyword`). For files that could not be classified by their directory location, we examined their content (for text files) or their filenames (for binary files) for keywords associated with specific organs. A file containing the word "recursive" or "epistemology" was likely ORGAN-I material. A file containing "generative" or "installation" was likely ORGAN-II. A file containing "SaaS" or "pricing" was likely ORGAN-III. This method was the least reliable because keyword presence is a weak signal — the word "recursive" might appear in a commercial product description, and "installation" might refer to software installation rather than art installation.

The three methods, applied in order, classified 94.5% of the 2,012 files. The remaining 5.5% (approximately 110 files) could not be classified by any automated rule and were set aside for manual review. This is an acceptable ratio for a first pass. Perfect classification was never the goal; tractable classification was.

Each classification decision was recorded in the manifest alongside the file's metadata: which method was used, which organ was assigned, which repository (if determinable), and a confidence score (high for `dir_to_organ`, medium for `staging_dir_match`, low for `content_keyword`). This audit trail is essential. It allows us — or anyone who comes after us — to review the classification decisions, challenge them, and revise them without re-running the entire classification pipeline.

## Deployment Pipeline

Classification is not deployment. Knowing that a file belongs to ORGAN-II does not put it in ORGAN-II's repository. The deployment pipeline bridges this gap, moving classified files from their current storage locations to their assigned repositories.

The pipeline had to handle several complications. First, file format normalization. Some files needed to be converted before deployment: screenshots needed to be compressed, documents needed to be converted to markdown, data files needed to be re-encoded as UTF-8. Second, naming normalization. Files with names like `IMG_4382.jpg` needed to be renamed to something meaningful before deployment. Third, conflict resolution. Some files were classified into repositories that already contained files with the same name or overlapping content. Fourth, permission checking. Some repositories were branch-protected (requiring pull requests rather than direct pushes) or archived (rejecting all pushes).

We built the pipeline as a Python script that read the classified manifest, applied normalization rules, checked for conflicts, and deployed files using the GitHub API (specifically, the `gh api repos/ORG/REPO/contents/PATH --method PUT` pattern that creates individual commits per file). The script was idempotent — running it twice with the same manifest produced the same result — and it maintained a deployment log that recorded every file deployed, every conflict encountered, and every error raised.

The deployment was not a single operation. It was a series of operations spread over several days, because the sheer volume of API calls (568 file deployments, each requiring a base64-encoded PUT request) exceeded what could be done in a single session without hitting rate limits. We deployed in batches of approximately 100 files, reviewing each batch's deployment log before proceeding to the next.

Of the 1,902 classified files (94.5% of 2,012), we deployed 568 — approximately 30%. The remaining 70% were classified but not deployed, for various reasons: they were duplicates of files already in the target repositories, they were low-quality or incomplete, they were personal notes not intended for institutional inclusion, or they were in formats that the target repositories could not accommodate without additional infrastructure (video files, for example, which GitHub repositories handle poorly).

The 568 deployed files represent a significant institutional asset. They include design studies, prototype screenshots, configuration files, data exports, research notes, correspondence excerpts (redacted), and draft documents that had been trapped in local storage and were now accessible to the orchestration layer. Each file's provenance — where it came from, how it was classified, when it was deployed — is recorded in the deployment log.

After the initial deployment, 8 files failed and were retried successfully. The final count of deployed files was 568, inclusive of the retries.

## The Triage Decision

The 5.5% of files that could not be classified automatically (approximately 110 files) presented a triage decision. We could invest additional effort in classifying them — developing more sophisticated keyword rules, examining their content manually, tracing their provenance through file system timestamps and cross-references. Or we could accept that some files will remain unclassified and move on.

This is a common decision in archival practice, and the conventional wisdom is clear: do not let the perfect be the enemy of the good. A 94.5% classification rate is excellent for a first pass. The unclassified files are not lost; they are flagged. They can be revisited later, when additional context (a new classification rule, a new organ, a new project that makes their provenance obvious) makes classification possible.

But the ALCHEMIA sprint included a more dramatic triage decision, which we call the CONVERGENCE triage. During classification, we discovered that 961 files had been assigned a target of `None` — they had been classified to an organ but not to a specific repository within that organ. These files were in a liminal state: we knew what domain they belonged to (Theory, Art, Commerce, etc.) but not where within that domain they should live.

The CONVERGENCE triage resolved these 961 entries through a combination of strategies. Some files were assigned to existing repositories based on content analysis. Some files were assigned to newly created repositories (several of the 7 new repositories created during the GENESIS sprint were motivated by the need for a home for orphaned materials). Some files were reclassified to a different organ based on closer examination. And some files were marked as `organ-level-asset` — material that belongs to the organ as a whole rather than to any specific repository, analogous to shared libraries or common resources.

The CONVERGENCE triage was the most intellectually demanding part of the ALCHEMIA sprint, because it required not just classification (which is mechanical) but judgment (which is not). Deciding that a file belongs in repository X rather than repository Y is a decision about the file's purpose, its audience, and its relationship to other files. It is, in a real sense, a curatorial decision — the same kind of decision that a museum curator makes when placing a painting in one gallery rather than another. The placement is not arbitrary; it creates context. A painting of a landscape means something different in a room full of landscapes than in a room full of portraits.

## Why Artists Need Archival Practice

We want to end with the argument that provenance tracking is not optional for creative practitioners who aspire to institutional scale. It is not a nice-to-have, not a someday-when-we-have-time task, not the kind of infrastructure that can be deferred indefinitely while the "real work" continues.

The argument rests on three claims.

First, creative material is not self-documenting. A finished painting has a title, a date, a signature, a provenance record maintained by galleries and collectors and insurance companies. A draft sketch has none of these things. A screenshot of a prototype has none of these things. A configuration file from an abandoned experiment has none of these things. And yet these materials — the drafts, the screenshots, the abandoned configurations — are often more valuable than the finished works, because they reveal the process that produced the works. They are the evidence of creative practice, and without provenance tracking, they are invisible.

Second, provenance degrades over time. The longer you wait to classify and archive your material, the harder it becomes. File metadata gets overwritten. Storage locations change. Memory fades. The sketch that you could have classified instantly when you drew it becomes unidentifiable six months later, because you cannot remember what project it was for, what problem it was solving, or why you made the choices you made. Provenance tracking is a practice that must be integrated into the creative workflow, not bolted on after the fact.

Third, provenance enables reuse. The most common reason creative practitioners give for not archiving their material is that they do not think they will need it again. This is almost always wrong. Creative practice is recursive — ideas recur, themes resurface, techniques get rediscovered. A sketch from three years ago may be exactly the starting point for a new project, if you can find it and if you can remember what it was about. A classified, archived sketch with provenance metadata is findable and contextualizable. An unclassified sketch in a random folder is neither.

The ALCHEMIA sprint was, in retrospect, an act of institutional memory. It took material that existed only in the practitioner's personal storage — and therefore only in the practitioner's personal memory — and transferred it to institutional storage, with institutional metadata, in a form that survives beyond the practitioner. The 568 deployed files are no longer dependent on one person's memory for their meaning. They are part of the system, classified by organ, assigned to repositories, recorded in deployment logs, and available for discovery by anyone who has access to the organvm organizations.

This is what institutions do. They take individual knowledge and make it collective. They take ephemeral material and make it persistent. They take personal meaning and make it shared. The ALCHEMIA sprint was the moment when organvm's material history transitioned from personal to institutional, and the mechanism of that transition was provenance tracking.

Two thousand and twelve files. Ninety-four point five percent classified. Five hundred and sixty-eight deployed. Nine hundred and sixty-one triaged through CONVERGENCE. Eight organ-aesthetic files propagated. Twenty-two tests passing. These numbers are the quantitative record of the sprint, and they tell a story of diligence and thoroughness. But the qualitative record is more important: we now know what we have, where it came from, and where it belongs. We have provenance, and provenance is the foundation of institutional memory.

The work of archival practice is never finished. New material accumulates daily. Classification rules need refinement. Deployment pipelines need maintenance. The 5.5% of unclassified files need periodic review. The deployment log needs to be reconciled with the actual state of the repositories. These are ongoing costs, and we do not minimize them.

But the alternative — allowing material to accumulate without structure, without classification, without provenance — is not a zero-cost option. It is a deferred-cost option, and the deferred cost grows with compound interest. Every month that passes without provenance tracking is a month of material that will be harder to classify later. Every year is a year of context that will be lost. Every decade is a decade of creative practice that will be invisible to the institution that inherits it.

We chose to pay the cost now, during the ALCHEMIA sprint, because we believe the organvm system deserves to remember where it came from. The files are the evidence. The provenance is the meaning. And the infrastructure that connects the two — the inventory, the classification rules, the deployment pipeline, the triage decisions — is the institution's memory, operating at a scale that no individual human memory can match.

Provenance is not glamorous work. It is not the kind of work that wins awards or attracts followers or generates revenue. It is maintenance work, archival work, care work. It is the work of tending to the material so that the material can tend to the practice. And it is, we believe, essential — not just for the organvm system, but for any creative practitioner who intends their work to outlast their memory.
