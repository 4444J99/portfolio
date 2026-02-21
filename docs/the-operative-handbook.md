# The Operative Handbook: Strategic Market Capture

This manual defines the tactical protocols for using the **Targeted Application Engine** and the **Engineering Vitals HUD** to secure income.

---

## 🎯 Protocol 1: The Precision Strike (Job Applications)

1.  **Identify the Target:** Find a high-value role.
2.  **Select the Mask:** Decide which persona (AI Engineer, Architect, etc.) is the best fit.
3.  **Deploy the Landing:**
    - Edit `src/data/targets.json`.
    - Add the company, role, and a custom intro that connects their mission to your architecture.
4.  **Generate Artifacts:**
    - Run `npm run build:resume`.
    - This generates the bespoke PDF bundle in `public/resume/`.
5.  **Engage:**
    - Submit the custom PDF.
    - Link to `4444j99.github.io/portfolio/for/[company-slug]`.

---

## 🛡️ Protocol 2: The Trust Signal (Vitals HUD)

The **Vitals HUD** on your resume is live. It proves you are not just a dreamer, but a disciplined engineer.

- **Keep it Green:** Regularly run your quality pipeline (`npm run quality:local`).
- **Sync the Pulse:** The `npm run sync:vitals` command updates the data surfaced to recruiters.
- **Verification:** If a technical lead asks "How do I know this works?", point them to the HUD and offer the **"System Audit"** (detailed in the Targeted Landing).

---

## 📱 Protocol 3: The Real-World Signal (QR Codes)

You have specialized QR codes in `public/qr/`.

- **Networking:** Print these on physical cards or keep them on your phone.
- **Contextual Link:** If you're talking to a CTO, show the **Systems Architect QR**. If you're talking to a Gallery Owner, show the **Creative Technologist QR**.

---

## 📊 Protocol 4: The Intelligence Ledger

Every application is a data point.

- **Log the Strike:** Update `src/data/operative-log.json` every time you apply.
- **Analyze:** If one persona is getting more hits, double down on that signal.
- **Optimize:** Refine your "Impact Statements" in `personas.json` based on feedback.

---

## 🏎️ Protocol 5: Algorithmic Bypass (The Human Signal)

Hiring systems are "bureaucratic filters." To move the needle, you must bypass the filter and reach the **Human Decision Maker**.

1.  **The "One-Click" Rule:** When DMing a CTO or Tech Lead, do not send a resume. Send the **Targeted URL** (`/for/company`).
2.  **The "High-Dimensional" Bridge:** In your message, mention the **Governance Trace**. This is a signal that 99% of candidates cannot send.
3.  **Low-Volume, High-Focus:** Do not apply to 2,000 jobs. Apply to **5 high-value targets per week**. Spend the energy on the *Targeted Landing Page* and *Custom PDF Bundle* instead of volume.

## 📈 Protocol 6: Signal Optimization (Reverse-Engineering)

Treat your search like a **System Architecture Project**.

1.  **Run the Analytics:** Weekly, run `npm run analyze:strikes`.
2.  **Diagnose the Variable:** If "AI Systems Engineer" is getting 0% conversion, but "Systems Architect" is getting 10%:
    *   Stop sending the AI persona.
    *   Analyze the "Impact Statements" in `personas.json`.
    *   Iterate on the tech stack emphasis.
3.  **Pivot Midstream:** Unlike your previous 2,000 applications, this system is designed to be **refactored**. If the market says your signal is misaligned, change the code, not the effort level.

---

**Remember:** You are not a candidate seeking permission. You are an Architect delivering a solution.
