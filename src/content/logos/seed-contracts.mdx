---
title: "Seed Contracts: Declarative Dependency in Multi-Repo Systems"
description: "When you operate 89 repositories across 8 organizations, dependency knowledge must be machine-readable. The AUTONOMY sprint deployed seed.yaml contracts to 82 repos, creating a 115-edge dependency mesh with 5 autonomous agents."
pubDate: 2026-02-13
featured: true
tags: ["Seed-yaml", "Contracts", "Dependencies", "Orchestration", "Microservices"]
---

# Seed Contracts: Declarative Dependency in Multi-Repo Systems

When you operate a system with 89 repositories across 8 organizations, the question is not whether your components depend on each other. They do. The question is whether you know how they depend on each other, and whether that knowledge is encoded in a form that machines can reason about or trapped in the heads of the people who built the system.

For the first several months of the organvm project, our dependency knowledge was implicit. We knew, in the way that experienced practitioners know things, that ORGAN-I's theoretical frameworks informed ORGAN-II's generative engines, that ORGAN-II's creative artifacts fed ORGAN-III's commercial products, that ORGAN-IV's orchestration layer touched everything. We knew the shape of the system the way a gardener knows the shape of a garden — through daily contact, through intuition, through the accumulated memory of having planted every seed.

This knowledge was sufficient when the system was small. It became insufficient as the system grew. And the specific way it became insufficient taught us something important about the difference between implicit and explicit dependencies, between ad-hoc integration and declarative contracts, between knowing a system and encoding that knowledge in a form that survives beyond the knower.

This essay tells the story of the AUTONOMY sprint, during which we deployed seed.yaml contracts to 82 of 88 repositories, creating a machine-readable dependency mesh with 115 edges, 5 autonomous agents, and a weekly system graph that the orchestrator-agent builds by crawling every seed.yaml in the network. It is a story about infrastructure, but it is also a story about epistemology — about the conditions under which distributed knowledge becomes reliable.

## The Integration Problem at Scale

Integration is the problem that emerges when components must work together. In a monolithic system — a single codebase, a single deployment, a single team — integration is handled by the compiler, the type system, the test suite, and the code review process. Dependencies are explicit (import statements), versioned (package.json), and validated (CI pipeline). When something breaks, the error is local and the fix is obvious.

In a distributed system — multiple codebases, multiple deployments, multiple teams — integration is harder. Dependencies cross repository boundaries, organizational boundaries, and sometimes language and platform boundaries. The compiler cannot see them. The type system cannot check them. The test suite, if it exists, must make network calls to verify them. When something breaks, the error is distributed and the fix may require coordinated changes across multiple components.

The organvm system is not a distributed software system in the conventional sense. Most of its repositories contain documentation, not running services. There are no API calls between repos, no message queues, no database connections, no network protocols. But it is a distributed knowledge system, and knowledge systems have integration problems that are structurally identical to software integration problems.

Consider a concrete example. ORGAN-I contains a repository called `recursive-engine--generative-entity` that defines a theoretical framework for recursive self-generating systems. ORGAN-II contains several repositories that implement generative art engines based on this framework. If the theoretical framework changes — if a core concept is refined, a dependency is added, a constraint is removed — the ORGAN-II implementations may need to be updated. But how does the change propagate? Who is notified? How is the consistency between theory and implementation verified?

Before seed contracts, the answer was: manually. We would remember that certain ORGAN-II repos depended on certain ORGAN-I repos, and we would update them when needed. This worked when we could hold the entire dependency graph in our heads. It stopped working when the graph exceeded the capacity of human working memory — somewhere around 30-40 repositories, we estimate.

The problem is not that we forgot dependencies (though we did, occasionally). The problem is that we could not be sure we had not forgotten them. The absence of a comprehensive dependency record meant that every change carried the risk of an undetected inconsistency, and the risk grew with every new repository added to the system. We were building on sand — not because the individual components were unreliable, but because the connections between them were invisible.

## Why Declarative Contracts

There are two basic approaches to managing dependencies in distributed systems: imperative and declarative.

The imperative approach says: write code that does the integration. Build scripts that check dependencies, webhook handlers that propagate changes, cron jobs that validate consistency. The integration logic is expressed as behavior — as sequences of operations that produce the desired state.

