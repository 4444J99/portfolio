---
title: "The Promotion Pipeline: From DESIGN_ONLY to PRODUCTION in an Eight-Organ System"
description: "How the organvm system uses a four-stage promotion pipeline — DESIGN_ONLY, SKELETON, PROTOTYPE, PRODUCTION — to enforce quality standards across 81 repositories, and what 17 promotions in a single sprint taught us about automated quality gates."
pubDate: 2026-02-14
featured: false
tags: ["Promotion-pipeline", "Devops", "Quality-engineering", "Ci-cd", "State-machines", "Automation"]
---

# The Promotion Pipeline: From DESIGN_ONLY to PRODUCTION in an Eight-Organ System

## 1. The Problem That Tiers Solve

Every multi-repository system that grows beyond a handful of repos encounters the same disease: status ambiguity. A GitHub organization with forty repositories will contain, at any given moment, repos in wildly different states of completion. Some have comprehensive test suites, CI pipelines, and documentation that could be shown to a hiring committee. Others are empty shells created during a brainstorming session and never revisited. Most fall somewhere in between — partial implementations, outdated READMEs, CI workflows that ran green six months ago and have not been triggered since.

The conventional response to this ambiguity is to ignore it. GitHub provides no native mechanism for declaring a repository's maturity. There is no field on a repo's settings page that says "this is a prototype" or "this is production-ready." The closest analog is the archive flag, which is binary — active or archived — and communicates only one thing: whether the repo is still accepting changes. Between "active" and "archived" lies an enormous spectrum of states that GitHub does not model and most organizations do not bother to track.

The consequence of this neglect is that every repo presents itself as equivalent. A visitor navigating an organization's profile sees a flat list of repositories, sorted by most recently updated or alphabetically, with no indication of which ones represent serious work and which represent abandoned experiments. The visitor must click into each repo, read its README (if one exists), examine its commit history, check whether CI is configured, and form their own judgment about whether this repository is worth their attention. This is the Stranger Test in its most adversarial form: the stranger is doing the classification work that the organization should have done.

The eight-organ system governs 81 repositories across 8 GitHub organizations. Without explicit maturity classification, this scale would produce exactly the ambiguity described above — a wall of repos where flagship projects with 1,254 tests sit alongside empty `.github` profile repos, with nothing to distinguish them. The promotion pipeline exists to prevent this. Every repository in the system carries an `implementation_status` field in the central registry (`registry-v2.json`), and that field can take exactly one of four values: `DESIGN_ONLY`, `SKELETON`, `PROTOTYPE`, or `PRODUCTION`. The field is not decorative. It is the system's judgment about what a repository currently is, and it governs what the repository is allowed to claim about itself.

---

## 2. The Four Tiers

The promotion pipeline is a linear state machine. Repositories enter at DESIGN_ONLY and advance through SKELETON and PROTOTYPE to PRODUCTION. Each transition requires meeting specific, documented criteria. There is no mechanism for skipping tiers — a DESIGN_ONLY repo cannot jump directly to PRODUCTION, because each intermediate tier validates prerequisites that the next tier assumes. The tiers, their criteria, and their implications are as follows:

| Tier | Criteria | What It Means | Typical Repos |
|------|----------|---------------|---------------|
| **DESIGN_ONLY** | README exists; repo registered in `registry-v2.json` | The concept has been articulated but not implemented. The repo is a placeholder for an idea. | `.github` profile repos, pure-documentation repos, consolidated archives |
| **SKELETON** | README + basic project structure (`pyproject.toml`, `package.json`, or equivalent) | The repo has scaffolding. Someone has decided on a technology stack and created the initial files. Code may or may not exist. | Early-stage projects, governance scaffolds |
| **PROTOTYPE** | README + functional code + CI workflow present | The repo does something. Code runs, CI is configured (though it may not pass on all dimensions), and the project is past the "idea" phase. | Projects under active development, pre-release tools |
| **PRODUCTION** | README + functional code + CI passing + tests + documentation complete + portfolio-ready | The repo meets the Stranger Test. A grant reviewer or hiring manager encountering it for the first time would see a professional, maintained project. | Flagship repos, shipped products, mature tools |

