---
title: "Generative Music Case Study"
description: "How symbolic narrative events from a recursive engine become live generative music through the Omni-Dromenon performance infrastructure, and what machine-composed performance actually sounds like."
pubDate: 2026-02-11
featured: false
tags: ["Organ-ii", "Art", "Generative-music", "Performance", "Creative-coding", "Case-study"]
---

# Generative Music Case Study

## The Sound of Recursive Systems

The first time the system produced something I would call music — not sound, not noise, not algorithmic output, but music — was in the middle of a ritual's albedo phase. RE:GE was processing a dissolution sequence, fermentation handlers were cycling through three alchemical stages, and the Max/MSP bridge was translating those symbolic events into OSC messages that modulated a granular synthesis patch. The result was a slowly evolving texture of vocal fragments — phonemes extracted from a Rilke poem, time-stretched and spectrally frozen — that shifted timbre as the fermentation progressed. When the ritual entered its rubedo phase, the texture coalesced into something almost melodic: a rising intervallic pattern that the system had derived from the narrative tension curve of the symbolic transformation in progress.

I did not compose that. I did not program it directly. I built the infrastructure — the recursive engine, the bridge, the synthesis patches, the mapping rules — and the system produced music as an emergent consequence of symbolic processing. This essay is about that infrastructure: how it works, where it breaks, and what it means for an audience to witness a machine composing in response to its own recursive operations.

---

## Architecture: From Symbolic Event to Audible Sound

The generative music pipeline spans two organs and four repositories. Understanding it requires tracing the full signal chain from symbolic event to speaker cone.

**ORGAN-I: `recursive-engine--generative-entity`** generates symbolic events. When a ritual executes, each phase transition, identity transformation, and symbolic operation produces an event on RE:GE's internal event bus. These events carry structured metadata: the operation type (dissolve, ferment, reconstitute, etc.), the symbolic entities involved, the current recursive depth, the coherence score from Handler 16, and timestamps. A single ritual execution at depth 8 produces between 200 and 500 events over its lifetime. These events are the raw material from which music is made.

**ORGAN-I to ORGAN-II bridge: Handler 13 (`maxmsp_bridge`) and `audio-synthesis-bridge`** translate symbolic events into OSC (Open Sound Control) messages. This is the critical juncture where meaning becomes signal. The translation is not trivial — there is no natural mapping between "dissolve an identity" and a specific audio parameter. The bridge implements a configurable mapping layer that I will describe in detail below.

**ORGAN-II: `metasystem-master` (Omni-Dromenon Engine)** receives the OSC messages and routes them to the appropriate synthesis modules. The Omni-Dromenon Engine is not a music application — it is a performance infrastructure that coordinates audio, visual, and interactive elements in real time. For this essay, I will focus on its audio routing capabilities and the performance state machine that governs when and how synthesis modules respond to incoming events.

**ORGAN-II: `example-generative-music`** provides the actual synthesis patches and compositional algorithms. These are the instruments the system plays. They include granular synthesis, spectral processing, algorithmic composition modules, and real-time audio effects. Each module is documented with its parameter space, its expected input format, and its aesthetic character.

The full pipeline latency — from symbolic event in RE:GE to audible sound — is between 50ms and 200ms depending on the complexity of the OSC translation and the synthesis patch. For context, human perceptual threshold for audio latency is approximately 10ms for rhythmic content and 50ms for textural content. The system is fast enough for evolving textures but too slow for rhythmically precise material. This constraint shapes the aesthetic: the generative music tends toward ambient, textural, and slowly evolving forms rather than rhythmic patterns. I have come to see this not as a limitation but as a character — the system's music sounds the way it does partly because of the architecture's constraints, and those constraints produce an aesthetic that no human musician would choose deliberately.

---

## The Audio Synthesis Bridge

`audio-synthesis-bridge` is a TypeScript library that bridges symbolic processing and audio synthesis. It implements two protocols: OSC for communication with Max/MSP and native Max externals, and WebAudio for browser-based synthesis. The dual-protocol design reflects a practical reality: Max/MSP is superior for real-time performance (lower latency, better DSP, more flexible routing) but requires a specific hardware and software setup. WebAudio runs in any modern browser, making it accessible for demos, documentation, and audiences without specialized gear.

