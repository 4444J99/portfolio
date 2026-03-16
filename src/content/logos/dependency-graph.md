---
title: "The Dependency Graph: No Back-Edges Allowed"
description: "There is one rule in the organvm system enforced above all others: dependencies flow in one direction. This essay explains where the no-back-edges rule came from, how it is enforced via CI, and why well-chosen constraints enable creativity rather than limiting it."
pubDate: 2026-02-13
featured: true
tags: ["Dependency-graph", "Dag", "Architectural-constraints", "Organ-system", "Governance"]
---

# The Dependency Graph: No Back-Edges Allowed

There is one rule in the organvm system that we enforce above all others. It is not the most complex rule. It is not the most nuanced. It is, in fact, almost embarrassingly simple to state: dependencies flow in one direction. Theory informs Art. Art informs Commerce. Commerce does not inform Theory. There are no back-edges in the graph.

This essay is about that rule — where it came from, what it means in practice, how we enforce it, and why it has become the single most important architectural decision in a system that spans 82 active repositories across 8 GitHub organizations. It is also about a broader claim: that well-chosen constraints do not limit creativity but enable it, and that the most productive thing you can do for a complex system is to tell it, clearly and irrevocably, where it cannot go.

## The Rule

Let us state it precisely. The organvm system is organized into eight organs, numbered I through VII plus a Meta organ. Each organ has a domain:

- **ORGAN-I (Theoria):** Theory — epistemology, recursion, ontology, philosophical frameworks
- **ORGAN-II (Poiesis):** Art — generative systems, performance, experiential works
- **ORGAN-III (Ergon):** Commerce — SaaS products, B2B tools, B2C applications
- **ORGAN-IV (Taxis):** Orchestration — governance, routing, system coordination
- **ORGAN-V (Logos):** Public Process — essays, building in public, documentation as practice
- **ORGAN-VI (Koinonia):** Community — salons, reading groups, collaborative spaces
- **ORGAN-VII (Kerygma):** Marketing — POSSE distribution, announcements, outreach
- **ORGAN-VIII (Meta):** Meta — umbrella organization, cross-organ governance

The dependency rule is this: **dependencies flow strictly from lower-numbered organs to higher-numbered ones within the production chain I→II→III, and ORGAN-IV governs all organs without being depended upon by them.** Concretely:

- ORGAN-II may depend on ORGAN-I (Art may draw from Theory)
- ORGAN-III may depend on ORGAN-II (Commerce may productize Art)
- ORGAN-III may depend on ORGAN-I (Commerce may directly apply Theory)
- ORGAN-IV may observe and govern any organ (Orchestration coordinates all)
- **ORGAN-I may NOT depend on ORGAN-II** (Theory does not require Art)
- **ORGAN-I may NOT depend on ORGAN-III** (Theory does not require Commerce)
- **ORGAN-II may NOT depend on ORGAN-III** (Art does not require Commerce)

The support organs (V, VI, VII) have their own dependency rules: they may consume from any production organ (I, II, III) but production organs do not depend on support organs. Meta (VIII) sits above everything, maintaining the registry and governance documents.

This structure forms a Directed Acyclic Graph — a DAG. Acyclic means no cycles. No cycles means no back-edges. No back-edges means that if you follow the dependency arrows, you will never return to where you started.

## Why Constraints Matter

Before we discuss why this particular constraint exists, we should address the meta-question: why have constraints at all? In a creative system — one that explicitly values generative art, theoretical exploration, and experimental practice — why would we voluntarily restrict what can depend on what?

The answer begins with an observation about creative work in general. Constraints are not the enemy of creativity. They are its precondition. A sonnet is fourteen lines of iambic pentameter with a specific rhyme scheme. A haiku is three lines of 5-7-5 syllables. A fugue is a contrapuntal composition built on a single subject introduced in imitation across multiple voices. These constraints do not make sonnets, haikus, and fugues less creative than free verse or improvisation. They make them differently creative — and, arguably, more creative, because the constraint forces the creator to find solutions that would never have been discovered in unconstrained space.

The same principle applies to software architecture, institutional design, and any complex system that must remain coherent as it grows. Without constraints, a system of 82 repositories would quickly become a tangle of mutual dependencies where everything depends on everything else and no change can be made in isolation. This is not a theoretical concern. It is the default outcome. Left unconstrained, systems tend toward maximum connectivity — every component reaches out to every other component that might be useful — and maximum connectivity produces maximum fragility.