Several things are worth noting about this model. First, the tiers are about *current state*, not about *importance*. A DESIGN_ONLY repo is not necessarily unimportant — `nexus--babel-alexandria-` in ORGAN-I is a 50,000-word design document for a nine-layer rhetorical-linguistic operating system, and it has HIGH portfolio relevance despite being DESIGN_ONLY. The tier says the repo has no running code, not that its contents lack value. Second, the tiers are monotonically increasing in requirements. Every PRODUCTION repo satisfies every PROTOTYPE criterion, every PROTOTYPE satisfies every SKELETON criterion, and so on. This means the tier is also a lower bound on quality: if you know a repo is PRODUCTION, you know it has CI, tests, documentation, and functioning code without checking any of those things individually.

Third — and this is the critical design decision — the tiers are enforced through a single source of truth. The `implementation_status` field in `registry-v2.json` is the authoritative record. It is not derived from the repo's actual state (checking whether CI exists, whether tests pass, etc.). It is *set* by a human who has verified those conditions. This introduces a gap between the registry's claim and reality — a repo's CI could break after promotion, making the PRODUCTION label temporarily inaccurate. This gap is intentional. The promotion is a judgment that the repo *met* the criteria at the time of promotion. Ongoing compliance is maintained through different mechanisms: CI runs on every push, dependabot keeps dependencies current, and the monthly organ audit (`monthly-organ-audit.yml`) validates the entire system. The promotion is an event; maintenance is a process.

---

## 3. What PRODUCTION Actually Means

There is a temptation to read PRODUCTION as "finished." This is wrong, and the misreading creates problems if left uncorrected. PRODUCTION in the eight-organ system means one thing: the repository meets a quality floor that makes it presentable to external audiences. It does not mean the code is feature-complete. It does not mean there are no open issues. It does not mean the project will never change. It means that right now, at this moment, the repo could withstand scrutiny.

The quality floor has specific components. A PRODUCTION repository has:

- **Passing CI.** The workflow configured for the repo — whether `ci-python.yml`, `ci-node.yml`, `ci-mixed.yml`, or `ci-minimal.yml` — runs without failure. For Python repos, this means linting with ruff, type-checking with mypy, and running pytest across a matrix of Python 3.10, 3.11, and 3.12. For Node repos, it means ESLint, TypeScript compilation, and test execution. For repos with no runtime code (documentation repos, community health repos), `ci-minimal.yml` validates repository structure — confirming that the README exists, the license is present, and the basic file layout conforms to standards.

- **Tests.** For repos with executable code, automated tests exist and pass. The depth of testing varies with the project's maturity and scope. `recursive-engine--generative-entity` has 1,254 tests at 85% coverage. `public-record-data-scrapper` has its own test suite. Smaller repos may have a handful of integration tests. But the minimum is non-zero: PRODUCTION repos with code have tests.

- **Documentation.** The README is complete, formatted according to the documentation rubric (from `docs/planning/01-readme-audit-framework.md`), and written in portfolio language. "Portfolio language" means the README is written for its audience — grant reviewers, hiring managers, potential collaborators — not for the developer who already understands the project. Technical accuracy and accessibility coexist. Every README in a PRODUCTION repo has been scored against the rubric and meets the minimum threshold.

- **Portfolio readiness.** This is the subjective criterion, and it is the one that matters most. Portfolio readiness is the answer to the question: "If a stranger encountered this repository with no prior context, would they come away with a positive impression of the system it belongs to?" This is the Stranger Test. It subsumes the other criteria — a repo with failing CI, no tests, and a one-paragraph README will not pass the Stranger Test — but it adds a dimension of coherence and professionalism that mechanical checks cannot capture.

PRODUCTION is a floor, not a ceiling. A repo at PRODUCTION can — and should — continue to improve. New features, better tests, richer documentation, performance optimizations: all of these are work that happens *above* the PRODUCTION floor. The floor ensures that no repo in the system actively undermines the portfolio. What happens above the floor is the ongoing work of making the system excellent rather than merely presentable.

---

## 4. The PROPULSION Sprint: 17 Promotions in One Session

On February 12, 2026, the PROPULSION sprint promoted 17 repositories from PROTOTYPE to PRODUCTION in a single session. This was not an act of administrative reclassification. Each promotion required verifying that the target repo met PRODUCTION criteria — CI passing, tests present, documentation complete, portfolio language in place. The session took several hours, and its pattern revealed as much about the system's health as the promotions themselves.

The workflow for each promotion followed a consistent sequence:

1. **Check CI status.** Query the repo's most recent workflow run. If the badge was green, proceed. If the badge was red or absent, investigate.