The bridge's core abstraction is the **parameter mapping**. A parameter mapping defines how a symbolic event property translates to an audio parameter. Here is a simplified example:

```typescript
interface ParameterMapping {
  source: SymbolicEventField;
  target: AudioParameter;
  transform: TransformFunction;
  range: [number, number];
  smoothing: number; // milliseconds
}

const coherenceToFilterCutoff: ParameterMapping = {
  source: "coherence_score",
  target: "filter.cutoff",
  transform: (v: number) => Math.pow(v, 2) * 8000 + 200,
  range: [200, 8200],  // Hz
  smoothing: 500  // half-second smoothing to avoid zipper noise
};

const depthToReverb: ParameterMapping = {
  source: "recursive_depth",
  target: "reverb.decay_time",
  transform: (v: number) => v * 0.8 + 0.5,
  range: [0.5, 10.1],  // seconds
  smoothing: 2000  // slow crossfade between reverb settings
};
```

The `coherenceToFilterCutoff` mapping means: as the symbolic state becomes more coherent (coherence score approaches 1.0), the synthesis filter opens, producing a brighter timbre. As coherence drops (during dissolution phases, for example), the filter closes, producing a darker, more muffled sound. The quadratic scaling ensures that the perceptual change is more dramatic at high coherence levels — a design choice rooted in psychoacoustic research on perceived brightness, where the relationship between filter cutoff frequency and perceived brightness is approximately logarithmic.

The `depthToReverb` mapping means: deeper recursive operations produce longer reverb tails. At depth 1, the sound is relatively dry. At depth 12, the reverb tail extends to over 10 seconds, creating a wash of sustain that sonically represents the system's descent into deep self-reference. This is not arbitrary decoration. The long reverb at high depths provides an auditory warning that the system is approaching its recursion limit — a perceptual encoding of a system diagnostic that a human listener can learn to interpret.

The bridge currently supports 34 parameter mappings organized into 6 categories:

- **Spectral mappings (8):** Coherence, entropy, and complexity metrics mapped to filter cutoff, resonance, spectral tilt, and formant positions.
- **Temporal mappings (6):** Processing speed, event density, and phase duration mapped to tempo, grain density, and attack/decay envelopes.
- **Spatial mappings (5):** Handler chain topology mapped to stereo position, reverb characteristics, and spatial width.
- **Timbral mappings (7):** Identity properties (type, age, transformation count) mapped to waveform selection, harmonic content, and noise character.
- **Structural mappings (4):** Ritual phase transitions mapped to section changes, textural shifts, and macro-level form.
- **Dynamic mappings (4):** Confidence scores and emergence flags mapped to amplitude, compression, and dynamic range.

Each category produces a different perceptual dimension of the music. Spectral mappings control what the music sounds like (bright vs. dark, smooth vs. harsh). Temporal mappings control when things happen (fast vs. slow, dense vs. sparse). Spatial mappings control where the sound appears in the stereo field. Timbral mappings control the character of individual voices. Structural mappings control the large-scale form. Dynamic mappings control loudness and intensity.

The result is a multi-dimensional sonification where every perceivable aspect of the music corresponds to some aspect of the symbolic processing state. A listener does not need to understand the mappings consciously — the music is listenable as music — but a listener who does understand them can decode the system's internal state from the audio alone. I have tested this with musician friends: after a 15-minute explanation of the mapping scheme, they can identify ritual phase transitions and approximate recursive depth from audio alone, with roughly 70% accuracy. Non-musicians, given the same explanation, achieve approximately 45% accuracy — still well above chance for a 4-phase, 12-depth classification task.

---

## The Omni-Dromenon Engine as Performance Infrastructure

`metasystem-master` is ORGAN-II's canonical monorepo, and its core component — the Omni-Dromenon Engine — is the performance infrastructure that makes live generative music possible. The name is from Greek: *omni* (all) + *dromenon* (a thing done, a sacred rite performed). It is a system for performing everything.

The engine's architecture includes a core runtime, a performance SDK, a client SDK, the audio synthesis bridge, a CLI tool called `orchestrate`, four example applications, and extensive documentation. For the generative music use case, the relevant components are:

