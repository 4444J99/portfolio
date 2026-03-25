---
title: "Twelve Decisions That Shaped a 97-Repository System"
description: "Every architecture is a record of decisions. Here are the twelve choices — from Greek naming schemes to billing guardrails — that turned a solo creative practice into an eight-organ institutional system spanning 97 repositories."
pubDate: 2026-02-17
featured: false
tags: ["Architecture", "Decisions", "Adr", "Retrospective", "Systems-design", "Governance"]
---

# Twelve Decisions That Shaped a 97-Repository System

## The Invisible Architecture

Code is the visible part of a system. Decisions are the invisible part. A stranger reading your codebase sees *what* was built; they do not see *why* it was built that way, *what alternatives were considered*, or *what trade-offs were accepted*. Architecture Decision Records (ADRs) make the invisible visible. They are the "why" documentation that outlasts the code.

This essay tells the story of twelve decisions that shaped the organvm system — an eight-organ creative-institutional system spanning 97 repositories across 8 GitHub organizations, built by a solo operator in under two weeks. Each decision had alternatives. Each had trade-offs. Each is documented in a formal ADR. This is the narrative companion to those records.

The decisions are presented in approximate chronological order, but architecture is not strictly linear — some decisions enabled others, some constrained others, and a few had to be revisited after initial implementation revealed unexpected consequences.

---

## 1. Greek Suffixes for Organ Names

**The question:** How do you name 8 GitHub organizations so they're memorable, parseable, and systematically derivable?

**The decision:** Each organ's GitHub org follows the pattern `organvm-{roman-numeral}-{greek-suffix}`, where the suffix comes from classical philosophy: *theoria* (theory), *poiesis* (making), *ergon* (work), *taxis* (order), *logos* (speech), *koinonia* (fellowship), *kerygma* (proclamation).

**Why it matters:** The naming scheme is env-var-driven. Changing one variable (`ORGAN_PREFIX`) derives all 8 org names. This means the entire system is forkable — someone could instantiate their own eight-organ system with different naming in minutes. The Greek suffixes also communicate function to anyone scanning a GitHub org list: `organvm-ii-poiesis` tells you more than `organvm-art` because it carries the philosophical weight of the concept.

**The trade-off accepted:** Accessibility. Greek names are less immediately parseable for non-English speakers and require explanation in onboarding docs. We chose semantic precision over immediate legibility.

## 2. A Single JSON File as the Registry

**The question:** Where does the single source of truth for 97 repositories live?

**The decision:** Everything lives in `registry-v2.json` — a flat JSON file at the repository root. Not a database. Not distributed YAML files. One file, version-controlled, grep-able.

**Why it matters:** Zero infrastructure cost. Every registry change is a git commit with full diff visibility. CI scripts validate the file without runtime dependencies. The entire system inventory fits in 50KB. You can `grep -c '"ACTIVE"' registry-v2.json` and get an instant count.

**The trade-off accepted:** No relational queries. Cross-referencing (all ORGAN-III repos with ACTIVE status and SaaS type) requires JSON parsing, not SQL. At 97 repos this is fine. At 1,000 it would need reconsidering.

## 3. Unidirectional Dependency Flow

**The question:** How do you prevent 97 repositories from becoming a tangled dependency graph?

**The decision:** The dependency graph is a strict DAG with unidirectional flow: ORGAN-I (Theory) → ORGAN-II (Art) → ORGAN-III (Commerce). No back-edges. Ever.

**Why it matters:** This single constraint makes independent deployment possible. Each organ can be built, tested, and deployed without the others. A breaking change in ORGAN-III cannot cascade to ORGAN-I. The dependency direction mirrors the creative process: think → make → ship.

**The trade-off accepted:** Code duplication. If ORGAN-I and ORGAN-III both need a utility, it must live in ORGAN-I (upstream) or be duplicated. The rule was violated twice during early sprints and caught by CI — proving the validation works.

## 4. AI-Conductor Methodology