2. **Fix failures.** Several repos had stale CI workflows — configurations that referenced GitHub Actions versions or Python versions that had been superseded. The PROPULSION sprint cleaned these up: updating action versions, removing references to deprecated runners, ensuring the workflow YAML was current. This step was the most time-consuming part of the sprint and the most valuable, because it exposed systemic rot that would have compounded over time.

3. **Deploy missing tests.** Some repos had CI that ran linting and type-checking but no test suite. For these repos, basic test scaffolding was deployed — enough to validate core functionality and establish a test baseline that future development could extend.

4. **Update the registry.** Change `implementation_status` from `PROTOTYPE` to `PRODUCTION` in `registry-v2.json`. Append a note documenting the promotion date and any remediation performed.

5. **Verify.** Confirm the CI badge shows green after any changes. Run the validation scripts to ensure the registry is internally consistent.

What the sprint exposed, beyond the individual promotions, was a category of systemic issues that only become visible when you attempt batch operations. Three patterns stood out:

**Stale workflows.** Several repos had CI configurations written during the Platinum Sprint (February 11) that referenced specific action versions. By February 12, some of those versions had been superseded or exhibited edge-case failures. Individually, each stale workflow was a minor issue. In aggregate, they represented a maintenance burden that would grow linearly with the number of repos. The PROPULSION sprint fixed them all at once, but the pattern argued for centralized workflow templates rather than per-repo configurations — a lesson that informed subsequent infrastructure decisions.

**Missing health files.** PRODUCTION repos are expected to have community health files — CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md. Several PROTOTYPE repos lacked these files, which meant their promotions required deploying boilerplate health files alongside the substantive promotion work. This was mechanical but time-consuming, and it suggested that health files should be part of the SKELETON tier's requirements rather than discovered at promotion time.

**Inconsistent badge rows.** The badge row deployed across the system uses a standardized format (CI status, coverage, license, organ number, status, language). Some repos had been badged during earlier sprints with slightly different formats or outdated shield.io URLs. The PROPULSION sprint normalized these, but the inconsistency demonstrated that even "cosmetic" infrastructure needs governance.

The sprint concluded with the system at 64 PRODUCTION repos out of 81 total — a 79% PRODUCTION rate. The number was motivating in a way that surprised me. The implementation_status_distribution in `registry-v2.json` functions as a scoreboard, and watching the PRODUCTION count climb from 47 (pre-PROPULSION) to 64 created a tangible sense of progress that more abstract metrics (word counts, test counts, badge deployments) did not provide.

---

## 5. CI as the Gatekeeper

The single criterion that most frequently blocked PROTOTYPE-to-PRODUCTION promotions was CI. A repository cannot reach PRODUCTION without a passing CI workflow. This rule is absolute — there are no exceptions, no "we'll fix CI later" waivers. The rationale is straightforward: CI is the only automated, continuous validation mechanism in the system. Documentation can be checked manually. Test coverage can be inspected by reading the test files. But CI runs on every push, every pull request, every change to the repository. It is the system's immune response, and a repo without it is a repo without defenses.

This absolutism created productive pressure. Before the PROPULSION sprint, 65 of 81 repos had CI workflows. After the sprint and the subsequent ASCENSION sprint, that number rose to 67. The gap — 14 repos without CI — consists entirely of DESIGN_ONLY repos (the `.github` profile repos and archived repos where deploying CI would validate nothing meaningful). Every repo that could benefit from CI now has it.

The CI template system made this tractable. Rather than writing bespoke workflows for each repo, the system uses four templates:

- **`ci-python.yml`**: Runs ruff (linting), mypy (type-checking), and pytest across a Python 3.10/3.11/3.12 matrix. Deployed to Python-based repos, which constitute the majority of the system.
- **`ci-node.yml`**: Runs ESLint, TypeScript compilation, and the test runner. Deployed to TypeScript/JavaScript repos.
- **`ci-mixed.yml`**: Combines Python and Node checks for polyglot repos.
- **`ci-minimal.yml`**: Validates repository structure without executing code. Checks README existence, license presence, and basic file layout. Deployed to documentation repos, content repos, and repos where the primary deliverable is not executable code.

The `ci-minimal.yml` template deserves particular attention because it solves a problem that most CI systems ignore: how do you validate a repo that has no code? The answer is that you validate the things the repo *does* have. A documentation repo has a README, a license, a directory structure. These things can be checked. The check is not deep — it does not evaluate the quality of the README's prose or the appropriateness of the license — but it establishes a minimum: the repo is structurally sound, and the CI badge means something, even if what it means is modest.

