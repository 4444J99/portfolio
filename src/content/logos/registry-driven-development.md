---
title: "Registry-Driven Development: How a JSON File Governs 81 Repositories"
description: "The design and evolution of registry-v2.json — a single JSON file that serves as the authoritative source of truth for 81 repositories across 8 GitHub organizations, encoding status, dependencies, documentation tiers, and promotion state."
pubDate: 2026-02-13
featured: true
tags: ["Registry", "Infrastructure", "Single-source-of-truth", "Governance", "Platform-engineering", "Json-schema"]
---

# Registry-Driven Development: How a JSON File Governs 81 Repositories

## 1. The Problem of State Sprawl

At some point in the growth of any multi-repository system, a question arises that no individual repository can answer: what is the state of the whole? Not the state of one service, one library, one deployment — the state of everything. Which repositories are production-ready? Which are skeletons awaiting implementation? Which depend on which? Which have been validated this week, and which have not been touched in months? Which are public, which are private, and why?

For a system with five repositories, you can hold this state in your head. You open each repo, read the README, check the last commit date, glance at the CI badge, and form a mental model of the system's health. For a system with fifteen repositories, you can maintain a spreadsheet. For a system with eighty-one repositories distributed across eight GitHub organizations — spanning epistemological theory, generative art, commercial SaaS products, orchestration infrastructure, public essays, community spaces, marketing distribution, and meta-governance — you cannot hold the state anywhere that is informal, distributed, or implicit. You need a canonical record. You need a registry.

The eight-organ system reached this threshold early. By the time the initial audit was complete in early February 2026, the system comprised 46 repositories across 4 GitHub organizations, with 3 additional organizations yet to be created. The repositories ranged from production Python packages with 1,254 tests to empty shells created as organizational placeholders. Some had comprehensive READMEs; most had none. Some were public; some were private for legitimate reasons (commerce infrastructure, governance internals); some were private by accident. Dependencies existed between repositories but were documented nowhere except in import statements buried in source code. The promotional state of each repository — whether it had been validated, whether it was ready for public presentation, whether it had been written about in the public-process essays — existed only in the memory of the system's creator.

This is the problem of state sprawl: when the authoritative state of a system is distributed across dozens of locations (README files, GitHub settings, CI configurations, mental models, Slack messages, commit histories), no single operation can query the whole. Every script that needs to know "how many repos are in PRODUCTION status" must independently discover that answer by querying the GitHub API, parsing README files, or asking a human. Every document that cites a number — "81 repositories," "64 in PRODUCTION," "8 operational organs" — is copying from an implicit source that may have already changed. And when those sources diverge, as they inevitably do, the system's self-description becomes unreliable. The documentation says 72 repos. The GitHub API returns 79. The registry says 81. Which is true? Without a single source of truth, the answer is: whichever one you happened to check most recently.

The registry exists to make that question unnecessary.

## 2. Why JSON? Schema Design Choices and Their Tradeoffs

The registry is a JSON file. Not a YAML file. Not a TOML file. Not a SQLite database. Not a PostgreSQL table behind an API. A single JSON file, checked into a Git repository, readable by humans and machines alike, diffable in pull requests, and requiring no runtime dependency to query. This choice is deliberate, and its tradeoffs are worth examining.

**JSON over YAML:** YAML is more human-readable in some contexts — its indentation-based syntax avoids the visual noise of braces and brackets. But YAML's flexibility is also its weakness. Implicit type coercion (the string `"no"` becomes boolean `false`), significant whitespace that is invisible in many editors, and multiple valid representations of the same data structure make YAML a poor choice for a source of truth that must be unambiguous. JSON has one way to represent a string, one way to represent a number, one way to represent a boolean. When a validation script parses `registry-v2.json`, the types are exactly what they appear to be. There is no silent coercion, no ambiguity about whether a value is a string or a boolean.

**JSON over a database:** A database would provide schema validation, query capabilities, transactions, and concurrent access control — all features that the registry lacks. But a database introduces a runtime dependency. To query the registry, you need a running database server, connection credentials, and a query language. To diff two versions of the registry, you need a schema migration tool. To review a change to the registry, you need to translate a database transaction into something a human can read in a pull request. JSON in Git provides all of these operations natively: `git diff` shows exactly what changed, `git log` shows who changed it and when, `git blame` shows the history of every line, and any programming language can parse the file without additional dependencies. The registry is read far more often than it is written. Optimizing for read accessibility — any script, any language, any context — is the correct tradeoff.