The dependency constraint is our primary defense against this entropy. By dictating that information flows in one direction — from Theory through Art to Commerce — we ensure that the system has a legible structure that can be understood without examining every individual connection. You do not need to know the details of all 115 dependency edges to understand the system's architecture. You need to know the rule: lower informs higher, production does not depend on support, no back-edges.

This legibility is not just an aesthetic preference. It has practical consequences for maintenance, onboarding, and evolution. When a repository in ORGAN-I changes its interface, we know which repositories might be affected: those in ORGAN-II and ORGAN-III that depend on it. We do not need to check ORGAN-I itself for circular impacts, because the back-edge prohibition guarantees there are none. When a new contributor joins the project and wants to understand how information flows, we can explain the entire architecture in a single sentence. When we need to evolve the system — adding new organs, splitting existing ones, changing governance rules — we can reason about the impact of changes because the dependency structure is comprehensible.

## The DAG Structure

Let us be more precise about the graph. At launch, the organvm system had 31 validated dependency edges. After the AUTONOMY Sprint, which deployed seed.yaml contracts to 82 of 88 repositories and resolved 34 orphan connections, the system had 115 dependency edges. These edges form a DAG with the following properties:

**Maximum depth:** 3 (a dependency chain can pass through at most three organs: I→II→III)

**Fan-out by organ:**
- ORGAN-I produces theoretical frameworks consumed by 11 repositories across ORGANs II and III
- ORGAN-II produces creative artifacts consumed by 8 repositories in ORGAN-III
- ORGAN-III produces productized systems but nothing that feeds back upstream
- ORGAN-IV produces governance rules and routing consumed by repositories across all organs
- ORGAN-V produces public process documentation consumed primarily by ORGAN-VII for distribution

**Edge types:** We distinguish between three types of dependencies in our seed.yaml contracts:
- **produces:** what a repository creates that others may consume
- **consumes:** what a repository requires from other repositories
- **subscriptions:** event-based dependencies (a repository listens for events from another)

The DAG property is enforced at the organ level, not the repository level. Individual repositories within the same organ may have mutual dependencies — two ORGAN-II repositories might depend on each other, and that is permitted because intra-organ dependencies do not create cross-organ back-edges. The constraint applies to the inter-organ flow: ORGAN-II as a whole may depend on ORGAN-I as a whole, but not the reverse.

This is an important nuance. Within each organ, the repositories form their own dependency subgraph, which may contain cycles. We chose not to prohibit intra-organ cycles because the cost of enforcement would exceed the benefit. Repositories within the same organ are maintained by the same team (in our case, a team of one human and several AI agents), use similar technology stacks, and can be coordinated without formal dependency management. The cross-organ boundary is where coordination costs increase sharply, and that is where the constraint provides the most value.

## Enforcement via CI

A constraint that is not enforced is not a constraint. It is a suggestion. And suggestions, in our experience, are followed precisely until the moment when ignoring them becomes convenient.

We enforce the no-back-edges rule through a GitHub Actions workflow called validate-dependencies, which runs in two contexts:

1. **On push to registry-v2.json:** Whenever the registry — our single source of truth — is updated, the validation workflow runs and checks that no new dependency edges violate the DAG constraint.

2. **On schedule (weekly, Monday 06:30 UTC):** Even without registry changes, the workflow runs weekly to catch any drift that might have been introduced through direct repository changes.

The validation logic works as follows:

First, the workflow collects all seed.yaml files across all 82 active repositories. Each seed.yaml declares the repository's organ membership, its produces contracts, and its consumes contracts. The workflow builds a graph from these declarations.

Second, it assigns each organ a topological rank: ORGAN-I = 1, ORGAN-II = 2, ORGAN-III = 3. ORGAN-IV (Orchestration) is treated specially — it has rank 0, meaning it can observe any organ but no organ depends on it. The support organs (V, VI, VII) and Meta (VIII) have ranks that place them downstream of the production organs.

Third, it traverses every consumes edge and checks that the consumed resource comes from an organ with a lower or equal rank. If a consumes edge points from a lower-ranked organ to a higher-ranked organ — from ORGAN-I to ORGAN-III, for instance — the validation fails and the workflow reports the specific violating edge.

Fourth, it runs a cycle detection algorithm (a standard depth-first search with coloring) on the full cross-organ graph to catch any cycles that might arise from complex multi-organ dependency chains. This is a belt-and-suspenders check — the rank comparison should catch all violations, but cycle detection provides a second layer of assurance.