This approach — matching CI rigor to repo maturity — avoids the two failure modes described in Essay 10 ("Uniform Quality at Scale"): false uniformity (applying strict CI to skeleton repos, producing a wall of failing badges) and false hierarchy (applying CI only to important repos, creating a visible quality gap). Every repo participates in CI. The CI matches what the repo can deliver.

---

## 6. The Registry as Scoreboard

`registry-v2.json` is a 1,700-line JSON file that tracks every repository in the eight-organ system. It records each repo's name, organization, description, documentation status, portfolio relevance, dependencies, promotion status, tier, last validation date, implementation status, CI workflow, and Platinum status. It is the single source of truth — the canonical record from which all other views of the system are derived.

One section of the registry has outsized motivational power: `implementation_status_distribution`.

```json
"implementation_status_distribution": {
  "PRODUCTION": 64,
  "PROTOTYPE": 1,
  "SKELETON": 3,
  "DESIGN_ONLY": 13
}
```

These four numbers tell the story of the system's maturity. Before the PROPULSION sprint, the distribution was approximately 47 PRODUCTION, 18 PROTOTYPE, 3 SKELETON, 13 DESIGN_ONLY. After PROPULSION (17 promotions) and ASCENSION (12 more promotions, 3 CI fixes, 2 new repos), the distribution shifted to its current state. The PRODUCTION count went from 47 to 64. The PROTOTYPE count collapsed from 18 to 1. The SKELETON and DESIGN_ONLY counts remained stable.

This scoreboard has properties that make it uniquely useful for tracking multi-repo system health:

**It is aggregate.** Individual repo metrics (test count, coverage percentage, word count) are useful for evaluating specific repos but do not describe the system. The distribution describes the system. It answers "how mature is the eight-organ system?" with a four-number summary that can be tracked over time and compared across sprints.

**It is honest.** Every number is backed by a verifiable claim. 64 PRODUCTION means 64 repos where CI passes, documentation is complete, and the Stranger Test is met. 13 DESIGN_ONLY means 13 repos that are placeholders or infrastructure with no executable code. The numbers can be audited — the monthly organ audit does exactly this — and any discrepancy between the registry and reality is a bug to be fixed, not a number to be rationalized.

**It is motivating.** Watching PRODUCTION climb from 47 to 64 in two sprints produced a sense of momentum that abstract quality metrics do not. The number is concrete. It maps to specific repos, specific promotions, specific work done. And the remaining gap — 17 repos that are not PRODUCTION — is a clear, bounded to-do list. (Of those 17, 13 are DESIGN_ONLY repos that will likely remain DESIGN_ONLY because they are `.github` profile repos or archives, and 4 are SKELETON/PROTOTYPE repos with clear paths to PRODUCTION.)

The scoreboard also serves an external communication function. When describing the system to grant reviewers or hiring managers, "64 of 81 repos at PRODUCTION status with passing CI" communicates more credibility than "we have 81 repos." The former is a quality claim. The latter is a quantity claim. Quality claims are harder to make and therefore more valuable.

---

## 7. What the 13 DESIGN_ONLY Repos Tell Us

The promotion pipeline is not a conveyor belt. Not every repository is destined for PRODUCTION, and the system is healthier for acknowledging this.

Of the 13 repos that carry DESIGN_ONLY status, the breakdown is revealing:

- **8 are `.github` profile repos** — one for each of the 8 GitHub organizations. These repos contain organization-wide community health files, CI templates, and profile READMEs. They have no executable code and never will. Their purpose is infrastructure, not implementation. Promoting them to SKELETON (which requires project structure files like `pyproject.toml`) would be meaningless — there is no project to structure. Promoting them to PRODUCTION (which requires tests) would be absurd — there is nothing to test. DESIGN_ONLY is their correct and permanent classification.

- **1 is a pure-documentation repo** — `nexus--babel-alexandria-` in ORGAN-I, a 50,000-word design document for a rhetorical-linguistic operating system. It has HIGH portfolio relevance. It demonstrates intellectual depth and architectural thinking. But it has no code, and adding code is not part of its roadmap. It is a design document, and DESIGN_ONLY captures that accurately.

- **4 are archived repos** — `core-engine`, `performance-sdk`, `example-generative-visual`, and `docs` in ORGAN-II, all consolidated into `metasystem-master` during the system's consolidation phase. They carry DESIGN_ONLY status because they were never fully implemented before being archived. Their archive banners and redirect notices are their final state.