**JSON over TOML:** TOML excels for configuration files where the structure is flat and the hierarchy is shallow. The registry's structure is deeply nested: top-level metadata, then organs, then repositories within organs, then fields within repositories, then arrays of dependencies and promotion obligations within those fields. TOML's table syntax becomes unwieldy at this depth. JSON's recursive structure — objects containing objects containing arrays containing objects — maps naturally to the registry's domain model.

The tradeoff that JSON does not resolve is validation. JSON has no built-in schema enforcement. A malformed entry — a missing `status` field, a `documentation_status` with a typo, a `dependencies` array containing a string that does not match any repository — will be silently accepted by the JSON parser. The registry addresses this through external validation scripts rather than schema-level constraints. This is a pragmatic choice: the registry changes frequently during sprints (dozens of field updates in a single session), and the validation overhead of a formal schema (JSON Schema, for example) would slow the editing workflow without proportional benefit. The validation scripts run after edits, catching errors before they propagate.

The result is a 1,778-line JSON file that encodes the complete state of 81 repositories. It is not elegant. It is not small. But it is unambiguous, machine-readable, human-reviewable, and version-controlled. These properties matter more than elegance.

## 3. The Fields That Matter

Every repository entry in the registry carries a set of fields that collectively describe its current state, its role within the system, and its readiness for external evaluation. The schema has evolved through three versions (v0.1, v0.2, v0.3), with each version adding fields that the previous version's operations revealed as necessary. Understanding which fields exist and why they exist illuminates the governance model that the registry encodes.

A representative entry from ORGAN-I (Theory):

```json
{
  "name": "recursive-engine--generative-entity",
  "org": "organvm-i-theoria",
  "status": "ACTIVE",
  "updated": "2026-02-10",
  "public": true,
  "description": "RE:GE — A symbolic operating system for myth, identity, ritual, and recursive systems. 21 organ handlers, ritual syntax DSL, workflow orchestration, external bridges (Obsidian/Git/Max-MSP).",
  "documentation_status": "FLAGSHIP README DEPLOYED",
  "portfolio_relevance": "CRITICAL - Definitive ORGAN-I expression; 1,254 tests, 85% coverage, pure Python",
  "dependencies": [],
  "promotion_status": "PUBLIC_PROCESS",
  "tier": "flagship",
  "last_validated": "2026-02-11",
  "implementation_status": "PRODUCTION",
  "ci_workflow": "ci-python.yml",
  "platinum_status": true
}
```

A representative entry from ORGAN-III (Commerce), which carries additional domain-specific fields:

```json
{
  "name": "classroom-rpg-aetheria",
  "org": "organvm-iii-ergon",
  "status": "DEPLOYED",
  "public": true,
  "type": "SaaS",
  "revenue": "active",
  "description": "Educational RPG system for classroom engagement",
  "documentation_status": "DEPLOYED",
  "portfolio_relevance": "CRITICAL - Revenue proof point",
  "dependencies": ["organvm-iii-ergon/gamified-coach-interface"],
  "promotion_status": "PUBLIC_PROCESS",
  "tier": "standard",
  "last_validated": "2026-02-11",
  "implementation_status": "PRODUCTION",
  "ci_workflow": "ci-typescript.yml",
  "platinum_status": true,
  "promotion_obligations": [
    {
      "type": "essay",
      "target_org": "organvm-v-logos",
      "target_name": "15-aetheria-rpg-post-mortem.md",
      "description": "Post-mortem essay on classroom RPG design and deployment",
      "status": "COMPLETE"
    }
  ]
}
```

Several field categories deserve explanation.

**The implementation status state machine.** The `implementation_status` field encodes a four-state progression: `DESIGN_ONLY` (documentation exists but no code), `SKELETON` (minimal project scaffolding), `PROTOTYPE` (functional code with tests, not yet production-grade), and `PRODUCTION` (complete implementation with CI, tests passing, documentation deployed). This progression is a state machine: repositories advance through these states as implementation work proceeds, and each transition has implicit quality gates. A repository cannot be `PRODUCTION` without a passing CI workflow. A repository cannot be `PROTOTYPE` without functional tests. The current distribution — 64 PRODUCTION, 1 PROTOTYPE, 3 SKELETON, 13 DESIGN_ONLY — is itself a portfolio metric, visible at a glance in the registry's `implementation_status_distribution` summary field.

