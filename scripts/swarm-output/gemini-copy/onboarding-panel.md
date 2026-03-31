# Depth Control Onboarding Panel Copy

---

## Panel Title

**Choose your reading depth**

---

## Card 1: Overview Mode

**Icon:** Single concentric ring (◇)

**What it does:**
Plain language. No jargon. Quick scan for busy readers.

**Who it's for:**
Recruiters. Hiring managers. Anyone who wants the gist in 30 seconds.

---

## Card 2: Standard Mode

**Icon:** Two concentric rings (◎◇)

**What it does:**
Full text with highlighted concepts. Domain terms get inline definitions.

**Who it's for:**
Curious readers. Fellow engineers. Technical recruiters who want depth without博士学位.

---

## Card 3: Full Depth Mode

**Icon:** Three concentric rings (●◎◇)

**What it does:**
Complete academic treatment. Full citations. Complete reasoning. No simplification.

**Who it's for:**
Fellow principals and staff engineers. Researchers. Anyone evaluating me for deep technical work.

---

## Dismissal CTA

"Skip for now"

(Or: "I'll figure it out")

---

**Notes:**

- Cards stack vertically on mobile, side-by-side on desktop
- Each card click: sets `data-shibui-depth` on `<html>`, writes to localStorage, dismisses panel
- Panel only shows if `!localStorage.getItem('shibui-depth')`
- Animation: fade + scale from 0.95, respects `prefers-reduced-motion`
- If Plausible is loaded: fire `Depth Change` event with `{ from: 'onboarding', to: selectedDepth }`
