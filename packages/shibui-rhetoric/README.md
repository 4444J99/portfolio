# @4444j99/shibui-rhetoric

A linguistically-grounded text simplification engine that transforms academic prose into accessible content through five rhetorical transformation functions.

## Installation

```bash
npm install @4444j99/shibui-rhetoric
```

## The Five Functions

### F1: Complexity Reduction
**Linguistic basis:** Chomsky's Transformational Grammar

Reduces syntactic depth by flattening embedded clauses, removing relative clauses, parenthetical asides, appositives, and em-dash elaborations. Target: sentence depth ≤ 2 levels of clause embedding.

```js
import { f1_complexityReduction } from '@4444j99/shibui-rhetoric';

const input = "Conway's Law, which observes that system design mirrors organizational structure, is the foundation.";
const result = f1_complexityReduction(input);
// "Conway's Law is the foundation."
```

### F2: Term Substitution
**Linguistic basis:** Hypernym chains via vocabulary definitions

Replaces domain-specific terms with accessible plain-language alternatives. Only substitutes first occurrence; preserves subsequent mentions. Maximum 3 substitutions per text block.

```js
import { f2_termSubstitution } from '@4444j99/shibui-rhetoric';

const vocab = new Map([
  ['epistemic', { term: 'epistemic', definition: 'Related to knowledge and how we know things' }]
]);
const result = f2_termSubstitution('The epistemic approach was novel.', vocab);
// "The related to knowledge approach was novel."
```

### F3: Information Density Control
**Linguistic basis:** Shannon entropy / necessity scoring

Scores each sentence on information density using entropy heuristics. Keeps high-information sentences (data, specific claims, unique markers) and filters low-information filler (hedging, corporate buzzwords, emotional reassurance).

```js
import { f3_scoreSentence, f3_informationDensity } from '@4444j99/shibui-rhetoric';

const filler = 'As widely documented in the literature, this is generally known.';
const score = f3_scoreSentence(filler); // 0.2 (low)
```

### F4: Register Shift
**Linguistic basis:** Halliday's Systemic Functional Linguistics (SFL)

Shifts tenor (formal→casual) and mode (written→spoken) while preserving field (topic). Transforms passive voice to active first-person, replaces Latinate vocabulary with Anglo-Saxon alternatives, removes hedging constructions.

```js
import { f4_registerShift } from '@4444j99/shibui-rhetoric';

const input = 'The methodology facilitates the discourse.';
const result = f4_registerShift(input);
// "The approach helps the discussion."
```

### F5: Coherence Preservation
**Linguistic basis:** Rhetorical Structure Theory (RST)

Classifies sentences as nucleus (core claims) or satellite (evidence/elaboration) using discourse markers. Preserves all nucleus sentences and top 2 satellites, maintaining narrative coherence while compressing supporting detail.

```js
import { f5_classifySentences, f5_coherencePreservation } from '@4444j99/shibui-rhetoric';

const sentences = ['The core claim.', 'For example, supporting detail.'];
const classified = f5_classifySentences(sentences);
// [{ text: 'The core claim.', role: 'nucleus' }, { text: 'For example...', role: 'satellite' }]
```

## Composition

The `simplify()` function applies all five functions in sequence:

```js
import { simplify } from '@4444j99/shibui-rhetoric';

const result = simplify(text, vocabulary, {
  maxLength: 300,    // Maximum output length
  skipF2: false,    // Skip term substitution
  skipF4: false     // Skip register shift
});
```

Pipeline: F1 → F2 → F3 → F4 → F5

## Testing

```bash
npm run test
```