**The promotion status state machine.** The `promotion_status` field encodes a separate progression that governs cross-organ visibility: `LOCAL` (exists within its organ), `CANDIDATE` (nominated for cross-organ promotion), `PUBLIC_PROCESS` (documented in ORGAN-V essays), `GRADUATED` (fully promoted and cross-referenced), and `ARCHIVED` (retired). This state machine is distinct from `implementation_status` because a repository can be PRODUCTION-ready code that has not yet been written about publicly, or conversely, a DESIGN_ONLY concept that has been the subject of a public essay.

**Domain-specific extensions.** ORGAN-III repositories carry two fields that other organs do not: `type` (SaaS, B2B, B2C, B2B2C, internal) and `revenue` (active, pre-revenue, internal). These fields exist because ORGAN-III's portfolio angle is commercial viability, and a grant reviewer or hiring manager evaluating the commerce organ needs to see at a glance which repositories represent revenue-generating products versus internal tooling. The schema accommodates this asymmetry by treating organ-specific fields as optional extensions to the core schema, not as required fields on every entry.

**Promotion obligations.** The `promotion_obligations` array tracks commitments that a repository's promotion status creates. When an ORGAN-I theory repository is promoted to CANDIDATE for art (cross-organ to ORGAN-II), a promotion obligation is created: a new repository in ORGAN-II that represents the artistic expression of that theory. When an ORGAN-III commerce repository is promoted to PUBLIC_PROCESS, a promotion obligation for an ORGAN-V essay is created. These obligations are tracked in the registry itself, making the governance workflow auditable from a single file.

## 4. Validation as Enforcement

A source of truth is only as reliable as its enforcement mechanism. Without validation, the registry is a document of intent — a description of what the system should look like, not what it actually looks like. The gap between should and does is where governance fails.

The organvm system enforces registry accuracy through five validation scripts, each targeting a specific category of potential divergence between the registry and reality.

**V1/V2: Link Audit and Placeholder Scan.** The first validation pass extracts every markdown link from every deployed README across all 81 repositories and checks whether each link resolves. It also scans for placeholder markers — TBD, TODO, PLACEHOLDER, FIXME, "coming soon," "work in progress" — that indicate incomplete documentation. During the Phase 2 micro-validation sprint, this script audited 1,267 links across the entire system. The failures it caught were instructive: cross-references between organs that used old organization names (from before the Phase -1 org renaming), links to repositories that had been transferred between organizations, and README sections that referenced planned features with "coming soon" language that should have been updated when those features were implemented.

**V3: Registry-to-GitHub Reconciliation.** The reconciliation script reads every repository entry in the registry, queries the GitHub API for the corresponding repository, and checks three conditions: (1) does the repository exist on GitHub? (2) does it have a README? (3) does its GitHub description match the registry description? It also performs the reverse check: does GitHub contain any repositories that are not in the registry? This bidirectional reconciliation catches two failure modes. The first is registry optimism — entries for repositories that were planned but never created, or that were created and then deleted. The second is registry blindness — repositories that were created during a sprint but never added to the registry.

Both failure modes occurred during the system's development. During the Gap-Fill Sprint, 11 new repositories were created across ORGAN-II and ORGAN-VI. Each creation required updating the registry's repository list, the organ's `repository_count`, the system's `total_repos` count, the `total_repos_note`, and the `implementation_status_distribution` summary. Missing any one of these updates would cause the reconciliation script to report a discrepancy. In practice, the most common error was updating the repository list but forgetting to increment `repository_count` — a field that exists precisely so that documents citing "18 repos in ORGAN-I" can reference the registry rather than counting the array length themselves.

**V4: Dependency Graph Validation.** The dependency validator reads all `dependencies` arrays from the registry and constructs a directed graph. It then checks four invariants: (1) every dependency target exists as a repository in the registry, (2) no repository depends on itself, (3) no circular dependencies exist, and (4) no back-edges violate the constitutional flow direction. The constitution specifies that data flows from ORGAN-I (Theory) to ORGAN-II (Art) to ORGAN-III (Commerce) — meaning ORGAN-III repositories cannot depend on ORGAN-II repositories, and ORGAN-II repositories cannot depend on ORGAN-III. This directional constraint is not merely organizational preference; it encodes a philosophical position about how theory becomes art and art becomes commerce, a one-way transformation that the dependency graph must respect.

