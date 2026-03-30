# Gemini Task: Landing Copy + LinkedIn Post

## Context

This is a personal portfolio for a senior engineer (15 years experience) at https://4444j99.github.io/portfolio/. The site has a depth system called "Shibui" that adapts content complexity to the reader — Overview (simple), Standard (annotated), Full (academic). The system uses a rehype plugin that algorithmically scores every paragraph by complexity and generates simplified entry text using five rhetorical transformation functions (Complexity Reduction, Term Substitution, Information Density Control, Register Shift, Coherence Preservation).

The problem: the depth system is invisible to visitors. Nobody discovers the depth control. The homepage leads with jargon. Recruiters bounce in 7 seconds.

## Deliverables

Write all output to `scripts/swarm-output/gemini-copy/` as markdown files.

### 1. Hero Copy (3 variants)

File: `hero-variants.md`

Write 3 variants of the homepage hero text. Requirements:
- Must work WITHOUT the depth system (the basic pitch must land at any depth)
- Above the fold: who you are, what you do, proof it's real
- Include: name (Anthony James Padavano), years (15), concrete numbers (105 repos, 527 tests, 270K words documented)
- Each variant has a different tone: (A) direct/confident, (B) narrative/story, (C) question-led
- Maximum 3 sentences per variant
- No jargon: "AI Orchestration Architect" needs translation for recruiters

### 2. LinkedIn Post

File: `linkedin-depth-system.md`

Write a LinkedIn post (1200-1500 chars) announcing the depth system. Hook: "I built a system that rewrites my portfolio in real-time based on who's reading it." Structure:
- Hook (1 sentence)
- Problem (recruiters can't understand technical portfolios)
- Solution (algorithmic content adaptation)
- How it works (3 bullet points, no jargon)
- The technical flex (5 rhetorical functions grounded in Chomsky, Halliday, Shannon)
- CTA: "Try it yourself" + link

### 3. Bridge Button Copy

File: `bridge-buttons.md`

The current bridge buttons say "This section goes deeper →" which is generic. Write 10 contextual alternatives that:
- Tell the reader what they'll gain by expanding
- Use action verbs
- Are under 40 characters each
- Examples: "See the architecture →", "Read the evidence →", "View technical details →"

### 4. Depth Control Onboarding Copy

File: `onboarding-panel.md`

Write copy for a first-visit onboarding panel with three cards:
- Card 1: Overview mode (icon: single ring) — what it does, who it's for
- Card 2: Standard mode (icon: two rings) — what it does, who it's for
- Card 3: Full Depth mode (icon: three rings) — what it does, who it's for
- Panel title and dismissal CTA
- Maximum 2 sentences per card

## Tone

The Orchestrator Voice Constitution applies: system-first, precise, no chatty filler, no motivational language. Prefer words that classify, govern, transform. But the OUTPUT (the copy itself) should be warm and accessible — the constitution governs how you write, the copy governs how visitors read.

## Output Location

```
scripts/swarm-output/gemini-copy/
├── hero-variants.md
├── linkedin-depth-system.md
├── bridge-buttons.md
└── onboarding-panel.md
```
