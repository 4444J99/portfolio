---
title: "Epistemic Tuning Explained"
description: "How knowledge atomization, vector search over Claude conversations, and an eight-phase auto-revision engine create a system that knows what it knows — and adjusts that knowledge deliberately."
pubDate: 2026-02-11
featured: false
tags: ["Organ-i", "Theory", "Epistemology", "Knowledge-management", "Ai", "Methodology"]
---

# Epistemic Tuning Explained

## The Knowledge Problem Nobody Talks About

There is a peculiar asymmetry in how we build knowledge systems. We are very good at storing information. Databases, document stores, vector indices, knowledge graphs — the tooling for putting knowledge somewhere is mature and well-understood. What we are terrible at is knowing what we know. Not in the trivial sense of search ("do I have a document about X?") but in the structural sense: what are the boundaries of this system's knowledge? Where are the gaps? Which pieces of knowledge depend on other pieces? Which beliefs should change if a foundational assumption is revised?

This is the epistemic tuning problem, and it is the central concern of two ORGAN-I repositories: `my-knowledge-base` and `linguistic-atomization-framework`. Together with the `auto-revision-epistemic-engine`, they form a pipeline that does not merely store knowledge but actively manages the epistemological structure of what the system knows, how confidently it knows it, and what should happen when new evidence contradicts existing beliefs.

I came to this problem through frustration. After hundreds of Claude conversations over eighteen months, I realized that I had accumulated an enormous amount of knowledge that existed only in scattered conversation transcripts. Insights about Peircean semiotics, architectural decisions for RE:GE, refined definitions of alchemical operations, corrections to earlier misunderstandings — all of it trapped in chronological chat logs with no structural relationship to each other. Finding a specific insight required remembering which conversation it came from. Understanding how one insight related to another required holding both in working memory simultaneously. This does not scale.

This essay explains what epistemic tuning means in practice, how knowledge atomization works, why vector search over AI conversations produces different results than vector search over documents, and what "self-governing orchestration" actually looks like when you implement it.

---

## Knowledge Atomization: Breaking Conversations Into Semantic Units

Every substantial conversation with Claude — and I have had thousands — produces knowledge. Not just answers to questions, but conceptual frameworks, refined definitions, challenged assumptions, novel connections between previously unrelated ideas. The problem is that this knowledge is trapped in conversation transcripts. A 90-minute Claude session might produce 15,000 words of dialogue, buried within which are 3–5 genuinely novel insights, 10–15 refined formulations of existing ideas, and 20–30 factual claims that should be verified.

Knowledge atomization is the methodology I developed to extract these semantic units from conversational transcripts and index them in a form that supports multi-modal search. The process has five stages:

**Stage 1: Transcript Segmentation.** Raw conversation transcripts are segmented into topically coherent blocks. This is not sentence-level splitting — a single conversational turn might address three different topics, and three consecutive turns might develop a single idea. The segmentation algorithm uses a combination of semantic similarity (cosine distance between adjacent sentence embeddings) and structural markers (explicit topic changes, question-answer boundaries, conceptual pivots signaled by phrases like "actually, let me reconsider" or "this connects to"). The threshold for segment boundaries was calibrated empirically against 50 hand-segmented transcripts, yielding approximately 0.82 F1 agreement with my manual segmentation.

**Stage 2: Semantic Unit Extraction.** Each segment is decomposed into atomic semantic units — the smallest meaningful claims, definitions, frameworks, or questions that the segment contains. A semantic unit might be a factual claim ("BLAKE3 produces 256-bit hashes"), a definition ("epistemic tuning means adjusting what a system knows it knows"), a framework reference ("this follows the Peircean abduction pattern"), or a question that implies a knowledge gap ("I don't know whether this holds for non-stationary distributions"). Each unit is tagged with its type, confidence level (high/medium/low, based on the conversational context in which it appeared), and provenance (which conversation, which turn, which date).

**Stage 3: Dependency Mapping.** Semantic units do not exist in isolation. A definition depends on the terms it uses. A factual claim depends on its sources. A framework reference depends on the framework's axioms. Stage 3 maps these dependencies explicitly, creating a directed graph where each semantic unit is a node and each dependency is an edge. This graph is the foundation of epistemic tuning: when a foundational unit changes, all units that depend on it are flagged for review.

The dependency mapping is semi-automated. The system proposes dependencies based on term co-occurrence and semantic similarity, but I review and approve each edge. Fully automated dependency detection produces too many spurious edges — two units that mention "recursion" are not necessarily dependent on each other. The human review step takes approximately 3–5 minutes per 100 proposed edges, which is sustainable given that a typical conversation produces 20–40 new dependency proposals.