The V4 script validated 31 dependency edges across the system. The DFS cycle detection found zero circular dependencies. The back-edge detection found zero violations. These are not trivially easy results — in a system where repositories were transferred between organizations, renamed, and reorganized multiple times during a two-day sprint, maintaining dependency graph integrity required that every structural change be reflected in the registry before the next validation pass.

**V5/V6: Constitution and Organ Checks.** The final validation scripts verify that the registry's state is consistent with the project constitution's invariants: all 8 organs are represented, every organ has at least one flagship repository, no organ has zero public repositories, and the promotion state machine's transitions are valid (no repository can skip from LOCAL to GRADUATED without passing through CANDIDATE and PUBLIC_PROCESS).

Together, these five validation layers create a closed loop: the registry describes the system, the scripts verify the description against reality, the discrepancies are fixed, and the registry is re-validated. The entire validation suite runs in under fifteen minutes and produces machine-readable reports that are themselves checked into the repository.

## 5. The Single Source of Truth Discipline

Declaring a file to be the "single source of truth" is easy. Maintaining that discipline across a system with 81 repositories, 17 published essays, 8 organizational profiles, a governance specification, an implementation plan, a public-process map, and a GitHub Actions automation stack is difficult. The difficulty is not technical — it is social and procedural. Every document that cites a number from the registry must cite the current number. Every script that reads the registry must read the current version. Every workflow that updates the registry must update all derived fields, not just the primary field.

The system learned this lesson through the "stale numbers" problem. During the PROPULSION Sprint on February 12, 2026, 17 repositories were promoted from PROTOTYPE to PRODUCTION status. The registry was updated: `implementation_status_distribution` changed from 47 PRODUCTION to 64 PRODUCTION. But the application materials — the grant proposal drafts, the resume entries, the portfolio descriptions, the public-process essays — still cited the old numbers. The master summary said "47 PRODUCTION." The orchestration document said "65 repos with CI workflows" when the current count was 67. The portfolio strength note referenced "270K total words" when the current total was approximately 320K.

These are not contradictions in the strong sense — no document was making a false claim at the time it was written. They are contradictions in the practical sense: a reader encountering the system for the first time and reading multiple documents would encounter conflicting numbers and have no way to determine which was current. The stale numbers problem is a direct consequence of violating the single-source-of-truth discipline. If every document referenced the registry dynamically (as the GitHub Actions workflows do), the numbers would always be current. But most documents are static markdown files, and static files cannot reference dynamic values.

The organvm system resolves this through a post-sprint reconciliation protocol: after any sprint that changes registry numbers, a sweep of all documents that cite those numbers must be performed. The commit message for the PROPULSION Sprint captures this discipline explicitly: "fix stale numbers across all application materials." This is not an elegant solution. It is a manual process that scales poorly and depends on human diligence. But it is the honest solution for a system whose documents are static markdown rather than dynamically rendered templates. The alternative — building a templating system that injects registry values into every document at build time — is a future improvement that the current system's architecture can accommodate but has not yet implemented.

The deeper lesson is that the single-source-of-truth discipline is not about the file. It is about the workflow. The registry is only a source of truth if every operation that changes system state changes the registry first, and every operation that reads system state reads from the registry. When a new repository is created, the registry must be updated before the README is written, because the README's cross-references depend on the registry's dependency data. When a repository is promoted, the registry must be updated before the essay is published, because the essay's claims about system state depend on the registry's counts. The file is inert. The discipline is active.

## 6. Evolution: From V1 to V2

The first version of the registry was generated on February 3, 2026, during the initial audit of the system. It contained 46 repositories across 4 GitHub organizations — the original organizations that predated the eight-organ restructuring. Its schema was minimal: each repository entry carried `name`, `org`, `url`, `status`, `updated`, `description`, and a `relationships` object with `depends_on`, `consumed_by`, and `public` fields. The top-level summary had five counts: `total_repos`, `operational_organs`, `incomplete_organs`, `missing_organs`, and `total_organizations`.

Registry v1 was adequate for its purpose: a snapshot of the system as it existed before the restructuring. But it was inadequate for the governance operations that the restructuring required. Several limitations became apparent immediately.

**No documentation tracking.** V1 had no field for whether a repository's README had been deployed, what quality tier it had achieved, or whether it had been validated against the rubric. During the Bronze Sprint, when 7 flagship READMEs were written, there was no place in the registry to record their completion. The `documentation_status` field was added in v2 to track this.