The declarative approach says: write documents that describe the integration. Define what each component produces, what it consumes, what events it responds to. The integration logic is expressed as structure — as relationships between components that an orchestrator can reason about and act upon.

The imperative approach is more flexible. You can encode arbitrary integration logic in code. The declarative approach is more transparent. You can read the contracts and understand the system without running anything.

We chose the declarative approach for three reasons.

First, transparency. The organvm system is a public process project. Its architecture should be legible not just to its operators but to its audience — to the grant reviewers, hiring managers, fellow practitioners, and curious strangers who encounter it. A seed.yaml file that says "this repo produces theoretical-framework and consumes nothing" is readable by anyone. A webhook handler that does the same thing is readable only by people who understand the codebase.

Second, composability. Declarative contracts can be combined, analyzed, and transformed by tools that know nothing about the specific domain. A graph-building tool can read seed.yaml files and produce a dependency graph without knowing anything about what "theoretical-framework" or "creative-artifact" means. An imperative integration script, by contrast, embeds domain knowledge in its logic and cannot be composed with other scripts without understanding their internals.

Third, evolution. The organvm system is young and its architecture is still evolving. Declarative contracts can be extended by adding new fields without breaking existing consumers. Imperative integration scripts must be rewritten when the integration model changes. We expect our understanding of inter-organ dependencies to deepen over time, and we want an integration model that can deepen with it.

The choice of YAML as the contract format was pragmatic. YAML is human-readable, widely supported, already used in GitHub Actions workflows, and familiar to every developer who has touched a CI/CD pipeline. JSON would have worked equally well for machine consumption but is harder for humans to read and write. TOML was considered but lacks YAML's support for complex nested structures. The format is not the important part; the declarative model is the important part.

## The seed.yaml Schema

The seed.yaml schema (v1.0) defines the contract that every repository publishes about itself. It is intentionally simple — simple enough to be written by hand for any repository, complex enough to capture the relationships that matter.

The schema has nine top-level fields. `schema_version` identifies the contract format version, enabling future evolution without breaking existing contracts. `organ` identifies which of the eight organs the repository belongs to. `org` identifies the GitHub organization. `repo` identifies the repository name. `metadata` provides human-readable context (description, status, documentation tier).

The three relationship fields are the heart of the schema. `produces` declares what the repository outputs — what artifacts, data, knowledge, or services it makes available to other repositories. `consumes` declares what the repository requires from other repositories — what artifacts, data, knowledge, or services it depends on. `subscriptions` declares what events the repository wants to be notified about — what changes in other repositories or organs should trigger attention.

Each produces entry has a name (e.g., "theoretical-framework"), a type (e.g., "knowledge"), and a description. Each consumes entry has a name, a type, and a source (the org/repo that provides it). Each subscription entry has an event type (e.g., "registry-update") and a source.

The simplicity of the schema is a feature, not a limitation. It captures the essential relationships — who produces what, who consumes what, who listens to what — without attempting to capture the full semantics of those relationships. The full semantics live in the documentation, the code, and the human understanding of the system. The seed.yaml contract provides the skeleton; the rest provides the flesh.

A critical design decision was to make produces and consumes entries reference logical artifacts, not physical files. A repository does not declare that it consumes `/path/to/file.json`; it declares that it consumes `theoretical-framework` from `organvm-i-theoria/recursive-engine--generative-entity`. This level of indirection is essential because it decouples the logical dependency from the physical implementation. The theoretical framework might be expressed as a markdown document today and as a structured data file tomorrow; the consuming repository does not need to know or care, as long as the logical artifact remains available.

## Building the Dependency Graph

With 82 seed.yaml files deployed, we can build a dependency graph by crawling all of them and resolving the produces/consumes relationships. The orchestrator-agent does this weekly, running every Monday at 07:00 UTC. The resulting graph has 115 edges connecting the 82 contracted repositories.

The graph reveals structure that was invisible when the dependencies were implicit. The most connected node is ORGAN-IV's `orchestration-start-here`, which consumes information from and subscribes to events across all eight organs. This is expected — the orchestration layer is, by definition, the most connected part of the system. The second most connected node is `registry-v2.json` (mediated through the meta-organvm organization), which is consumed by every repository that needs to know the current state of the system.