**Core Engine:** Manages the performance state machine. A performance progresses through states: IDLE → PREPARING → PERFORMING → PAUSING → CONCLUDING → IDLE. Each state transition triggers registered callbacks, allowing synthesis patches to adapt their behavior. During PREPARING, patches load samples and initialize DSP chains. During PERFORMING, they respond to incoming OSC events. During PAUSING, they hold their current state (sustaining notes, freezing granular positions) rather than going silent. During CONCLUDING, they apply fade-outs and decay tails that respect the current reverb and delay settings, producing endings that emerge naturally from the sonic material rather than cutting abruptly.

**Performance SDK:** Provides the API that synthesis patches use to register themselves, declare their parameter inputs, and respond to OSC events. The SDK handles the plumbing: OSC parsing, parameter smoothing, thread-safe state updates, and timing synchronization. Patch developers write musical logic; the SDK handles infrastructure. The SDK also provides a monitoring interface that reports real-time latency, event throughput, and parameter values — essential for diagnosing issues during live performance.

**The `orchestrate` CLI:** Starts, stops, monitors, and configures live performances from the terminal. During development and rehearsal, I use `orchestrate` to launch performances, adjust parameter mappings in real time, monitor latency metrics, and capture audio output. The CLI is not a consumer-facing product — it is a development and performance tool optimized for rapid iteration. A typical command sequence looks like:

```bash
orchestrate start --ritual alchemical-triad --preset contemplative
orchestrate adjust --mapping coherence_to_cutoff --smoothing 800
orchestrate monitor --latency --events --parameters
orchestrate capture --format wav --duration 3600
```

**Example Application: `example-generative-music`:** The reference implementation of generative music within the Omni-Dromenon framework. It includes four synthesis modules (granular, spectral, additive, and FM), a compositional logic layer that generates melodic and harmonic content from symbolic event streams, and a mixing layer that balances the four modules dynamically based on the current ritual phase.

---

## How Narrative Structure Maps to Musical Form

The compositional logic layer deserves particular attention. It does not generate notes randomly. It derives pitch material from the symbolic event stream using a process I call **narrative-to-intervallic mapping**.

When RE:GE processes a mythological narrative, the narrative has a tension curve — rising action, climax, falling action. The compositional logic maps this tension curve to an intervallic space: low tension produces small intervals (seconds, thirds), high tension produces large intervals (sevenths, tritones), and climactic moments produce octave displacements. The result is a melodic contour that mirrors the narrative's dramatic shape without being predictable from it — because the specific pitches are selected from a pitch-class set that rotates based on the ritual phase, introducing enough harmonic variety to prevent the music from becoming a simple graph sonification.

The harmonic layer works similarly. Symbolic coherence maps to harmonic stability: high coherence produces consonant intervals (octaves, fifths, fourths); low coherence produces dissonant intervals (seconds, tritones, augmented fourths). The tonal center itself is derived from the ritual's phase: nigredo begins on a low, dark root; albedo shifts to a brighter tonal region; rubedo resolves to a key that is related to nigredo's root by the intervallic distance of the transformation that occurred. If the transformation was minor (small symbolic distance), rubedo resolves to a nearby key. If the transformation was major (large symbolic distance), rubedo resolves to a distant key, producing a sense of harmonic journey that parallels the symbolic journey.

The I→II dependency — `recursive-engine--generative-entity` feeding `metasystem-master` — is not just a data flow. It is a structural correspondence between narrative and musical form. Narrative has acts; music has sections. Narrative has characters; music has voices. Narrative has tension and resolution; music has dissonance and consonance. These correspondences are ancient — opera, Leitmotif, program music — but they have traditionally been implemented by human composers who interpret narrative and express it musically through craft and intuition.

The question this system addresses is: can these correspondences be formalized and automated? The answer is: partially. The formalization works well for structural correspondences — mapping acts to sections, characters to timbral voices, tension curves to melodic contour. These are relatively mechanical translations that produce musically coherent results. The formalization works less well for expressive correspondences — the difference between a passage that is technically tense and one that feels tense to a listener. Technical tension (dissonant intervals, rhythmic instability, spectral harshness) is a necessary but insufficient condition for felt tension. The gap between technical and felt expressiveness is where the system reaches its current limit.

