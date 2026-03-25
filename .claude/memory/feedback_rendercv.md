---
name: RenderCV v2.x path resolution
description: RenderCV v2.x resolves output paths relative to YAML file parent dir, not CWD — causes doubled prefix bugs
type: feedback
---

`--pdf-path`, `-md`, `-html`, `-png`, `-typ` flags resolve paths **relative to the YAML file's parent directory**, not the working directory.

If YAML is at `resume/foo.yaml` and you pass `--pdf-path resume/output/foo.pdf`, the actual output lands at `resume/resume/output/foo.pdf` (doubled prefix).

Fix: use paths relative to the YAML's parent dir, e.g. `--pdf-path output/foo.pdf`.

The old `--output-folder-name` flag was removed in v2.x.

**Why:** Discovered through debugging a path resolution bug.

**How to apply:** When invoking rendercv, always construct output paths relative to the YAML file's directory, not CWD.