**No promotion state.** V1's `relationships.consumed_by` field indicated which organs used a repository's output, but it did not track the promotion lifecycle — whether a repository had been nominated for cross-organ promotion, whether that promotion had been fulfilled, or what obligations the promotion created. The `promotion_status` and `promotion_obligations` fields were added in v2 to make the governance workflow auditable.

**No implementation tracking.** V1's `status` field was a single value (ACTIVE, ARCHIVED, etc.) that conflated implementation state with operational state. A repository could be "ACTIVE" with no code, or "ACTIVE" with a full test suite and CI pipeline. The `implementation_status` field in v2 (schema v0.3) introduced the four-state machine — DESIGN_ONLY, SKELETON, PROTOTYPE, PRODUCTION — that separates what the repository is from how far along its implementation is.

**No aggregate metrics.** V1 had no `implementation_status_distribution` summary, no per-organ `repository_count`, no `total_repos_note` explaining what the count includes. Every operation that needed these aggregates had to compute them by iterating the repository arrays. V2 introduced these summary fields so that documents could reference them directly, and so that changes to the distribution would be visible in `git diff` without requiring readers to count array entries.

**No CI tracking.** V1 had no field for which CI workflow a repository used, or whether CI was passing. The `ci_workflow` and `platinum_status` fields were added in v0.3 (the Platinum Sprint schema extension) to track which repositories had been brought to full infrastructure readiness.

The v1-to-v2 migration was not a one-time operation. It was a progressive schema evolution that occurred across multiple sprints, with each sprint revealing a new governance operation that required a new field. This pattern — operations revealing schema requirements — is the fundamental dynamic of registry-driven development. You do not design the perfect schema in advance. You design a minimal schema, begin governing with it, discover what you cannot express, and extend the schema to accommodate the new requirement. The registry's schema version field (`schema_version: "0.3"`) tracks this evolution and serves as a compatibility marker for validation scripts that depend on specific fields being present.

## 7. The Registry as Orchestration Infrastructure

The registry does not live in a documentation repository. It lives in `orchestration-start-here`, the flagship repository of ORGAN-IV (Orchestration). This placement is deliberate: the registry is not merely a record of the system's state. It is the data structure that makes governance executable.

All five GitHub Actions workflows specified in the automation stack follow the same architectural pattern: trigger event, read registry, apply governance rules, execute actions, update registry. The `validate-dependencies` workflow reads the registry's dependency arrays to determine whether a pull request introduces a back-edge. The `monthly-organ-audit` workflow reads the registry's `last_validated` timestamps to identify stale repositories. The `promote-repo` workflow reads the registry's `promotion_status` field to determine whether a repository is eligible for promotion and writes the new status back to the registry after the promotion is complete.

This pattern — logic lives in data files, not workflow code — is the registry's deepest contribution to the system's architecture. The GitHub Actions YAML files are generic: they know how to read a JSON file, check conditions, and execute GitHub API calls. The specific conditions — which organs can depend on which, what promotion obligations are triggered by which transitions, how many days of inactivity constitute staleness — are all encoded in the registry and its companion file `governance-rules.json`. Changing a governance rule does not require modifying workflow code. It requires editing a JSON value and committing the change.

This separation of mechanism from policy is a well-known principle in systems design, but it is rarely achieved in practice for project governance. Most multi-repository systems encode their governance rules in CI/CD pipeline logic, in branch protection settings, in repository-level configuration files, or in human-enforced conventions documented in a wiki. The organvm system's contribution is to demonstrate that a single JSON file can serve as the policy layer for an entire multi-org system, with the mechanism layer (GitHub Actions) remaining generic and reusable.

The practical implications are significant. When the ASCENSION Sprint added two new repositories (`art-from--auto-revision-epistemic-engine` and `art-from--narratological-algorithmic-lenses` in ORGAN-II), the only configuration change required was adding entries to the registry. The validation scripts, the audit workflows, the dependency checker, and the promotion tracker all picked up the new repositories automatically, because they all read from the registry. No workflow code was modified. No CI pipeline was reconfigured. The registry entry was the deployment.

## 8. Lessons Learned: The Registry Pattern Beyond This System

The registry pattern is not unique to the organvm system. Any project that manages multiple repositories — a microservices architecture, a monorepo with multiple packages, an open-source organization with dozens of libraries — faces the same fundamental problem: where does system-level state live? The registry pattern offers a concrete answer.