I have experimented with two approaches to bridging this gap. The first is **perceptual feedback loops**: recording audience physiological responses (galvanic skin response, heart rate variability) during performances and using that data to adjust the mapping parameters. This works in principle but is impractical for most performance contexts — wiring up audiences to biosensors is not conducive to artistic experience. The second is **aesthetic presets**: manually curated mapping configurations that I have tuned to produce specific emotional qualities. The "contemplative" preset uses wider smoothing windows, lower dynamic ranges, and a bias toward consonant intervals, producing music that feels reflective regardless of the symbolic input. The "ecstatic" preset uses narrow smoothing, wide dynamics, and a bias toward large intervals and spectral brightness, producing music that feels urgent and overwhelming. The "funereal" preset uses very long reverb tails, minimal dynamic variation, and a preference for descending melodic motion.

Currently, the system ships with 8 aesthetic presets. They are not machine-learned — they are the product of hundreds of hours of listening, adjusting parameters, listening again, and making judgments that I cannot fully articulate. This is the part of generative music that resists formalization, and I have come to think that it should resist. The aesthetic presets encode taste, and taste is irreducibly human.

---

## Real-Time Performance: What Happens When the System Runs Live

A live performance using this system proceeds as follows:

1. I select a ritual specification — a DSL script that defines the symbolic transformations to be performed. Recent performances have used rituals based on alchemical transformation sequences (nigredo → albedo → citrinitas → rubedo) or mythological narrative arcs (departure → initiation → return).

2. I choose an aesthetic preset and configure the parameter mappings. Sometimes I start with a preset and modify specific mappings based on the character of the ritual — a particularly violent dissolution sequence might warrant wider dynamic range than the default preset provides.

3. RE:GE begins executing the ritual. Symbolic events flow through Handler 13 to the audio synthesis bridge. The first sounds typically emerge within 500ms of the ritual's first symbolic operation.

4. The Omni-Dromenon Engine receives the events, routes them to synthesis modules, and the sound begins. The four synthesis modules (granular, spectral, additive, FM) are all active simultaneously, with the mixing layer controlling their relative levels based on the structural mappings.

5. The performance unfolds over 15–60 minutes, depending on the ritual's complexity and recursive depth. Shorter rituals (depth 3–4, single phase) produce focused, concentrated pieces. Longer rituals (depth 8–10, three or four phases) produce extended, slowly evolving compositions with distinct sections. The longest performance to date was 72 minutes, using a four-phase ritual at depth 10 with two nested sub-rituals.

6. I intervene selectively: adjusting a mapping parameter when the sound becomes too static, triggering a secondary ritual to introduce new symbolic material, or manually overriding a synthesis parameter when the automated mapping produces an aesthetically unsatisfying result.

The ratio of automated to manual control varies. In early performances, I intervened frequently — every few minutes. As the mapping configurations matured and the aesthetic presets stabilized, my interventions decreased. Recent performances average one manual intervention every 8–10 minutes, usually a subtle mapping adjustment rather than a dramatic override. The system does most of the composing. I do the curating. My role during performance is closer to a recording engineer than a performer: I am not creating the sound, but I am responsible for the overall sonic quality of what the audience hears.

---

## Challenges: Latency, Expressiveness, Determinism vs. Surprise

Three challenges persist, and I want to be honest about each because they define the system's current limitations and suggest its future development trajectory.

