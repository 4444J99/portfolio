---
title: "The Choreographic Interface: Designing Systems for Human Movement"
description: "How the choreographic interface pipeline transforms body movement into digital response — from sensor ingestion through mapping layers to real-time audiovisual output — and what this means for residency applications at Eyebeam, Somerset House, and the Processing Foundation."
pubDate: 2026-02-11
featured: false
tags: ["Organ-ii", "Art", "Choreography", "Interactive-performance", "Sensor-art", "Residency"]
---

# The Choreographic Interface: Designing Systems for Human Movement

## What It Means to Make a Body an Input Device

There is a particular kind of technical problem that arises only when you try to make human movement the primary input to a computational system. Not movement captured and analyzed after the fact — motion capture for film, pose estimation for sports analytics — but movement as a live, continuous, real-time control signal that drives audiovisual output with the same immediacy that a MIDI keyboard drives a synthesizer. The body moves, and something happens. Not two seconds later. Not after a processing queue clears. Now. The delay between gesture and response must be imperceptible, or the entire premise collapses. The dancer stops dancing and starts waiting.

I have been building systems for this kind of interaction for several years, and the technical challenges are unlike anything I have encountered in conventional software development. The input signal is noisy, high-dimensional, culturally encoded, and fundamentally ambiguous. A raised arm might be a greeting, a stretch, a dance move, or an attempt to reach something on a shelf. The system does not know which. It cannot ask. It must respond in a way that makes the ambiguity generative rather than frustrating — a way that rewards exploration rather than punishing imprecision.

The `example-choreographic-interface` repository in ORGAN-II (Poiesis) is my attempt to formalize this problem and its solutions into a reusable platform. It is not a single installation. It is infrastructure for building installations — a pipeline that takes raw sensor data, transforms it through configurable mapping layers, and produces real-time audiovisual output that responds to the bodies in the space. The platform sits on top of `metasystem-master`, the Omni-Dromenon Engine that serves as ORGAN-II's canonical performance infrastructure. Together, they form what I think of as the choreographic interface: a system that treats the space between bodies and computation as a design surface.

This essay describes what that system looks like technically, the decisions that shaped it, and why I believe this kind of work belongs in the same organizational structure as epistemological research and SaaS products.

---

## The Sensor-to-Output Pipeline

Every choreographic interface, regardless of its artistic specifics, follows the same fundamental pipeline: sensor ingestion, feature extraction, mapping, and output generation. The complexity lives in the details of each stage and in the transitions between them, but the architecture is consistent. Understanding the pipeline is understanding the platform.

### Stage 1: Sensor Ingestion

The first stage receives raw data from physical sensors in the installation space. The platform currently supports four input modalities, each with distinct characteristics:

**Depth cameras** (Intel RealSense, Microsoft Azure Kinect) provide a 3D point cloud of the space at 30 frames per second. Each frame contains roughly 300,000 depth points at 640x480 resolution, or 1.2 million at 1280x720. The data arrives as a stream of 16-bit depth values plus an aligned RGB color image. Depth cameras are the workhorse of installation art because they solve the silhouette problem — they can distinguish a person from the background without requiring special lighting, markers, or calibration of the kind that traditional motion capture demands.