**Lesson 1: Start with the operations, not the schema.** The temptation is to design a comprehensive schema before any governance operations exist. This produces fields that are never populated and misses fields that operations actually need. Registry v1 had a `relationships.consumed_by` field that was never used by any script. Registry v2 added `implementation_status` because a sprint revealed that "ACTIVE" was not granular enough. Design the schema iteratively, driven by the operations that read and write it.

**Lesson 2: Every aggregate needs a source field.** If any document in your system says "81 repositories," that number must live in a field in the registry, not be computed by counting array elements. This is not redundancy — it is a citation target. When the number changes, `git diff` shows the field changing, and every document that references the field can be updated. When the number is implicit (computed from array length), changes are invisible in the diff, and stale references accumulate silently.

**Lesson 3: Validation scripts are not optional.** Without automated reconciliation between the registry and reality, the registry will diverge from the system it describes. The divergence will be small at first — a missing repository here, an outdated status there — and then suddenly large, when a sprint creates a dozen repositories and the registry is not updated in parallel. Validation scripts must be run after every significant change, and their results must be committed alongside the registry changes.

**Lesson 4: The registry is a contract, not a description.** A registry that merely describes the system's current state is a snapshot that becomes stale immediately. A registry that serves as the input to automated workflows — CI validation, dependency checking, promotion tracking, health monitoring — is a contract that the system is obligated to satisfy. The difference is enforcement. Make the registry the data source for your automation, and divergence becomes a build failure rather than a documentation debt.

**Lesson 5: Version the schema.** The registry's `schema_version` field is a small addition that provides disproportionate value. When validation scripts depend on fields that were added in a later schema version, the version field allows the scripts to fail gracefully on older registry versions rather than crashing on missing keys. When the schema evolves, the version bump is a clear signal in the commit history that the registry's structure has changed, alerting all consumers to update their parsing logic.

**Lesson 6: Accept the tradeoffs.** The registry is a flat file with no concurrent access control, no query optimizer, no referential integrity constraints, and no transactional guarantees. These limitations are real. If two sprints attempt to update the registry simultaneously, merge conflicts will occur. If a validation script is interrupted mid-run, the registry may be in an inconsistent state. If the registry grows to thousands of entries, parsing the entire file to query a single field becomes inefficient. These limitations are acceptable for a system of 81 repositories governed by a single maintainer. They would not be acceptable for a system of 10,000 repositories governed by a hundred teams. The registry pattern scales to the point where a flat file does not, and then it must evolve into something with a runtime — an API, a database, a service. But that evolution should be driven by actual scaling pressure, not by premature architectural ambition.

## 9. Connection to the Larger System

The registry is the gravitational center of the eight-organ system. ORGAN-I's theory repositories, ORGAN-II's art repositories, ORGAN-III's commerce repositories — all of these are entries in the registry before they are anything else. A repository that does not exist in the registry does not exist in the system, regardless of whether it exists on GitHub. This is a strong claim, and the system enforces it: the V3 reconciliation script flags any GitHub repository that is missing from the registry as an anomaly requiring resolution.

The registry connects to every layer of the system's architecture. The implementation plan (`implementation-package-v2.md`) references registry counts and status distributions. The orchestration specification (`orchestration-system-v2.md`) defines governance rules that operate on registry fields. The public-process essays reference registry data to make claims about the system's scale and maturity. The GitHub Actions workflows read the registry to make automated decisions. The validation scripts verify the registry against GitHub's actual state. Remove the registry, and the system loses its self-knowledge. Every tool would need to independently discover what the registry currently provides as a single read operation.

This is the registry's deepest function: it makes the system legible to itself. An 81-repository system distributed across 8 organizations is, without a registry, an opaque collection of individual projects that happen to share a naming convention. With a registry, it is a governed system with known state, validated dependencies, tracked promotions, and auditable history. The registry does not make the system work — the code, the documentation, the infrastructure all exist independently. The registry makes the system knowable. And for a system that presents itself as a portfolio, as evidence of architectural reasoning and organizational capacity, knowability is the fundamental requirement. You cannot present what you cannot describe. You cannot describe what you cannot measure. And you cannot measure what you have not recorded.

A JSON file, 1,778 lines, version-controlled, machine-readable, human-reviewable. It is not glamorous infrastructure. It does not involve Kubernetes, or service meshes, or distributed consensus algorithms. It is a flat file that a Python script reads with `json.load()`. But it is the file that makes 81 repositories into a system rather than a collection. That is the work of governance: not to be impressive, but to be true.