**Latency.** The 50–200ms pipeline latency is manageable for textural and ambient music but prohibitive for rhythmic content. Attempts to generate rhythmic patterns from symbolic events have failed because the latency introduces timing jitter that destroys groove. Rhythmic music requires timing precision on the order of 1–3ms; 50ms of jitter makes even simple patterns sound drunk. The current workaround is to pre-generate rhythmic patterns during the PREPARING phase and use symbolic events to select between patterns rather than generate them in real time. This works but reduces the connection between symbolic state and musical output for the rhythmic dimension — the rhythm is influenced by symbolic state (which pattern is selected) but not driven by it (the pattern's timing is pre-determined).

The root cause is the multi-stage pipeline: RE:GE processes a symbolic event (5–15ms), the bridge translates it to OSC (2–5ms), the network transmits the OSC packet (1–10ms depending on whether Max/MSP is local or networked), and the synthesis module processes the parameter change (10–50ms including smoothing). Each stage is individually optimized, but the sum of optimized stages still exceeds the threshold for rhythmic coherence. I do not see a path to solving this without fundamentally restructuring the pipeline — perhaps embedding a lightweight synthesis engine directly inside RE:GE's process, eliminating the network hop entirely. That is a major architectural change that I have not yet undertaken.

**Expressiveness.** The 34 parameter mappings produce music that is structurally coherent but sometimes emotionally flat. The mapping layer translates symbolic properties to audio parameters with mathematical precision, but mathematical precision is not the same as musical expressiveness. A human musician playing a passage marked *fortissimo* does not simply increase amplitude — they change their attack, their tone, their timing, their posture, their breathing. Expressiveness is holistic and embodied. The mapping layer is parametric and disembodied. Bridging this gap is an open research question that I address currently through the aesthetic presets, but the presets are static — they do not adapt to the specific character of the symbolic material being processed. A more sophisticated approach would involve learning expressive mappings from recordings of human performers responding to the same symbolic material, but this requires a dataset that does not yet exist.

**Determinism vs. surprise.** Given the same ritual specification and the same parameter mappings, the system produces the same music. This is by design — determinism enables debugging, rehearsal, and reproducible research. But musical interest requires surprise. A piece that is exactly the same every time it plays becomes boring on the third listen. I introduce controlled randomness through two mechanisms: a stochastic element in the compositional logic that occasionally replaces the derived pitch with a neighboring pitch class (introducing melodic "slips" at a configurable probability, default 8%), and a randomized initial state for the synthesis modules that produces subtly different timbres on each performance even with identical parameters. These mechanisms produce enough variation to prevent exact repetition without destroying the connection between symbolic state and musical output. The variation is subtle — a listener who heard two performances of the same ritual would recognize them as the same piece, but would notice differences in specific melodic moments and timbral textures.

---

## What It Means to Witness Machine-Composed Performance

I want to end with the audience, because this work is ultimately for them.

There is a persistent question about generative music: is it real music? The question usually implies that "real" means "composed by a human with intention and emotion." By that criterion, this system's output is ambiguous. It is not composed by a human — I build the infrastructure, not the specific notes. But it is not composed by a machine with intention and emotion either. It is composed by a recursive process whose structure reflects my theoretical commitments, aesthetic preferences, and years of iterative tuning. The music is, in a meaningful sense, a portrait of the system that produces it — and the system is, in a meaningful sense, a portrait of me.

The audience experience, reported by attendees of informal salon performances (ORGAN-VI hosts these through `organvm-vi-koinonia`), is consistent: the music feels organic but unfamiliar. It has structure — audible sections, recurring timbral motifs, dynamic arcs — but the structure follows a logic that listeners cannot fully predict. The closest analogy multiple listeners have independently offered is weather: you can perceive patterns (a storm building, a calm after rain) without being able to predict exactly what will happen next. Several listeners have described the experience as "listening to something think," which is closer to the truth than they probably realize. They are listening to recursive symbolic processing rendered as sound — and recursive symbolic processing does, in fact, bear structural similarities to thinking.

The salon format matters. These are not concert performances in darkened halls. They are living-room gatherings where I explain the system before the performance, answer questions during it, and discuss the output afterward. The explanatory context transforms the listening experience. Listeners who understand that the rising tension they hear corresponds to increasing recursive depth, that the timbral darkening they perceive corresponds to decreasing symbolic coherence, report a fundamentally different experience from listeners who hear the same music without context. The contextualized listeners describe active interpretation — following the system's process through its sonic output. The non-contextualized listeners describe passive aesthetic experience — hearing ambient music that is pleasant but unremarkable.

This distinction points to the value proposition for ORGAN-II's generative art: not that machines compose better than humans, but that machine composition reveals structures that human composition conceals. A human composer chooses to increase tension at a specific moment for dramatic reasons that may be intuitive and inarticulate. The system increases tension because the underlying symbolic process is becoming more recursive. Both produce a similar audible effect, but the system's version makes the cause legible. The music becomes a window into a process that would otherwise be invisible — a form of audible epistemology.

The eight-organ system exists to sustain this kind of work: theoretically grounded, technically sophisticated, publicly documented, and artistically genuine. ORGAN-I provides the recursive engine and the epistemic infrastructure. ORGAN-II provides the performance framework and the synthesis tools. ORGAN-V, through essays like this one, provides the public account of how and why it works. ORGAN-VI provides the salon context in which audiences encounter the work. The generative music is not a demo or a proof of concept. It is what the system is for. Everything else — the governance layer, the commercial products, the documentation corpus — exists to support the conditions under which recursive symbolic processes can become audible art.