**Stage 4: Embedding and Indexing.** Each semantic unit is embedded using a sentence transformer model and indexed in a vector store. But — and this is where the approach diverges from standard RAG pipelines — the embedding includes not just the unit's content but its metadata: type, confidence, dependencies, and provenance. This means similarity search returns not just "documents about X" but "high-confidence definitions of X that do not depend on assumption Y." The metadata-enriched embeddings enable epistemic queries that standard vector search cannot support.

**Stage 5: Conflict Detection.** New semantic units are compared against existing units for contradictions. If a new conversation produces the claim "BLAKE3 produces 512-bit hashes," the conflict detector flags the contradiction with the existing unit "BLAKE3 produces 256-bit hashes" and surfaces both units for resolution. Conflict detection uses a combination of semantic similarity (to find potentially conflicting units) and logical entailment checking (to confirm that the conflict is genuine rather than apparent). Genuine conflicts trigger a review workflow in the `auto-revision-epistemic-engine`.

The atomization pipeline processes approximately 200 conversations to date, yielding roughly 12,000 semantic units with 45,000 dependency edges. The total index size is modest — under 2GB including embeddings — but the structural richness of the dependency graph makes it far more useful than a flat document store of equivalent size.

---

## How Multi-Modal Search Works

"Multi-modal" in this context does not mean images and text. It means searching across different modalities of knowledge: textual content, code snippets, conceptual frameworks, and procedural knowledge. Each modality has different search characteristics, and the search system must handle all four within a unified interface.

**Textual search** is straightforward: embed the query, find the nearest semantic units by cosine similarity. This handles questions like "what did I conclude about recursive depth limits?" effectively. The top-5 retrieval accuracy for textual queries is approximately 85%, measured against a hand-curated test set of 200 query-answer pairs.

**Code search** requires understanding that code snippets are both text and executable structure. A query like "how does the cycle detector work?" should return not just the semantic unit describing the cycle detector but the actual code snippet from RE:GE's Handler 8. The knowledge base stores code snippets as semantic units with a special `code` type tag, and the embedding model is fine-tuned (via a small adapter layer) to align code and natural language embeddings in the same vector space. This alignment is imperfect — code search accuracy is approximately 72%, notably lower than textual search — but it is sufficient to surface relevant code when needed.