The workflow produces a validation report that lists all 115 edges, their source and target organs, and their validation status. This report is committed to the orchestration-start-here repository as a dated artifact, creating a historical record of the system's dependency structure over time.

When the validation fails — and it has failed, three times during development — the workflow blocks the registry update and opens a GitHub issue tagged with `dependency-violation`. The issue includes the specific violating edge, the two repositories involved, and a suggested resolution (typically: remove the back-edge dependency, or restructure the consuming repository to obtain the needed resource through a permitted channel).

We have deliberately made the validation workflow a blocking check rather than a warning. A warning would be ignored. A blocking check forces resolution before the registry can be updated. This creates friction, and that friction is the point. Adding a dependency should require thought. If the dependency violates the DAG constraint, the developer must either find an alternative approach or make the case that the constraint itself should be changed — which requires a governance discussion, not a quick workaround.

## What About Shared Libraries?

The most common objection to strict dependency ordering is the shared library problem. What if ORGAN-I develops a utility function that ORGAN-III also needs? Surely ORGAN-III should be able to import it directly rather than routing through ORGAN-II?

Our answer: yes, ORGAN-III can depend on ORGAN-I. The dependency rule permits skipping intermediate organs. The prohibited direction is backward — from lower numbers to higher numbers within the production chain. ORGAN-III depending on ORGAN-I is a forward dependency (skipping ORGAN-II) and is explicitly allowed.

But the deeper version of the objection is about shared infrastructure — code that every organ needs but that does not logically belong to any single organ. Logging utilities, configuration parsers, common data structures, authentication wrappers. Where do these live?

We handle this through ORGAN-IV (Taxis/Orchestration). ORGAN-IV exists precisely to provide cross-cutting concerns that every organ might need. Its governance role gives it a unique position in the dependency graph: it can be consumed by any organ, but no organ's production logic feeds back into it. ORGAN-IV provides the scaffolding; the production organs provide the substance.

In practice, shared utilities live in the orchestration-start-here repository or in dedicated ORGAN-IV infrastructure repositories. When an ORGAN-II repository needs a configuration parser, it imports it from ORGAN-IV, not from ORGAN-I or ORGAN-III. This keeps the production dependency chain clean while still allowing code reuse.

There is a cost to this approach. Some utilities are developed in the context of ORGAN-I (theory research) and then need to be extracted and moved to ORGAN-IV before ORGAN-III can use them. This extraction step adds work. But it also adds clarity: the act of extracting a utility from its original context and placing it in the shared infrastructure organ forces us to generalize it, to document it, to think about its interface. The utility that arrives in ORGAN-IV is better than the utility that was embedded in ORGAN-I, because extraction is a form of refinement.

We have also encountered situations where the shared library objection reveals a deeper architectural problem. If ORGAN-III needs something from ORGAN-I so frequently that the dependency flow feels burdensome, that may indicate that the boundary between ORGAN-I and ORGAN-III is drawn in the wrong place. Perhaps the shared functionality should be its own organ, or perhaps the repositories should be reorganized. The dependency constraint surfaces these architectural tensions rather than hiding them behind convenient imports.

## Living With the Rule

We have been living with the no-back-edges rule since the system's inception. It was not an afterthought or a retroactive constraint imposed on an existing system. It was a founding principle, articulated in the earliest planning documents and enforced from the first repository transfer.

Living with the rule means, concretely, that we sometimes cannot do the obvious thing. When an ORGAN-III product needs a theoretical framework from ORGAN-I, the obvious thing is to have ORGAN-I provide it directly through a runtime dependency. But if that dependency would create a situation where ORGAN-I also needs to know about ORGAN-III's specific requirements — shaping its theoretical output to serve commercial needs — then we have a de facto back-edge, even if it is not formally declared. We watch for these informal back-edges as carefully as we watch for formal ones.

Living with the rule also means that we have developed patterns for communication across organ boundaries that respect the dependency direction. When ORGAN-III discovers that it needs a theoretical framework that ORGAN-I has not yet developed, it does not create a dependency on ORGAN-I with a requirement specification attached. Instead, it publishes its need as a public process essay (through ORGAN-V), which ORGAN-I's maintainers can read and respond to voluntarily. The information flows backward through the public channel — through human communication, through essays and discussions — while the formal dependency graph flows forward through code.