**The question:** How does a solo operator produce 404,000+ words of documentation in under two weeks?

**The decision:** The AI-conductor model: human directs, AI generates volume, human reviews and refines. Effort is measured in tokens expended (TE), not human-hours. A 3,000-word README takes ~72K TE — about 15 minutes of human review time on top of AI generation.

**Why it matters:** This is the foundational methodology that makes the entire system possible. Without it, the documentation corpus would have taken months. The TE budget model enables predictable planning — you can estimate the cost of an entire documentation sprint before starting it.

**The trade-off accepted:** Homogeneity. AI-generated text can feel uniform; human editorial passes are needed to inject authentic voice. And every factual claim requires verification against source material, because LLMs hallucinate.

## 5. The Promotion State Machine

**The question:** When does internal work become externally visible?

**The decision:** Two state machines. Cross-organ promotion: LOCAL → CANDIDATE → PUBLIC_PROCESS → GRADUATED → ARCHIVED. Repository status: DESIGN_ONLY → SKELETON → PROTOTYPE → ACTIVE → ARCHIVED.

**Why it matters:** Quality gates are explicit. No repo reaches external visibility without meeting defined criteria. The promotion-recommender workflow evaluates repos monthly against these criteria automatically. The state machine prevents premature exposure of unfinished work.

**The trade-off accepted:** Promotion latency. Monthly evaluation means a repo ready on day 2 waits until day 30 for consideration. And maintaining two overlapping state machines creates cognitive overhead.

## 6. Essay Dating: Publication Date, Not Writing Date

**The question:** What date goes on an essay?

**The decision:** An essay's date is its publication date — the date it was deployed to the Jekyll site and became accessible via URL. Not the date it was written, drafted, or planned.

**Why it matters:** This seems trivial until you find 9 essays with future dates. The VERITAS sprint discovered that early essays had been dated based on *when they were planned*, not when they were published. For a system that claims to "build in public," publishing essays with dates that haven't occurred yet undermines credibility at a fundamental level.

**The trade-off accepted:** Nine URLs broke during the correction. No redirect mechanism was implemented. Historical accuracy suffered — some essays were genuinely written on their original dates.

## 7. Revenue Field Split

**The question:** How do you honestly represent revenue status when revenue is zero?

**The decision:** Split the single `revenue` field into `revenue_model` (how the product *intends* to make money) and `revenue_status` (whether it *currently* makes money). Separate intent from reality.

**Why it matters:** Before the split, `revenue: "subscription"` implied a product was earning subscription revenue. It wasn't. After the split, `revenue_model: "subscription"` + `revenue_status: "none"` is honest. All 24 ORGAN-III repos showed `revenue_status: none` — an uncomfortable truth, but an honest one.

**The trade-off accepted:** Schema breaking change. Every consumer of registry-v2.json needed updates. But honesty is a constitutional principle (Article I), not a nice-to-have.

## 8. Cross-Org Dispatch Architecture

**The question:** How do 8 GitHub organizations communicate with each other?

**The decision:** `repository_dispatch` events routed through a central dispatcher (orchestration-start-here) using a cross-org Personal Access Token. Each org has a `.github` repo with a `dispatch-receiver.yml` that routes events by type.

**Why it matters:** Cross-org communication is the backbone of autonomous operation. When a new essay appears in ORGAN-V, ORGAN-VII's distribution pipeline fires. When orchestration-start-here promotes a repo, the target org reacts. Without this, the 8 organs would be isolated silos.

**The trade-off accepted:** Single token risk. If `CROSS_ORG_TOKEN` is compromised, an attacker has write access to all 8 orgs. Mitigation: the token is stored in only 2 repositories and never exposed in logs.

## 9. Soak Test Design: Always Exit 0

**The question:** How do you prove the system runs autonomously for 30+ days?

**The decision:** A daily soak test workflow that collects registry, dependency, CI, and engagement data — and always exits with code 0. Failures are recorded in JSON data, not as workflow exit codes.