The existence of these 13 DESIGN_ONLY repos is not a failure of the promotion pipeline. It is a feature. The pipeline's value comes not only from what it promotes but from what it honestly labels as unpromoted. A system where every repo is PRODUCTION is either very small or very dishonest. A system where 79% of repos are PRODUCTION and the remaining 21% are honestly classified as infrastructure, documentation, or archives is a system that takes its own taxonomy seriously.

This is the lesson for other multi-repo systems: the tiers validate both ambition and restraint. It is OK to have stubs. It is OK to have repos that will never ship. What is not OK is to leave them unlabeled, because unlabeled stubs are indistinguishable from abandoned projects, and that ambiguity corrodes trust.

---

## 8. Connection to Broader DevOps Practice

The promotion pipeline is, in essence, a custom maturity model. Maturity models are a well-established practice in DevOps and software engineering, though they typically apply to teams and processes rather than individual repositories. The Capability Maturity Model Integration (CMMI) defines five maturity levels for organizational processes. The DORA (DevOps Research and Assessment) metrics measure software delivery performance across four dimensions (deployment frequency, lead time, change failure rate, mean time to recovery). The organvm promotion pipeline applies the same logic at the repository level: define what "good" looks like at each stage, measure against those definitions, and track progress over time.

The parallels to CMMI are instructive. CMMI's five levels — Initial, Managed, Defined, Quantitatively Managed, Optimizing — map roughly to the four-tier model:

| CMMI Level | organvm Tier | Shared Principle |
|------------|-------------|-----------------|
| Initial | DESIGN_ONLY | Process exists informally or not at all |
| Managed | SKELETON | Basic structure in place, project planned |
| Defined | PROTOTYPE | Standardized process, working implementation |
| Quantitatively Managed | PRODUCTION | Measured, tested, validated |
| Optimizing | (post-PRODUCTION) | Continuous improvement above the floor |

The fifth CMMI level — Optimizing — maps to the space above PRODUCTION: repos that are at PRODUCTION and continue to improve through feature development, test expansion, performance optimization, and documentation refinement. The promotion pipeline does not model this space explicitly, because it is unbounded. PRODUCTION is the floor, not the ceiling. What happens above the floor is the ongoing work of engineering excellence, and it does not need tiers — it needs engineering judgment.

The DORA metrics offer a different perspective. DORA measures the velocity and reliability of software delivery. The promotion pipeline does not directly measure these things, but it creates the preconditions for measuring them. A PRODUCTION repo has CI — which means deployment frequency and lead time can be measured from the workflow logs. A PRODUCTION repo has tests — which means change failure rate can be estimated from test failure history. The promotion pipeline is the foundation on which operational metrics can be built, even though the pipeline itself is a maturity metric rather than a delivery metric.

The most direct analogy in industry practice is the concept of "production readiness reviews" (PRRs) used at companies like Google and Airbnb. A PRR is a gate that a service must pass before being declared production-ready. It evaluates monitoring, alerting, documentation, runbooks, load testing, and failure modes. The organvm PRODUCTION tier is a simplified PRR: it evaluates CI, tests, documentation, and portfolio readiness. The simplification is appropriate for the system's scale and context — 81 repos maintained by a solo practitioner do not need the full apparatus of a Google PRR — but the principle is the same: production is a status you earn by meeting criteria, not a label you assign by default.

---

## 9. Dependabot and the Ongoing Cost of Quality

Promotion is an event. Maintenance is a process. The ASCENSION sprint, which followed PROPULSION, made this distinction vivid by deploying Dependabot across the system. Dependabot monitors dependency versions and opens pull requests when updates are available. It is a maintenance automation — it does not improve repos, but it prevents them from degrading.

The deployment of Dependabot was motivated by a specific concern: PRODUCTION repos that were promoted today would, over the coming weeks and months, accumulate stale dependencies. A Python repo promoted with up-to-date packages in February would, by April, have packages with known vulnerabilities. A Node repo promoted with current TypeScript would, by May, be two minor versions behind. The CI badge would still be green — the tests would still pass with the old dependencies — but the repo would be quietly rotting.

Dependabot addresses this rot by externalizing dependency monitoring. Instead of a human remembering to check each repo's dependencies, the automation opens PRs when updates are available. The human reviews and merges (or dismisses). The maintenance burden shifts from "remember to check" to "respond to notifications," which is cognitively cheaper and more reliable.