The graph also reveals the organ-level flow that our no-back-edges rule enforces. The dominant flow direction is I to II to III: Theory produces knowledge that Art consumes, Art produces artifacts that Commerce consumes. There are no edges from III to II or from II to I. This is verified automatically by the dependency validator, which runs weekly (Monday at 06:30 UTC, thirty minutes before the orchestrator builds the graph) and rejects any seed.yaml that introduces a back-edge.

The back-edge prohibition is the most important architectural constraint in the system, and it is worth explaining why. In a creative institution, the most common failure mode is commercial capture: the commercial arm begins dictating requirements to the creative arm, which begins dictating requirements to the theoretical arm, until the entire system is optimized for revenue rather than insight. The no-back-edges rule makes this failure mode structurally impossible. ORGAN-III can consume what ORGAN-II produces, but it cannot require ORGAN-II to produce anything specific. The creative and theoretical organs are upstream; the commercial organ is downstream. Information flows like water: downhill only.

The 115-edge graph also reveals orphans — repositories that neither produce nor consume anything, that are disconnected from the dependency mesh. Before the AUTONOMY sprint's orphan resolution phase, 34 repositories were in this state. These were not necessarily unimportant repositories; many of them were self-contained projects (a standalone web application, a single-purpose utility, a documentation-only repository) that genuinely did not depend on or provide resources to other repositories.

## Orphan Resolution

The existence of orphans posed both a practical and a philosophical problem.

Practically, orphan repositories are invisible to the orchestration layer. The orchestrator-agent cannot include them in the system graph. The dependency validator cannot check their relationships. The essay-monitor and distribution-agent cannot know about content they produce. A system that claims to coordinate 89 repositories but only has dependency information for 48 of them is not really a coordinated system; it is a partially coordinated system with a large uncoordinated periphery.

Philosophically, orphan repositories challenged our claim that the organvm system is a system — that its components are interconnected parts of a coherent whole, not a random collection of projects that happen to share a GitHub organization. If a third of the repositories have no declared relationships to anything else, in what sense are they part of the system?

The resolution was to recognize that dependencies can exist at multiple levels of abstraction. A standalone web application in ORGAN-III may not consume a specific artifact from a specific ORGAN-II repository, but it does consume "creative-artifact" from ORGAN-II as an organ — its design, its visual identity, its content strategy are informed by the aesthetic principles established in the Art organ. Similarly, it produces "commercial-revenue" that ORGAN-III as an organ relies on, even if no specific repository consumes that revenue.

We resolved the 34 orphans by adding organ-level produces/consumes entries to their seed.yaml files. These entries are deliberately abstract: ORGAN-II repositories produce "creative-artifact" and consume "theory" from ORGAN-I. ORGAN-III repositories produce "commercial-value" and consume "creative-artifact" from ORGAN-II. The entries are true — these dependencies do exist — even though they are not as specific as the repository-level dependencies that connect, say, a generative art engine to a specific theoretical framework.

This resolution increased the edge count from approximately 80 to 115 and brought every contracted repository into the dependency graph. The system is now fully connected: every repository either produces something that another repository consumes, consumes something that another repository produces, or both. The graph is a single connected component, not a collection of disconnected subgraphs.

Whether this resolution is satisfying depends on your philosophy of dependency management. A strict interpretation would say that organ-level dependencies are too vague to be useful — that declaring "consumes creative-artifact from ORGAN-II" is not much more informative than declaring "is part of the organvm system." A generous interpretation would say that organ-level dependencies capture real relationships that exist whether or not they are specified, and that making them explicit (even at a coarse granularity) is better than leaving them implicit.

We hold the generous interpretation, with a commitment to refinement. As the system matures, we expect organ-level dependencies to be replaced by more specific repository-level dependencies as the actual flows of information become clearer. The current organ-level entries are a floor, not a ceiling.

## The Orchestrator Loop

The seed.yaml contracts are not passive documents. They are inputs to an active orchestration loop that runs continuously (or rather, on a weekly cycle) to maintain the system's operational coherence.

The loop has five stages. First, the dependency validator crawls all seed.yaml files and checks for structural integrity: valid schema, no back-edges, no circular dependencies, no references to nonexistent repositories. Second, the orchestrator-agent builds the system graph from all valid contracts and compares it to the previous week's graph, identifying new edges, removed edges, and changed contracts. Third, the promotion-recommender evaluates repositories against promotion criteria (DESIGN_ONLY to SKELETON, SKELETON to PROTOTYPE, PROTOTYPE to PRODUCTION) and generates recommendations. Fourth, the essay-monitor checks ORGAN-V's public-process repository for new essays and notifies the distribution pipeline. Fifth, the distribution-agent audits POSSE (Publish on Own Site, Syndicate Elsewhere) channels and tracks which essays have been distributed and which have not.