This distinction between information flow and dependency flow is crucial. We do not prohibit ORGAN-I from knowing about ORGAN-III. We prohibit ORGAN-I from depending on ORGAN-III. Knowledge flows freely in all directions through documentation, essays, community discussions, and human judgment. Dependencies flow in one direction through code, interfaces, and contracts. The constraint applies to the machine-readable, automatically-enforceable layer of the system, not to the human layer.

This is, we believe, the right level of abstraction for an architectural constraint. Constraining human communication would be both impractical and counterproductive — people need to talk across boundaries, and creative insights often arise from cross-pollination between domains. But constraining formal dependencies is both practical and productive — it keeps the system maintainable, comprehensible, and evolvable.

After nine sprints and 115 dependency edges, the rule has held. It has been tested by edge cases, challenged by convenience, and defended by validation. It has forced us to think more carefully about where code lives, how interfaces are designed, and what it means for one domain to "depend on" another. It has made the system harder to build and easier to understand.

We would not build it any other way.

## The Philosophical Foundation

There is a reason we chose the word "Theoria" for ORGAN-I — the organ of theory, the foundational layer of the system. In the Aristotelian taxonomy from which our organ names are drawn, theoria (contemplation) precedes poiesis (making) which precedes praxis (action/commerce). This is not an arbitrary ordering. It reflects a philosophical claim about how knowledge flows: understanding precedes creation, which precedes application.

Our dependency graph is, in a sense, an engineering implementation of this philosophical claim. Theory produces frameworks that Art consumes and transforms into creative works. Art produces artifacts that Commerce consumes and transforms into products. The flow is from the abstract to the concrete, from the general to the specific, from understanding to application.

The no-back-edges rule protects this philosophical ordering from erosion. Without it, commercial pressures would eventually reshape theoretical inquiry — ORGAN-I would begin producing frameworks optimized for ORGAN-III's product needs rather than frameworks that pursue theoretical questions wherever they lead. Art would become subordinate to commerce, producing only what can be productized rather than what demands to be made. The entire system would collapse into a product development pipeline, which is precisely what it is designed not to be.

By enforcing the direction of dependency, we ensure that each organ can pursue its own telos — its own purpose, its own standards of excellence — without being captured by the organs downstream. ORGAN-I's theoretical work is judged by theoretical criteria. ORGAN-II's art is judged by aesthetic criteria. ORGAN-III's products are judged by commercial criteria. The organs inform each other, but they do not subordinate each other.

This is the deepest reason for the constraint. Not efficiency, not maintainability, not even comprehensibility — though it provides all of these. The deepest reason is institutional integrity. In a system where commerce can reshape theory, theory loses its independence and therefore its value. In a system where theory remains independent, it may produce insights that commerce never requested and never expected — insights that turn out to be the most commercially valuable of all, precisely because they were not designed to be.

The dependency graph is not just an architectural diagram. It is a statement of values. And the no-back-edges rule is the mechanism by which those values are enforced, not through aspiration or policy, but through automated validation that runs every Monday at 06:30 UTC and on every push to the registry.

Values that are not enforced are not values. They are wishes. We chose enforcement.

## Conclusion: The Freedom of Constraint

We began this essay with a claim: that well-chosen constraints enable creativity rather than limiting it. We end with the evidence.

The no-back-edges rule has forced us to develop communication patterns — public process essays, event-based subscriptions, shared infrastructure extraction — that we would not have developed in an unconstrained system. These patterns are, in themselves, creative solutions to the problems that the constraint creates. They make the system richer, more articulated, more expressive than it would be without the constraint.

The rule has forced us to think carefully about boundaries — where one domain ends and another begins, what it means to depend on something, how information should flow between components that must remain independent. This thinking has produced a system architecture that is more intentional, more legible, and more resilient than any architecture we could have designed in the absence of a structural constraint.

And the rule has protected the integrity of each organ, ensuring that theoretical inquiry, artistic practice, and commercial development can each proceed according to its own logic without being captured or distorted by the others. This protection is not a limitation on what the system can produce. It is a guarantee of the system's diversity — a guarantee that the outputs of Theory, Art, and Commerce will remain genuinely different, because the organs that produce them are genuinely independent.

Thirty-one edges at launch. One hundred fifteen after the AUTONOMY Sprint. Zero back-edges. Zero exceptions. Zero regrets.

The graph is acyclic. The system is free.