**Conceptual search** targets frameworks and definitions rather than facts. A query like "what theoretical frameworks apply to self-referential systems?" should return a structured set of frameworks (Gödel's incompleteness, autopoiesis, Hofstadter's strange loops, Luhmann's systems theory) with their dependency relationships preserved. Conceptual search uses the dependency graph to expand results: when a framework is returned, its prerequisite concepts are included as context. This expansion mechanism is what distinguishes conceptual search from simple vector similarity — the results are not just similar units but structurally connected ones.

**Procedural search** finds sequences of steps and workflows. A query like "how do I set up a new organ handler?" should return not a definition but a procedure: the ordered steps, the prerequisites, the validation criteria. Procedural units are tagged with sequential metadata (step numbers, prerequisites, postconditions) that allows the search system to reconstruct ordered workflows from atomic units.

The search interface supports natural language queries that are automatically classified into the appropriate modality. In practice, most queries are textual (about 60%), followed by conceptual (25%), code (10%), and procedural (5%). The classification is not always correct — a conceptual query sometimes returns textual results — but the fallback behavior is graceful: the user gets relevant results, just not optimally structured ones.

---

## The Linguistic Atomization Framework

`linguistic-atomization-framework` extends the knowledge atomization methodology from English-language Claude conversations to a multilingual corpus of 46 texts. Where `my-knowledge-base` answers "what do I know?", the linguistic atomization framework answers "how does knowledge structure vary across languages and literary traditions?"

The framework implements 6 analysis modules:

**Module 1: Morphological Atomization.** Decomposes words into morphemes and maps morphological patterns across languages. This is not standard morphological analysis — the module specifically tracks how compositional meaning (the meaning of a compound word derived from its parts) differs from conventional meaning (the meaning assigned by usage regardless of parts). In German, compounds like *Weltanschauung* carry compositional meaning that their English translations ("worldview") only partially capture. The module quantifies this gap by computing a compositionality score: the semantic similarity between the compound's embedding and the compositional average of its parts' embeddings. A score of 1.0 means fully compositional; 0.0 means fully conventional.

**Module 2: Syntactic Dependency Parsing.** Maps sentence-level dependency structures and identifies syntactic patterns that carry semantic weight beyond their grammatical function. Latin's flexible word order, for example, uses syntactic positioning for emphasis in ways that English's rigid SVO structure cannot replicate. The module captures these positional semantics as annotations on the dependency parse, creating a richer representation than standard dependency trees provide.

**Module 3: Semantic Field Mapping.** Identifies semantic fields (clusters of related concepts) within each text and maps how those fields overlap or diverge across languages. The semantic field of "knowledge" in Ancient Greek (episteme, gnosis, techne, phronesis, sophia — each with distinct ontological commitments) is structurally richer than the English "knowledge/skill/wisdom" trichotomy. The module produces comparative field maps that visualize these structural differences as weighted graphs.

**Module 4: Rhetorical Structure Analysis.** Applies Rhetorical Structure Theory (RST) to identify how texts organize arguments. The module tracks 23 rhetorical relations (elaboration, contrast, cause, condition, etc.) and measures how their distribution varies across languages and genres. Academic Arabic, for example, uses elaboration chains at roughly twice the frequency of academic English, producing a different argumentative texture that the module quantifies.

**Module 5: Pragmatic Inference Tracking.** Identifies implied meanings, presuppositions, and conversational implicatures — the things a text communicates without explicitly stating them. This module is the most experimental: pragmatic inference is notoriously difficult to formalize. The current implementation uses a combination of negation analysis (what the text explicitly denies often reveals what it assumes) and scalar implicature detection ("some" implies "not all"). Accuracy is approximately 65% against human annotations, which is enough to be useful as a research tool but not enough to be trusted without review.

**Module 6: Cross-Linguistic Alignment.** Takes the outputs of Modules 1–5 across multiple texts and produces alignment maps: where do two texts in different languages make the same claim using different linguistic structures? Where do they make different claims using similar structures? This module is the integrative layer that transforms per-text analyses into comparative insights.

The 46-text corpus spans 12 languages (English, Spanish, French, German, Italian, Portuguese, Arabic, Mandarin, Japanese, Ancient Greek, Latin, and Sanskrit) across four genres (philosophical treatises, literary fiction, scientific papers, and religious texts). Each text is fully processed through all 6 modules, producing approximately 150,000 annotations. The corpus is deliberately diverse — a Platonic dialogue, a García Márquez novel, a quantum mechanics paper, and the Rigveda should not produce similar analytical outputs, and if they do, the framework is not discriminating finely enough.

---

## Vector Search and Intelligence Extraction from Claude Conversations

The knowledge base is built substantially from Claude conversations. This deserves specific attention because searching over AI conversations differs from searching over human-authored documents in ways that matter for epistemic tuning.

First, AI conversations are inherently dialogical. A semantic unit extracted from a Claude response carries implicit context from the human prompt that elicited it. The atomization pipeline preserves this context by linking each response-derived unit to its prompt-derived unit. This means the dependency graph captures not just "what Claude said" but "what Claude said in response to what question, in what conversational context." A claim made in response to a hypothetical ("what if we assumed X?") has different epistemic status than the same claim made in response to a direct query ("is X true?"). The confidence tags reflect this distinction.

Second, AI conversations frequently contain self-corrections. Claude might state X, I might challenge it, and Claude might revise to Y. Standard text extraction would index both X and Y as equally valid claims. The atomization pipeline tracks conversational flow and marks superseded claims as `deprecated`, linking them to their replacements. The deprecated units remain in the index — they are useful for tracking how my understanding evolved — but they are excluded from active search results by default. Approximately 8% of all extracted units carry the `deprecated` tag, which is a useful metric for how often my assumptions get challenged and revised.

Third, and most importantly, AI conversations produce knowledge that is entangled with the AI's training distribution. A claim extracted from a Claude conversation might reflect genuine insight, or it might reflect a statistical pattern in the training data that happens to sound authoritative. The knowledge base addresses this through a three-tier confidence scheme:

- **Verified (high confidence):** Claims that I have independently confirmed through primary sources, code execution, or empirical testing.
- **Plausible (medium confidence):** Claims that are consistent with my existing knowledge and have not been contradicted, but have not been independently verified.
- **Provisional (low confidence):** Claims that are novel, surprising, or that Claude expressed uncertainty about during the conversation.

Approximately 35% of semantic units are verified, 50% are plausible, and 15% are provisional. The epistemic tuning process involves systematically promoting provisional units to plausible (by finding corroborating evidence) or deprecating them (by finding contradictions), and promoting plausible units to verified (by independent confirmation). This is ongoing, deliberate work — not an automated pipeline but a structured human-review process supported by automated tooling.

The promotion rate provides a useful health metric. In the first six months, approximately 40% of provisional units were promoted to plausible and 15% were deprecated. The remaining 45% are still provisional — neither confirmed nor contradicted, simply awaiting further evidence. This distribution feels right: if the promotion rate were too high, the provisional threshold might be too conservative; if the deprecation rate were too high, the conversations might be producing unreliable knowledge.

---

## Epistemic Tuning: Adjusting What a System Knows It Knows

With the atomization pipeline, the multi-modal search, and the confidence tiers in place, epistemic tuning becomes a concrete operation rather than a philosophical aspiration.

Epistemic tuning is the deliberate adjustment of a knowledge system's belief structure in response to new evidence, detected contradictions, or strategic priorities. It operates at three levels:

**Unit-level tuning:** Adjusting the confidence, content, or status of individual semantic units. When I discover that a claim attributed to Peirce actually originates with James, I update the unit's content and provenance. When a provisional claim is confirmed by a primary source, I promote it to verified. When a verified claim is contradicted by new evidence, I deprecate it and create a replacement unit documenting the correction and the reason for it. The deprecation-plus-replacement pattern ensures that the knowledge base retains a record of what was believed and why it changed — epistemic history, not just epistemic state.

**Dependency-level tuning:** Adjusting the dependency graph itself. When I realize that two previously independent concepts are actually related, I add a dependency edge. When I discover that a supposed dependency is spurious, I remove it. These graph edits propagate: adding a dependency from unit A to unit B means that any future change to B will flag A for review. Removing a dependency means A is no longer affected by changes to B. In practice, dependency-level tuning is the most consequential form of tuning because it determines the blast radius of future changes. A single misplaced dependency edge can cause hundreds of unnecessary review flags; a missing edge can cause important cascading updates to be silently skipped.

**System-level tuning:** Adjusting the global parameters that govern the knowledge system's behavior. What cosine similarity threshold should trigger a conflict detection alert? How aggressively should deprecated units be pruned from search results? How much should recency bias affect search ranking? These parameters are themselves knowledge — meta-knowledge about how the system should behave — and they are stored as semantic units in the knowledge base, subject to the same atomization and confidence-tracking processes as any other unit.

This recursive structure — the knowledge system stores knowledge about itself and tunes its own parameters using the same mechanisms it uses for all other knowledge — is directly analogous to RE:GE's self-model (described in the companion essay "Recursive Engines at Scale"). The pattern is the same: a system that models itself can diagnose itself, and a system that can diagnose itself can adapt itself. The eight-organ meta-system is, in a sense, the organizational manifestation of this same pattern applied at the scale of 78 repositories.

---

## The Auto-Revision-Epistemic-Engine

The `auto-revision-epistemic-engine` is the operational core of epistemic tuning. It implements an 8-phase revision workflow with 4 human review gates and a BLAKE3 audit chain that ensures every revision is cryptographically traceable.

The eight phases are:

1. **Ingestion:** New material (conversations, documents, code) enters the pipeline.
2. **Atomization:** The material is decomposed into semantic units using the methodology described above.
3. **Conflict Detection:** New units are compared against the existing knowledge graph for contradictions.
4. **Human Review Gate 1:** Detected conflicts are presented for human adjudication. No automated resolution of genuine conflicts — this is a deliberate design choice. Automated conflict resolution would require the system to make epistemic judgments (which claim is more likely true?), and I do not trust that judgment to be reliable enough for production use.
5. **Integration:** Reviewed units are incorporated into the knowledge graph with appropriate confidence tags and dependency edges.
6. **Propagation:** Changes are propagated through the dependency graph, flagging affected downstream units.
7. **Human Review Gate 2:** Propagation effects are presented for human review. A change to a foundational definition might flag 200 downstream units; the human decides which actually need revision and which are unaffected despite the formal dependency.
8. **Commitment:** Approved changes are committed to the knowledge base with BLAKE3 hashes for auditability.

Human Review Gates 3 and 4 occur during periodic full-system reviews (monthly and quarterly, respectively) rather than during the normal ingestion flow. Gate 3 reviews the overall shape of the knowledge graph: are there orphaned clusters? Are there overly dense dependency regions that might indicate conflated concepts? Are there regions where the average confidence has declined, suggesting accumulated uncertainty? Gate 4 reviews the meta-knowledge: are the system's own parameters still appropriate given the current size and distribution of the knowledge base?

The BLAKE3 audit chain serves a specific purpose: it makes the revision history tamper-evident. Every semantic unit, every dependency edge, and every confidence change is hashed and chained. If I claim that a particular insight originated in a conversation from October 2025, the audit chain provides cryptographic evidence that the unit was indeed ingested on that date and has not been retroactively modified. This matters for intellectual honesty — I cannot retroactively claim to have known something earlier than I did. And it matters for grant applications that require documenting the timeline of research and discovery: the audit chain is a timestamped, tamper-evident record of the entire knowledge development process.

---

## What "Self-Governing Orchestration" Actually Means

The phrase appears in ORGAN-I's documentation, and like "recursive self-modeling," it benefits from concrete explanation.

Self-governing orchestration means that the system manages its own workflow without requiring external scheduling or human micromanagement. The auto-revision engine does not wait for me to tell it to check for conflicts. It runs conflict detection automatically on every ingestion. It does not wait for me to tell it which units are affected by a change. It propagates automatically through the dependency graph. It does not wait for me to tell it to hash and chain the revisions. It commits to the BLAKE3 audit chain automatically after every approved change.

But — and this is crucial — it does wait for human review at the gates. Self-governing does not mean autonomous. It means the system handles the routine orchestration (scheduling, propagation, conflict detection, audit chain maintenance) while humans handle the judgment calls (is this conflict genuine? does this propagation effect warrant a revision?). The system is self-governing in its operations and human-governed in its epistemology.

The practical implication is that I spend my time on epistemic judgment rather than epistemic bookkeeping. The system tells me "these 14 units conflict with your new insight about Peircean abduction; here they are, ranked by impact." I review them and decide which need revision. The system then handles the revision propagation, re-indexing, confidence updates, and audit chain commits. A typical ingestion cycle — one conversation, approximately 60 new semantic units — requires about 15 minutes of human review time. Without the automated orchestration, the same review would take 2–3 hours, most of it spent on bookkeeping rather than judgment.

This is the model that scales. A knowledge base with 12,000 semantic units and 45,000 dependency edges cannot be maintained by manual review alone. But it also cannot be maintained by fully automated systems, because epistemic judgment — deciding what is true, what is important, what depends on what — is not a solved problem in AI. Self-governing orchestration occupies the productive middle ground: automated infrastructure supporting human judgment.

---

## Practical Applications and the ORGAN-I Research Pipeline

The epistemic tuning infrastructure feeds directly into ORGAN-I's broader research mission. `narratological-algorithmic-lenses` uses the knowledge base to retrieve relevant theoretical frameworks when analyzing new texts. RE:GE's Handler 5 (`myth_processor`) queries the knowledge base for mythological pattern definitions. `call-function--ontological` grounds its Heideggerian and Aristotelian function-calling framework in the verified semantic units that define those ontological concepts.

The flow is bidirectional. RE:GE's outputs — symbolic entities, ritual execution logs, emergence reports — are fed back into the atomization pipeline as new material. The knowledge base grows not just from conversations and documents but from the system's own operational output. This creates a feedback loop: the system's theoretical work generates artifacts that become part of the system's knowledge, which in turn informs future theoretical work. Over time, the knowledge base becomes an increasingly accurate map of the system's own intellectual history.

This feedback loop is the reason I invested months in building the epistemic tuning infrastructure rather than using a standard knowledge management tool. Notion, Obsidian (as a standalone tool), and similar systems can store and retrieve knowledge. They cannot manage the epistemological structure of that knowledge — the confidence levels, the dependencies, the conflict detection, the propagation rules. They cannot tune themselves. The epistemic tuning infrastructure can, and that capability is what makes ORGAN-I's research pipeline sustainable as the knowledge base grows from thousands to tens of thousands of semantic units.

The eight-organ system depends on ORGAN-I not just for theoretical frameworks but for the epistemic infrastructure that keeps those frameworks coherent. When ORGAN-II's `metasystem-master` queries RE:GE for symbolic state, that state is grounded in a knowledge base whose confidence levels and dependency structures have been deliberately tuned. When ORGAN-III's commercial products reference ORGAN-I's research, they reference knowledge that has been through conflict detection, human review, and cryptographic auditing. Epistemic tuning is not an abstract concern. It is the quality assurance layer for everything the system produces.