**Why it matters:** An earlier version of the soak test used `exit 1` on any validation failure. This caused the workflow itself to show as "failed" in GitHub Actions — which meant the soak test was polluting the very CI health data it was supposed to be measuring. A monitoring system that creates the noise it's monitoring is worse than useless.

**The trade-off accepted:** No real-time alerting. The soak test collects data but doesn't alert on anomalies. A human must read the data to detect problems. The weekly system-pulse report partially mitigates this.

## 10. Billing Guardrails: Disable All Cron Workflows

**The question:** What do you do when your GitHub Actions minutes explode to 48,880?

**The decision:** Disable all 17 cron-triggered workflows across ORGAN-I and ORGAN-III. Preserve push and pull-request triggers so CI still runs on code changes, but eliminate all scheduled execution.

**Why it matters:** The ORGAN-I billing overrun locked all CI for 20 repositories. This wasn't a gradual degradation — it was a hard cutoff. The free-tier GitHub Actions allocation (2,000 minutes/month) was consumed by 14 daily/weekly cron workflows that were running expensive jobs across 20 repos.

**The trade-off accepted:** ORGAN-I has no scheduled CI. Regressions in those 20 repos may go undetected between pushes. The soak test permanently shows ORGAN-I as "failing" — known noise that must be filtered in every analysis.

## 11. Seed.yaml: Self-Describing Repositories

**The question:** How does the orchestrator agent discover what each repo does?

**The decision:** Every non-archived repo contains a `seed.yaml` at its root — a YAML file declaring what the repo produces, what it consumes, which agents operate within it, and how it relates to the system. Schema v1.0, deployed to 82/82 eligible repos.

**Why it matters:** The registry knows *about* repos (metadata). Seed.yaml knows *within* repos (interfaces). The orchestrator-agent workflow clones all seed.yaml files weekly and builds a unified dependency graph. This is the perception layer — how the system sees itself.

**The trade-off accepted:** Dual source of truth risk. Registry and seed.yaml can drift. The registry is authoritative; seed.yaml is declarative. And schema evolution requires updating 82 files across 8 orgs — a batch operation.

## 12. Sprint Numbering: Execution Order Is Canonical

**The question:** What happens when your sprint catalog and your sprint execution diverge?

**The decision:** Sprint numbers in `docs/specs/sprints/` reflect execution order, not catalog position. The catalog is a menu of what *could* be done; the spec files record what *was* done. When the catalog says Sprint 19 is MEMORIA and the spec file says Sprint 19 is CONCORDIA, the spec file wins.

**Why it matters:** Planning is not execution. The original sprint catalog predicted an execution order that diverged from reality within weeks. Some planned sprints were combined (MEMORIA + ANNOTATIO → TRIPARTITUM). Others were deferred indefinitely. New sprints emerged that weren't planned at all. Forcing a rigid catalog sequence would have meant either skipping numbers or executing work in a suboptimal order.

**The trade-off accepted:** Two numbering systems that diverge. The catalog's numbering no longer matches the spec files' numbering. Readers must understand they are different sequences. The CANON sprint (Sprint 24) was dedicated entirely to documenting and reconciling this divergence.

---

## The Meta-Decision

There is a thirteenth decision implicit in all of the above: the decision to document decisions at all.

Most solo projects do not write ADRs. Most solo projects do not need to. But this is not a solo project in the traditional sense — it is a solo-*operated* system that aspires to institutional scale. The bus factor is 1. If the operator is unavailable for a week, a second person needs to understand not just *what* the system does but *why* it does it that way.

ADRs are the "why" documentation. They are more valuable than READMEs, more durable than commit messages, and more honest than design documents (which describe what *should* be built, not what *was* built and why). The twelve ADRs documented here represent the twelve most consequential choices in the system's architecture. Together, they form a decision archaeology — a way for any future operator to reconstruct the reasoning behind the entire system.

The system is the code. The architecture is the decisions. The decisions are the documentation. And the documentation is, ultimately, the most durable artifact of all.