**LIDAR** (Hokuyo, Slamtec, or more recently the LIDAR units in Apple's Pro devices) provides a 2D distance sweep — a single plane of range measurements rotating at 5-40 Hz. LIDAR excels at detecting presence and position in large spaces where depth cameras cannot cover the full volume. A single LIDAR unit mounted at hip height can track the positions of 20+ people in a 15-meter radius. It cannot tell you what their arms are doing, but it can tell you where they are, how fast they are moving, and whether they are approaching or retreating from a focal point. For large-scale installations — the kind you might build for a warehouse exhibition or a public plaza intervention — LIDAR is often the only viable primary sensor.

**Optical motion tracking** (OptiTrack, Vicon, or marker-free systems like The Captury) provides high-precision skeletal data: joint positions and rotations at 120-240 Hz with sub-millimeter accuracy. This is the gold standard for capturing detailed movement quality — the difference between a sharp, percussive arm extension and a slow, liquid one. The cost is prohibitive for most independent artists (a basic OptiTrack setup runs $15,000-$50,000), but residency programs at institutions like Eyebeam and Somerset House sometimes provide access to these systems as part of the studio infrastructure.

**Simulation mode** replaces physical sensors with algorithmic movement generation. This is not a compromise — it is a critical development and testing tool. When I am building a new mapping layer, I cannot have a dancer in my studio for the 40 hours of iteration it takes to get the parameters right. Simulation mode generates synthetic body data — configurable movement patterns with controllable noise, tempo, and spatial range — that lets me develop and test the full pipeline without physical sensors. The simulation models are parameterized: I can generate "cautious exploration" movement (slow, small range, high hesitation) or "confident performance" movement (large, dynamic, rhythmically regular) and verify that the mapping layer responds appropriately to both.

The ingestion layer normalizes all four modalities into a common internal representation: a timestamped stream of body state objects. Each body state contains a position (x, y, z in meters from the sensor origin), a velocity vector, an optional skeleton (25-joint model when available), and a confidence score indicating how reliable the tracking is for that frame. This normalization is essential. The mapping layer should not need to know whether the body data came from a $300 depth camera or a $30,000 motion capture system. The mapping speaks bodies, not hardware.

### Stage 2: Feature Extraction

Raw body state is too low-level for artistic mapping. A stream of joint positions at 30 Hz does not tell you whether the person is moving gently or aggressively, whether they are expanding into the space or contracting, whether their movement has rhythmic periodicity or is chaotic. Feature extraction transforms raw kinematics into higher-order movement qualities that artists can meaningfully map to outputs.

The platform extracts features at three temporal scales:

**Frame-level features** (computed every frame, ~33ms): instantaneous velocity magnitude, acceleration, angular velocity of limbs, spatial extent (bounding box volume), center-of-mass height, symmetry index (how similar are the left and right sides of the body).

**Phrase-level features** (computed over a sliding window of 1-3 seconds): movement smoothness (spectral arc length, a biomechanics metric that quantifies how jerky or fluid a movement is), rhythmic periodicity (autocorrelation of velocity signal), spatial range (how much of the available space the person has used in the recent window), directional tendency (is the person moving predominantly in one direction or wandering).

**Session-level features** (computed over the full interaction): cumulative spatial coverage (a heat map of where the person has been), exploration rate (how quickly they discover new areas of the space), engagement duration, movement vocabulary richness (how many distinct movement patterns have they produced).

The feature extraction stage is where Laban Movement Analysis — a century-old system for describing human movement quality developed by Rudolf Laban — enters the computational pipeline. Laban's four motion factors (Weight, Time, Space, Flow) map surprisingly well onto computable features. Weight corresponds roughly to acceleration magnitude and force estimation. Time maps to velocity and rhythmic periodicity. Space maps to spatial range and directional tendency. Flow maps to movement smoothness. The platform does not claim to implement full LMA — that would require a level of interpretive judgment that current algorithms cannot provide — but it uses the Laban framework as a conceptual scaffold for organizing extracted features into categories that make sense to choreographers and movement artists.

### Stage 3: Mapping

The mapping layer is the creative heart of the system. It defines the relationship between extracted movement features and output parameters. A simple mapping might connect velocity magnitude to audio volume. A complex mapping might route phrase-level smoothness through a nonlinear transfer function to control the density of a particle system, while simultaneously feeding session-level spatial coverage into a slowly evolving harmonic progression.

Mappings are defined in YAML configuration files. This is a deliberate design decision. I spent several months early in the project building a node-based visual mapping editor — the kind of thing that looks impressive in documentation screenshots — before realizing that the artists I was working with preferred a text-based configuration they could version control, diff, and share. A typical mapping file looks like this:

```yaml
mapping:
  name: "fluid-resonance"
  version: 2
  author: "installation-name"
  
  routes:
    - source: "body.velocity.magnitude"
      target: "audio.granular.density"
      transfer: "exponential"
      range: [0.0, 1.0]
      smoothing: 0.15
      
    - source: "body.phrase.smoothness"
      target: "visual.particle.coherence"
      transfer: "sigmoid"
      range: [0.2, 0.95]
      smoothing: 0.4
      
    - source: "body.session.spatial_coverage"
      target: "audio.harmony.complexity"
      transfer: "linear"
      range: [0.0, 1.0]
      smoothing: 2.0
```

Each route specifies a source feature, a target output parameter, a transfer function (linear, exponential, sigmoid, logarithmic, or custom), a range that clamps the output, and a smoothing coefficient that controls how quickly the output responds to changes in the input. The smoothing parameter is critical. Without it, the output jitters with every noisy sensor frame. With too much smoothing, the system feels sluggish and the dancer's agency disappears. Finding the right smoothing values for each mapping is one of the most time-consuming aspects of building an installation, and it is almost always done through embodied testing — having someone move in the space and adjusting parameters until the response feels right.

The YAML-based mapping system also enables what I call **preset libraries**: collections of tested, documented mappings that artists can use as starting points. The `example-choreographic-interface` repository ships with twelve presets covering common installation scenarios: solo performer with generative audio, group interaction with visual feedback, audience-participatory with threshold triggers, ambient responsive environment, and others. Each preset includes the YAML configuration, a written description of the intended interaction, and notes on which sensor configurations work best.

### Stage 4: Output Generation

The final stage converts mapped parameter values into actual audiovisual output. The platform does not implement its own rendering or synthesis engines. Instead, it sends OSC (Open Sound Control) messages to external applications — Max/MSP, SuperCollider, TouchDesigner, Processing, Unity, or any other creative coding environment that speaks OSC. This is a pragmatic architectural decision. Every installation artist already has preferred tools. Forcing them to use a proprietary rendering engine would be a non-starter. The platform's value is in the pipeline from body to parameters, not in the final rendering.

OSC output runs at a configurable rate, typically 60 Hz for visual parameters and 100 Hz for audio parameters. The difference matters: visual rendering at 60 fps is standard, but audio control signals benefit from higher update rates to avoid audible stepping artifacts in parameter changes.

---

## Designing for Non-Expert Bodies

The most important design constraint in audience-participatory installation art is one that never appears in the technical specification: most people who enter the space are not dancers. They are gallery visitors. They are uncertain about what they are supposed to do. They may be self-conscious about being watched. They may be accompanied by children who have no self-consciousness at all. They may have mobility limitations. They may spend thirty seconds in the space before moving on, or they may stay for twenty minutes.

Designing for this audience requires a fundamentally different approach than designing for trained performers. A performer can learn a mapping — "move your right arm up to increase pitch" — and use it expressively. A gallery visitor will not read instructions. They will walk into the space, notice that something is responding to them, and either become curious or leave. The first three seconds of that encounter determine everything.

The platform addresses this through what I call **tiered responsiveness**. The mapping layer supports three simultaneous response tiers:

**Ambient tier:** Always active, responds to presence alone. When someone enters the sensor field, the environment shifts — a light changes color, a drone shifts pitch, particles drift toward the newcomer. This requires no intentional movement. It rewards simply being in the space. It tells the visitor: "the system sees you."

**Gestural tier:** Activates when the system detects intentional movement above a configurable threshold. Walking counts. Reaching counts. Swaying counts. The threshold is set low enough that normal exploratory behavior triggers it, but high enough that standing still does not. This tier provides the core interactive experience for most visitors.

**Performative tier:** Activates when the system detects sustained, dynamic movement — the kind of engagement that suggests the visitor has understood the interactive premise and is actively exploring it. This tier unlocks more complex mappings: detailed gestural control, multi-body interaction, temporal accumulation effects that build over minutes of engagement. It rewards commitment without punishing casualness.

The tiered system means that a visitor who spends five seconds walking through the space has a complete experience (ambient response to their presence), while a visitor who spends fifteen minutes actively moving discovers capabilities that the first visitor never saw. Both experiences are valid. Neither is broken. The system scales its complexity to match the engagement it receives.

---

## The Metasystem-Master Architecture as Performance Infrastructure

The choreographic interface does not exist in isolation. It is one of four example applications built on top of `metasystem-master`, the Omni-Dromenon Engine that serves as ORGAN-II's canonical performance infrastructure. Understanding the relationship between these layers is essential for understanding why I built the platform this way rather than as a standalone application.

`metasystem-master` provides three things that every performance application needs: a real-time event bus with guaranteed sub-10ms delivery, a state management system that maintains the current configuration of all running modules, and a plugin architecture that allows new input sources, processing modules, and output sinks to be added without modifying the core. The choreographic interface is a set of plugins — sensor ingestion plugins, feature extraction plugins, mapping plugins, and OSC output plugins — that snap into this architecture.

This means the choreographic interface inherits capabilities from `metasystem-master` that would be extremely expensive to build from scratch: networked multi-machine operation (for installations that span multiple rooms or require distributed processing), session recording and playback (essential for documentation and post-show analysis), crash recovery (the show does not stop if one module throws an exception), and the `orchestrate` CLI for starting, stopping, and reconfiguring installations from the command line.

The shared architecture also means that the choreographic interface can interoperate with the other example applications in ORGAN-II. `example-generative-music` provides real-time audio synthesis driven by algorithmic composition. `example-theatre-dialogue` generates responsive text for performance contexts. `example-interactive-installation` handles multi-user spatial interaction in gallery settings. All four applications use the same event bus, the same state management, the same plugin interface. An installation that combines choreographic interaction with generative music and responsive text projection is not a special case requiring custom integration. It is a standard configuration — three sets of plugins running on the same engine.

---

## Real-Time Constraints: The 50-Millisecond Budget

The single most important number in embodied interaction design is the latency between a physical gesture and the system's response. Research in human-computer interaction consistently identifies approximately 100 milliseconds as the threshold of perceptible delay, but for embodied interaction the effective threshold is much lower. At 100ms, the response feels like a reaction — the system saw what you did and responded. At 50ms, the response feels like an extension — the system is part of your gesture, not a witness to it. Below 30ms, the distinction between body and system begins to dissolve entirely.

The platform targets end-to-end latency under 50 milliseconds. This budget breaks down as follows:

| Stage | Budget | Typical |
|-------|--------|---------|
| Sensor capture | 10ms | 8ms (depth camera at 30fps) |
| USB/network transfer | 5ms | 2-3ms |
| Feature extraction | 8ms | 5ms |
| Mapping computation | 2ms | <1ms |
| OSC transmission | 2ms | <1ms |
| Output rendering | 15ms | 10-12ms (depends on target app) |
| **Total** | **42ms** | **~30ms typical** |

The 8ms headroom between budget and typical allows for occasional sensor frame drops, garbage collection pauses, and the general unpredictability of running complex software on general-purpose operating systems. In practice, I have measured end-to-end latency averaging 28-35ms on a recent MacBook Pro with an Intel RealSense D435 sensor feeding into Max/MSP for audio output. This is well within the target range.

Achieving this latency required specific engineering decisions. Feature extraction runs on a dedicated thread with a pre-allocated memory pool — no dynamic allocation in the hot path. The mapping layer uses lookup tables for transfer functions rather than computing exponentials and sigmoids per frame. OSC messages are constructed once and reused with only the changed values updated. These are the kinds of optimizations that would be premature in a web application but are essential when the user's body is the input device and any perceptible delay breaks the illusion of connection.

---

## Connection to ORGAN-I: Recursive Engines Driving Performance Logic

The relationship between ORGAN-I (Theoria) and ORGAN-II (Poiesis) is not merely organizational. It is technical. The `recursive-engine--generative-entity` in ORGAN-I implements a symbolic processing system that the choreographic interface uses to drive performance logic — the rules that govern how an installation evolves over time beyond moment-to-moment movement response.

Consider an installation that runs for four hours during a gallery opening. If the mapping between body movement and output is static, the experience plateaus. Visitors who return after an hour find exactly the same interaction they left. The space does not remember. It does not accumulate. It does not evolve. For short installations this is acceptable, but for durational work — the kind that residency programs value — the system needs a memory and a trajectory.

The recursive engine provides this. It maintains a symbolic state that evolves based on the cumulative movement data from all visitors over the life of the installation. Early visitors might encounter a sparse, quiet environment that responds tentatively to their movement. As more people engage, the symbolic state accumulates — the engine's internal model becomes richer, and the mappings shift to accommodate more complex interaction. By the end of the evening, the installation has been shaped by every body that passed through it. The final state is unreproducible — a specific artifact of that specific audience's collective movement.

This is where theory becomes infrastructure in a way that I think justifies the organizational structure of the eight-organ system. The recursive engine was not built for the choreographic interface. It was built as an epistemological framework for symbolic processing — a research project in ORGAN-I investigating how recursive structures can represent and transform meaning. But its architecture — a state machine driven by external inputs that accumulates symbolic complexity over time — turns out to be exactly what durational performance installations need. The flow from ORGAN-I to ORGAN-II is not a branding exercise. It is a dependency edge in the system's architecture.

---

## Lessons from Installation Art: What Technology Enables vs. What It Obscures

I have installed interactive work in seven different spaces over the past four years, ranging from a 200-square-foot gallery in Brooklyn to a 4,000-square-foot warehouse in an industrial district. Each installation taught me something about the relationship between technical capability and artistic experience, and in most cases the lesson was about restraint rather than ambition.

The most successful installation I have built used a single LIDAR sensor, a single mapping route (distance from center → drone pitch), and a fog machine. Visitors walked into a dark, fog-filled room and discovered that their position in the space controlled a low, resonant drone. Moving toward the center raised the pitch. Moving toward the walls lowered it. There was nothing else. No visuals. No multi-body interaction. No tiered responsiveness. The experience was immediate, visceral, and unambiguous. People stayed for ten or fifteen minutes, slowly exploring the spatial-sonic relationship with their bodies. Several visitors described it as meditative.

The least successful installation used depth cameras, skeletal tracking, a 12-route mapping configuration driving simultaneous audio synthesis and particle systems, and responsive LED lighting. It was technically impressive and experientially overwhelming. Visitors did not know what they were controlling. The relationship between their movement and the output was so complex that it felt random. The technology worked perfectly — sub-40ms latency, stable tracking, beautiful audiovisuals — but the experience was incoherent because the mapping layer was doing too much. I had confused technical richness with experiential richness.

This is the central lesson I take from installation work: the quality of an interactive experience is not proportional to the complexity of the mapping. It is proportional to the legibility of the mapping. The visitor needs to understand — not intellectually, but bodily — that their movement matters. One clear relationship (my position controls this sound) is more powerful than twelve unclear relationships (something I'm doing seems to be affecting things, but I'm not sure what).

The platform reflects this lesson in its preset library. The simplest presets — single-route mappings with generous smoothing — consistently produce the strongest audience engagement. The complex presets exist for artists who want to build layered experiences for trained performers, but the defaults are simple. The system's sophistication is in the pipeline, not in the mapping.

---

## Why This Matters for Residency Applications

Residency programs at institutions like Eyebeam, Somerset House Studios, NEW INC, Pioneer Works, and the Processing Foundation are not looking for finished products. They are looking for sustained, rigorous creative practices that will benefit from the time, space, and community that a residency provides. The choreographic interface platform is specifically positioned for this context.

What I bring to a residency is not a single installation concept. I bring infrastructure for building installations — a tested, documented, configurable platform that can be adapted to any space, any sensor configuration, and any artistic vision. A residency gives me access to things I cannot replicate in my own studio: large physical spaces for full-scale testing, high-end sensor systems (particularly optical motion capture), audiences for participatory testing, and the community of peer artists whose feedback transforms technical platforms into meaningful art.

The platform's open architecture means that it can serve as collaborative infrastructure. During a residency, other artists could build their own mapping configurations on the platform, use the preset library as a starting point, or contribute new input modalities. The YAML-based configuration system means that artists who do not write code can still author and customize installations. This collaborative potential is exactly the kind of thing that residency committees value — work that generates community benefit beyond the individual artist's practice.

The eight-organ system supports this positioning. A residency reviewer who examines my application can trace the choreographic interface backward through the dependency graph: the performance platform in ORGAN-II draws on the recursive engine in ORGAN-I, which draws on epistemological research into symbolic processing. They can trace it forward: installations produced during the residency become documentation in ORGAN-V (Logos) and distribution material in ORGAN-VII (Kerygma). The residency output feeds back into the system. The work has a context that precedes and survives any single project.

I do not think of residency applications as requests for support. I think of them as proposals for mutual benefit — the institution provides infrastructure and community, and I provide a platform that generates art, documentation, and reusable creative technology. The choreographic interface is the specific form that proposal takes. A body moves, the system responds, and something happens that neither the body nor the system could produce alone. That interaction is the work. The platform is what makes it repeatable, configurable, and shareable. The eight-organ system is what makes it legible.