But Dependabot also creates a maintenance obligation. Each Dependabot PR requires review. Across 67 repos with CI workflows, this generates a steady stream of PRs — not a flood, but a persistent trickle. Ignoring them defeats the purpose of deployment. This is the ongoing cost of quality: PRODUCTION status is not a one-time achievement but a commitment to ongoing maintenance. The promotion pipeline makes this commitment explicit — by defining PRODUCTION criteria that assume CI, tests, and current dependencies, the pipeline declares that quality is a process, not a state.

The ASCENSION sprint also performed 12 additional promotions, fixed 3 CI workflows that had developed issues since the PROPULSION sprint (confirming that CI maintenance is ongoing, not one-time), and created 2 new `art-from` repositories in ORGAN-II as a consequence of cross-organ promotions. The sprint demonstrated the full lifecycle: promote, maintain, create new work from what was promoted. The promotion pipeline is not just a quality gate — it is a generative process that produces obligations, surfaces work, and drives the system forward.

---

## 10. Lessons for Other Multi-Repo Systems

The eight-organ system is unusual in its scale, its governance model, and its AI-conductor methodology. But the promotion pipeline is transferable. Any organization managing more than a dozen repositories can benefit from explicit maturity classification. The lessons are:

**Define your tiers before you need them.** We defined DESIGN_ONLY, SKELETON, PROTOTYPE, and PRODUCTION before the PROPULSION sprint, which meant the sprint was an evaluation exercise rather than a taxonomy exercise. Trying to define tiers while simultaneously classifying repos leads to tiers that match current reality rather than aspirational standards. Define first, classify second.

**Make the criteria binary.** Each tier's criteria should be checkable with a yes/no answer. "Does CI pass?" is binary. "Is the documentation good?" is not. The promotion pipeline works because its criteria are unambiguous — at each tier, you can check every box or you cannot. This eliminates judgment calls from the promotion process and reserves judgment for the decision to initiate the promotion.

**Use a single source of truth.** The registry is the authoritative record. There is no secondary spreadsheet, no Notion page, no mental model that tracks repo maturity. When the registry says PRODUCTION, the repo is PRODUCTION. When someone disputes that classification, the dispute is resolved by checking the repo against the criteria and updating the registry. The single source of truth prevents drift, resolves disagreements, and makes the system auditable.

**Accept that some repos will never promote.** Infrastructure repos, documentation repos, archived repos — not everything needs to reach PRODUCTION. The tier system validates this by providing honest labels for non-production repos. The goal is not 100% PRODUCTION; the goal is 100% honestly classified.

**CI is non-negotiable.** A repo without CI is a repo without automated validation, and a repo without automated validation cannot claim any quality status with confidence. Even `ci-minimal.yml` — which validates only file structure — is better than no CI at all, because it establishes the principle that every repo participates in the quality system.

**Track the scoreboard.** The implementation_status_distribution is four numbers. Those four numbers tell the story of the system. Track them over time. Celebrate when PRODUCTION increases. Investigate when PROTOTYPE stalls. Share the numbers with stakeholders. A scoreboard that nobody reads is a scoreboard that does not motivate.

**Budget for maintenance.** Promotion is cheap compared to maintenance. Getting 17 repos to PRODUCTION in one sprint was intense but finite. Keeping 64 repos at PRODUCTION — updating dependencies, fixing CI regressions, refreshing documentation — is ongoing and indefinite. The promotion pipeline makes this cost visible by defining PRODUCTION as a standard that must be continuously met, not a label that persists once applied.

---

The promotion pipeline began as an administrative convenience — a way to track which repos were "done" and which needed work. It became something larger: a quality philosophy encoded as a state machine, a scoreboard that drives momentum, and a governance tool that makes honesty about maturity a first-class concern. The four tiers are simple. The criteria are binary. The registry is authoritative. And the result — 64 of 81 repos at PRODUCTION, with the remaining 17 honestly classified as infrastructure, documentation, archives, or work-in-progress — is a system that can answer the question every multi-repo organization must eventually face: "How do you know which of these repos are actually good?" We know because we checked, we recorded, and we committed to keeping the record accurate. That is what the promotion pipeline is for.

---

*This essay is part of the [ORGAN-V Public Process](https://github.com/organvm-v-logos/public-process) -- building in public, documenting everything.*

*Related repos: [orchestration-start-here](https://github.com/organvm-iv-taxis/orchestration-start-here) | [recursive-engine--generative-entity](https://github.com/organvm-i-theoria/recursive-engine--generative-entity) | [public-record-data-scrapper](https://github.com/organvm-iii-ergon/public-record-data-scrapper)*