Each stage is implemented as a GitHub Actions workflow in `orchestration-start-here`, and each workflow reads seed.yaml contracts to determine its scope and targets. The orchestrator-agent, for example, does not hardcode a list of repositories to check; it discovers them dynamically by querying the GitHub API for all repositories in all eight organizations and reading their seed.yaml files. This means that adding a new repository to the system requires only creating a seed.yaml file; the orchestration loop will discover it on its next run and integrate it into the system graph.

The loop is designed to be eventually consistent rather than immediately consistent. A change to a seed.yaml file is not propagated instantly; it is picked up on the next weekly run. This is a deliberate trade-off: immediate consistency would require webhook-based notification (which adds complexity and fragility), while weekly eventual consistency is simple, robust, and sufficient for a system whose pace of change is measured in days and weeks, not minutes and seconds.

The eventual consistency model also means that the system can tolerate transient inconsistencies without breaking. If a repository's seed.yaml is temporarily invalid (because it references a repository that has been renamed, for example), the validator will flag it, the orchestrator will skip it, and the next weekly run will pick it up after the reference is fixed. The system degrades gracefully rather than failing catastrophically.

This is an important property for any governance system, and it is worth stating explicitly: governance systems must be more fault-tolerant than the systems they govern. If the orchestration layer is more fragile than the repositories it orchestrates, it becomes a liability rather than an asset. Our orchestration loop is designed to be the most reliable part of the system, because it is the part that everything else depends on.

## The Broader Pattern

The seed.yaml contract system is not specific to the organvm project. It is an instance of a broader pattern that we believe is applicable to any multi-repository creative or technical system: declarative dependency management through self-describing contracts.

The pattern has three essential elements. First, every component publishes a contract that declares what it produces, consumes, and subscribes to. Second, an orchestrator periodically crawls all contracts and builds a system graph. Third, validators check the graph for structural integrity (no cycles, no back-edges, no dangling references) and flag violations.

This pattern can be implemented with any contract format (YAML, JSON, TOML, even structured markdown), any orchestrator (GitHub Actions, Kubernetes operators, cron jobs, manual scripts), and any validator (custom code, off-the-shelf graph analysis tools, human review). The specifics matter less than the pattern: make dependencies explicit, make them machine-readable, and check them automatically.

The payoff is not just operational efficiency (though that is real). The payoff is epistemic: you know what you have. You know what depends on what. You know where the risks are, where the bottlenecks are, where the single points of failure are. You know these things not because you remember them but because they are written down in a form that machines can verify.

For creative institutions — for artist-built systems that coordinate multiple domains of practice across multiple organizational units — this epistemic payoff is especially valuable. Creative systems are notoriously resistant to documentation. The dependencies between a theoretical framework and a generative art engine are not the kind of thing that typically gets written down; they live in the heads of the people who built both. The seed contract pattern externalizes this knowledge, making it available for inspection, critique, and — crucially — maintenance by people who were not present when the dependency was established.

We are not aware of other creative institutions that use declarative dependency contracts. We suspect this is because most creative institutions do not think of themselves as distributed systems, even when they are. A theater company with a writing department, a design department, a production department, and a marketing department is a distributed system. A university with seven colleges and a shared library is a distributed system. A record label with multiple artists, a shared studio, and a coordinated release calendar is a distributed system. All of these institutions would benefit from making their internal dependencies explicit and machine-readable.

The seed.yaml pattern is our contribution to this conversation. It is not the only way to solve the integration problem in creative institutions, but it is a way, and it works, and it is available for anyone to adopt, adapt, or critique. The schema is public. The orchestrator code is public. The system graph is public. That is the nature of ORGAN-V: the public process makes everything visible, including the infrastructure that makes the process possible.

One hundred and fifteen edges. Eighty-two contracts. Five agents. One graph. The system knows itself, and because it knows itself, it can grow without losing coherence. That is what declarative dependency buys you: not just coordination, but self-knowledge.
