# Bridge Button Copy — 10 Contextual Alternatives

---

Current: "This section goes deeper →"

Replacement options (under 40 characters each):

1. See the architecture →
2. Read the evidence →
3. View technical details →
4. Explore the implementation →
5. Dive into the code →
6. Trace the data flow →
7. Inspect the system →
8. Unpack the logic →
9. Access the full analysis →
10. Open the specification →

---

**Usage pattern:**

Add `data-shibui-bridge-label="architecture"` to the bridge button wrapper in each .astro page. The DepthControl script reads this attribute and applies the contextual copy above.

Example:
```astro
<span data-shibui-bridge-label="architecture">
  <button class="shibui-bridge">See the architecture →</button>
</span>
```

The JS enhancement layer reads `dataset.shibuiBridgeLabel` and maps to the appropriate phrase.
