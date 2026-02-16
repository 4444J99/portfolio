#!/usr/bin/env python3
"""Extract emergency-help project content from Claude.ai account export.

Parses conversations.json, projects.json, and memories.json to produce
a navigable, verified directory of project documents, conversation
transcripts, funding materials, and a funding action sequence.

Usage:
    cd /Users/4jp/Workspace/portfolio
    .venv/bin/python scripts/extract_emergency_help.py

Requirements: Python 3.12+ (standard library only)
"""

import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
EXPORT_DIR = Path("/Users/4jp/Workspace/intake/data-2026-02-16-00-20-00-batch-0000")
OUTPUT_DIR = Path("/Users/4jp/Workspace/portfolio/intake/emergency-help")

PROJECTS_JSON = EXPORT_DIR / "projects.json"
CONVERSATIONS_JSON = EXPORT_DIR / "conversations.json"
MEMORIES_JSON = EXPORT_DIR / "memories.json"

EH_PROJECT_UUID = "019c1ea1-0179-7109-be89-87a3c8465803"

# ---------------------------------------------------------------------------
# FILE mapping: manifest FILE-XXX → export doc filename (index in docs list)
# Built from manifest Section I cross-referenced with projects.json export
# ---------------------------------------------------------------------------
FILE_MAP = {
    "FILE-001": "__IDENTITY &amp; BACKGROUND (YOU)__  _- __Age___ 3.md",
    "FILE-002": "Support and Therapeutic Profile for Complex Housing, Trauma, Recovery, Identity, and Career Stressors in NYC.md",
    "FILE-003": "Queer Artists' NYC Support Resources.md",
    "FILE-004": "Action Plan From This Thread.md",
    "FILE-005": "Fastest Way To Get NYC ID + Health Coverage Right.md",
    "FILE-006": "Immediate Free _ Low-Cost Housing & Benefits Optio.md",
    "FILE-007": "NYC benefits and immediate actions for gay educate.md",
    "FILE-008": "Navigating (Almost) Free NYC Housing Options for A.md",
    "FILE-009": "NYC Crisis Support Resource Documentation: 2025 Verified Compendium.md",
    "FILE-010": "review file, check_verify all links; expand exhaus.md",
    "FILE-011": "NYC Writer Crisis Survival Toolkit.html",
    "FILE-012": "toolkit_critical_analysis.json",
    "FILE-013": "crisis-toolkit-v2-implementation-plan.md",
    "FILE-014": "Surviving-collapse.md",
    "FILE-015": "Relaxation-Day-Planning.md",
    "FILE-016": "Comprehensive Review, Synthesis, and Funding-Search Blueprint.md",
    "FILE-017": "Comprehensive Funding Review and Grant-Finding Blueprint Based on Your Attached Materials.md",
    "FILE-018": "resume-me-Era-of-the-Orchestrator.md",
    "FILE-019": "resume-me-Branch-\u00b7-Phone-Call-Boundary-Response.md",  # Unicode middle dot
    "FILE-020": "a-testament-of-the-will",
    "FILE-021": "multimediaspecialist.pdf",  # PDF — not in text export
    "FILE-022": "ORGAN_i-vii_&_sub-ORGANS",
    "FILE-023": "ORGAN_SYSTEM_AUDIT.md",
    "FILE-024": "registry.json",
    "FILE-025": "registry-v2.json",
    "FILE-026": "orchestration-system.md",
    "FILE-027": "orchestration-system-v2.md",
    "FILE-028": "github-actions-spec.md",
    "FILE-029": "public-process-map.md",
    "FILE-030": "public-process-map-v2.md",
    "FILE-031": "PARALLEL-LAUNCH-STRATEGY.md",
    "FILE-032": "IMPLEMENTATION-PACKAGE.md",
    "FILE-033": "IMPLEMENTATION-PACKAGE-v2.md",
    "FILE-034": "00-MASTER-SUMMARY.md",
    "FILE-035": "01-README-AUDIT-FRAMEWORK.md",
    "FILE-036": "02-REPO-INVENTORY-AUDIT.md",
    "FILE-037": "03-PER-ORGAN-README-TEMPLATES.md",
    "FILE-038": "04-PER-ORGAN-VALIDATION-CHECKLISTS.md",
    "FILE-039": "05-RISK-MAP-AND-SEQUENCING.md",
    "FILE-040": "PHASE-1-EXECUTION-INDEX.md",
    "FILE-041": "reconstitution-phase-model.md",
    "FILE-042": "internal-language-protocol-card.md",
    "FILE-043": "role-repo-mapping-matrix.md",
    "FILE-044": "manifest-entry-relaxation-day-planning.md",
    "FILE-045": "Technical_Portfolio.docx",
    "FILE-046": "Research_Statement.docx",
    "FILE-047": "Case_Study_Deck.docx",
    "FILE-048": "repos.json",
    "FILE-049": "repos.md",
    "FILE-050": "COMPLETE_INGESTION_SYNTHESIS.md",
    "FILE-051": "PROJECT_MANIFEST.md",
    "FILE-052": "PROJECT_MANIFEST_v3.md",
    "FILE-053": "PROJECT_MANIFEST_v4.md",
    "FILE-054": "AI-HANDOFF-PROMPT_surviving-collapse-synthesis.md",
    "FILE-055": "AI-HANDOFF-PROMPT_precarity-resource-synthesis.md",
    "FILE-056": "AI-HANDOFF-PROMPT_boundary-covenant-portfolio-gaps.md",
    "FILE-057": "AI-HANDOFF-PROMPT_nyc-crisis-toolkit-gaps-and-recommendations.md",
    "FILE-058": "February 2026 Job Market Intelligence: Three Career Lanes for Creative Technologists.md",
    "FILE-059": "NYC Benefits Cliff Mechanics and Optimal Grant-Stacking for Precarious Artists.md",
    "FILE-060": "Six Priorities for Building Professional Autonomy from Crisis: A 12-Month Transition Plan.md",
}

# v5 manifest itself (FILE-061 equivalent, doc index 60 in export)
MANIFEST_V5_FILENAME = "PROJECT_MANIFEST_v5.md"

# ---------------------------------------------------------------------------
# Category → FILE-XXX ranges
# ---------------------------------------------------------------------------
CATEGORY_MAP = {
    "A_identity-context":            ["FILE-001", "FILE-002"],
    "B_crisis-resources":            [f"FILE-{i:03d}" for i in range(3, 11)],
    "C_crisis-toolkit":              ["FILE-011", "FILE-012", "FILE-013"],
    "D_strategic-planning":          ["FILE-014", "FILE-015"],
    "E_funding-strategy":            ["FILE-016", "FILE-017"],
    "F_professional-positioning":    ["FILE-018", "FILE-019", "FILE-020", "FILE-021"],
    "G_organizational-architecture": ["FILE-022", "FILE-023"],
    "H_orchestration-system":        [f"FILE-{i:03d}" for i in range(24, 34)],
    "I_audit-framework":             [f"FILE-{i:03d}" for i in range(34, 41)],
    "J_reconstitution-framework":    ["FILE-041", "FILE-042", "FILE-043", "FILE-044"],
    "K_professional-portfolio":      ["FILE-045", "FILE-046", "FILE-047"],
    "L_technical-inventories":       ["FILE-048", "FILE-049"],
    "M_conversation-syntheses":      ["FILE-050"],
    "N_meta-documentation":          ["FILE-051", "FILE-052", "FILE-053"],
    "O_ai-handoff-prompts":          ["FILE-054", "FILE-055", "FILE-056", "FILE-057"],
    "P_research-reports":            ["FILE-058", "FILE-059"],
    "Q_strategic-transition":        ["FILE-060"],
}

# Reverse map: FILE-XXX → category directory
FILE_TO_CATEGORY = {}
for cat, files in CATEGORY_MAP.items():
    for fid in files:
        FILE_TO_CATEGORY[fid] = cat

# ---------------------------------------------------------------------------
# Thread mapping: THREAD-2026-XXX → conversation UUID
# ---------------------------------------------------------------------------
THREAD_MAP = {
    "THREAD-2026-001": "f8cb2cdd-7b64-4e05-849a-a1a049d6f9fd",
    "THREAD-2026-002": "6f40adff-0917-40ef-a2d3-4cf944d22fca",
    "THREAD-2026-003": "baf5f639-d9f6-4f4e-b249-61dd1f4f2ae9",
    "THREAD-2026-004": "253acb45-b882-4838-b1b2-d2f0c055b7ec",
    "THREAD-2026-005": "cdcc6cac-613c-4e9e-81d5-21e92e3dc10a",
    "THREAD-2026-006": "fa0c431c-062a-4737-bac3-35b068a222b7",
    "THREAD-2026-007": "7a8f62ae-eea7-47a5-9395-f94080cff141",
    "THREAD-2026-008": "c74155fd-e268-467e-a7d9-335be1abbdf1",
    "THREAD-2026-009": "216f7c7e-a8e1-41ba-9e05-a0ea80dbcdc7",
    "THREAD-2026-010": "cbc14428-9859-4c43-9815-ab020247fe4b",
    "THREAD-2026-011": "52bcbcba-713f-4339-9807-e448f19d1792",
    "THREAD-2026-012": "15b1319b-4be3-4a35-92de-96fb621e75e9",
    "THREAD-2026-013": "9b53b6fc-5a4d-42ea-9aad-3d1e2e7bfa63",
    "THREAD-2026-014": "49b1d214-5546-4e79-9b70-4e960f7a030b",
    "THREAD-2026-015": "4c85fa1b-79e9-4605-b0c3-0e13e306f9e1",
    "THREAD-2026-016": "ad8d7bf2-081e-4b29-aa61-c261fba42939",
    # THREAD-2026-017 is the current/active session — not in export
}

# ---------------------------------------------------------------------------
# Funding conversations from other projects (curated)
# ---------------------------------------------------------------------------
FUNDING_CONVERSATION_UUIDS = {
    "40a537a0-4cc6-4f42-b926-ae42f2a3db94": "grant-application-strategy-and-targeting",
    "23a17108-ad68-450f-91a4-f147fa00fe14": "engineering-phd-and-funding-independence",
    "025bac76-b22e-4720-ad86-c558523c1b1c": "building-scalable-system-minimal-resources",
    "40be4b29-075f-4828-9711-5e9628dea7f2": "grant-application-github-access",
    "592d77c5-8f5f-408e-8ea6-3b3a0b819355": "strategic-planning-logical-analysis",
}

# ---------------------------------------------------------------------------
# Funding docs from omni-dromenon-machina project
# ---------------------------------------------------------------------------
FUNDING_DOC_NAMES_ODM = [
    "Grant Funding Landscape for AI-Augmented Interactive Performance: Strategic Analysis and Timeline.md",
    "Grant Application Strategy: Clarifying Questions, Answers, & Synthesis",
    "03_Grant_Narrative.docx",
    "Prospecting-letters-for-diverse-artists-and-new-works.md",
]

# Known duplicate in export (FILE-009 appears twice — indices 21 and 47)
KNOWN_DUPLICATE_FILENAMES = {
    "NYC Crisis Support Resource Documentation: 2025 Verified Compendium.md",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slugify(text: str, max_len: int = 60) -> str:
    """Convert a filename/title to a filesystem-safe slug."""
    # Normalize unicode middle dot and similar
    text = text.replace("\u00b7", "-")
    # Remove file extensions for slug
    for ext in (".md", ".html", ".json", ".docx", ".pdf", ".txt"):
        if text.lower().endswith(ext):
            text = text[: -len(ext)]
    # Replace non-alphanumeric chars with hyphens
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text)
    # Collapse multiple hyphens, strip leading/trailing
    text = re.sub(r"-+", "-", text).strip("-")
    # Truncate
    if len(text) > max_len:
        text = text[:max_len].rstrip("-")
    return text.lower()


def sha256_of(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def detect_extension(filename: str) -> str:
    """Return the appropriate output extension."""
    lower = filename.lower()
    if lower.endswith(".html"):
        return ".html"
    if lower.endswith(".json"):
        return ".json"
    # DOCX exported as text → save as .md
    if lower.endswith(".docx"):
        return ".md"
    if lower.endswith(".pdf"):
        return ".pdf"
    # Default to .md
    return ".md"


def make_frontmatter(file_id: str, filename: str, category: str, char_count: int, sha: str) -> str:
    """Generate YAML-style frontmatter for an extracted doc."""
    original_format = "PDF" if filename.lower().endswith(".pdf") else \
                      "DOCX (exported as text)" if filename.lower().endswith(".docx") else \
                      "HTML" if filename.lower().endswith(".html") else \
                      "JSON" if filename.lower().endswith(".json") else "Markdown"
    lines = [
        "---",
        f"file_id: {file_id}",
        f"source_filename: \"{filename}\"",
        f"category: {category}",
        f"original_format: {original_format}",
        f"char_count: {char_count}",
        f"sha256: {sha}",
        f"extracted: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}",
        "---",
        "",
    ]
    return "\n".join(lines)


def format_conversation(convo: dict) -> str:
    """Format a conversation as markdown with frontmatter."""
    name = convo.get("name", "Untitled")
    uuid = convo.get("uuid", "")
    created = convo.get("created_at", "")
    updated = convo.get("updated_at", "")
    summary = convo.get("summary", "") or ""
    messages = convo.get("chat_messages", [])

    lines = [
        "---",
        f"conversation_uuid: {uuid}",
        f"title: \"{name}\"",
        f"created_at: {created}",
        f"updated_at: {updated}",
        f"message_count: {len(messages)}",
        f"extracted: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}",
        "---",
        "",
        f"# {name}",
        "",
    ]

    if summary:
        lines.extend([
            "## Summary",
            "",
            summary.strip(),
            "",
        ])

    lines.extend([
        "## Transcript",
        "",
    ])

    for msg in messages:
        sender = msg.get("sender", "unknown")
        timestamp = msg.get("created_at", "")
        label = "Human" if sender == "human" else "Assistant" if sender == "assistant" else sender.title()

        lines.append(f"### {label}")
        if timestamp:
            lines.append(f"*{timestamp}*")
        lines.append("")

        # Extract text content blocks only (skip thinking, tool_use, tool_result, token_budget)
        content_blocks = msg.get("content", [])
        for block in content_blocks:
            block_type = block.get("type", "")
            if block_type == "text":
                text = block.get("text", "")
                if text.strip():
                    lines.append(text.strip())
                    lines.append("")

        # Fallback to top-level text field if no content blocks had text
        if not any(b.get("type") == "text" for b in content_blocks):
            text = msg.get("text", "")
            if text.strip():
                lines.append(text.strip())
                lines.append("")

        lines.append("---")
        lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Stats collector
# ---------------------------------------------------------------------------
class Stats:
    def __init__(self):
        self.files_written = 0
        self.total_chars = 0
        self.file_results: dict[str, dict] = {}  # FILE-XXX → {path, chars, sha, status}
        self.thread_results: dict[str, dict] = {}  # THREAD-XXX → {path, msgs, status}
        self.funding_docs: list[dict] = []
        self.funding_convos: list[dict] = []
        self.errors: list[str] = []

    def record_file(self, path: Path, content: str):
        self.files_written += 1
        self.total_chars += len(content)

    def write(self, path: Path, content: str):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        self.record_file(path, content)


stats = Stats()


# ---------------------------------------------------------------------------
# Step 1: Extract project documents
# ---------------------------------------------------------------------------
def extract_project_docs():
    """Parse projects.json, extract emergency-help docs + ODM funding docs."""
    print("Loading projects.json...")
    with open(PROJECTS_JSON, encoding="utf-8") as f:
        projects = json.load(f)

    # Find emergency-help project
    eh_project = None
    odm_project = None
    for p in projects:
        if p["uuid"] == EH_PROJECT_UUID:
            eh_project = p
        if p.get("name", "") == "omni-dromenon-machina":
            odm_project = p

    if not eh_project:
        stats.errors.append("FATAL: emergency-help project not found in projects.json")
        return

    docs = eh_project["docs"]
    print(f"  Found {len(docs)} docs in emergency-help project")

    # Build filename→doc lookup (handle duplicates by taking first occurrence)
    doc_lookup: dict[str, dict] = {}
    duplicates_seen: set[str] = set()
    for doc in docs:
        fn = doc["filename"]
        if fn in doc_lookup:
            if fn in KNOWN_DUPLICATE_FILENAMES:
                duplicates_seen.add(fn)
            continue
        doc_lookup[fn] = doc

    # Extract each FILE-XXX
    for file_id, source_filename in FILE_MAP.items():
        category = FILE_TO_CATEGORY.get(file_id, "uncategorized")

        # Special case: PDF not in text export
        if file_id == "FILE-021":
            slug = slugify(source_filename)
            out_path = OUTPUT_DIR / category / f"{file_id}_{slug}.md"
            content = (
                f"---\n"
                f"file_id: {file_id}\n"
                f"source_filename: \"{source_filename}\"\n"
                f"category: {category}\n"
                f"original_format: PDF\n"
                f"note: PDF not included in text export\n"
                f"---\n\n"
                f"# {source_filename}\n\n"
                f"**This file is a PDF and was not included in the Claude.ai text export.**\n\n"
                f"The original PDF is available at:\n"
                f"`/Users/4jp/Workspace/portfolio/intake/multimedia-specialist.pdf`\n\n"
                f"It was also analyzed in THREAD-2026-011 and THREAD-2026-014.\n"
            )
            stats.write(out_path, content)
            stats.file_results[file_id] = {
                "path": str(out_path),
                "chars": len(content),
                "sha": sha256_of(content),
                "status": "placeholder (PDF)",
            }
            continue

        doc = doc_lookup.get(source_filename)
        if not doc:
            stats.file_results[file_id] = {
                "path": "",
                "chars": 0,
                "sha": "",
                "status": f"MISSING: '{source_filename}' not found in export",
            }
            stats.errors.append(f"{file_id}: source file not found: {source_filename}")
            continue

        doc_content = doc.get("content", "")
        ext = detect_extension(source_filename)
        slug = slugify(source_filename)
        out_filename = f"{file_id}_{slug}{ext}"
        out_path = OUTPUT_DIR / category / out_filename

        sha = sha256_of(doc_content)

        # Add frontmatter for markdown/text files; skip for json/html
        if ext in (".json", ".html"):
            full_content = doc_content
        else:
            frontmatter = make_frontmatter(file_id, source_filename, category, len(doc_content), sha)
            full_content = frontmatter + doc_content

        stats.write(out_path, full_content)
        stats.file_results[file_id] = {
            "path": str(out_path),
            "chars": len(doc_content),
            "sha": sha,
            "status": "ok",
        }

    # Also place v5 manifest in N_meta-documentation
    manifest_doc = doc_lookup.get(MANIFEST_V5_FILENAME)
    if manifest_doc:
        content = manifest_doc["content"]
        sha = sha256_of(content)
        frontmatter = make_frontmatter("MANIFEST-V5", MANIFEST_V5_FILENAME, "N_meta-documentation", len(content), sha)
        out_path = OUTPUT_DIR / "N_meta-documentation" / "MANIFEST-V5_project-manifest-v5.md"
        stats.write(out_path, frontmatter + content)

    # Handle duplicates note
    if duplicates_seen:
        print(f"  Deduplicated: {duplicates_seen}")

    # Extract funding docs from omni-dromenon-machina
    if odm_project:
        odm_docs = odm_project["docs"]
        odm_lookup: dict[str, dict] = {}
        for doc in odm_docs:
            fn = doc["filename"]
            if fn not in odm_lookup:
                odm_lookup[fn] = doc

        for doc_name in FUNDING_DOC_NAMES_ODM:
            doc = odm_lookup.get(doc_name)
            if not doc:
                stats.errors.append(f"ODM funding doc not found: {doc_name}")
                continue

            doc_content = doc.get("content", "")
            ext = detect_extension(doc_name)
            slug = slugify(doc_name)
            out_path = OUTPUT_DIR / "funding" / "from-other-projects" / f"ODM_{slug}{ext}"

            sha = sha256_of(doc_content)
            if ext in (".json", ".html"):
                full_content = doc_content
            else:
                frontmatter = (
                    f"---\n"
                    f"source_project: omni-dromenon-machina\n"
                    f"source_filename: \"{doc_name}\"\n"
                    f"char_count: {len(doc_content)}\n"
                    f"sha256: {sha}\n"
                    f"extracted: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}\n"
                    f"---\n\n"
                )
                full_content = frontmatter + doc_content

            stats.write(out_path, full_content)
            stats.funding_docs.append({
                "name": doc_name,
                "path": str(out_path),
                "chars": len(doc_content),
                "sha": sha,
            })
    else:
        stats.errors.append("omni-dromenon-machina project not found in projects.json")

    # Release projects data
    del projects
    print(f"  Extracted {sum(1 for r in stats.file_results.values() if r['status'] in ('ok', 'placeholder (PDF)'))} / {len(FILE_MAP)} files")


# ---------------------------------------------------------------------------
# Step 2: Extract memories
# ---------------------------------------------------------------------------
def extract_memories():
    """Parse memories.json, write project and conversations memories."""
    print("Loading memories.json...")
    with open(MEMORIES_JSON, encoding="utf-8") as f:
        memories = json.load(f)

    if not memories:
        stats.errors.append("memories.json is empty")
        return

    mem = memories[0]
    mem_dir = OUTPUT_DIR / "memories"

    # Conversations memory
    conv_mem = mem.get("conversations_memory", "")
    if conv_mem:
        out_path = mem_dir / "conversations-memory.md"
        content = (
            f"---\n"
            f"type: conversations_memory\n"
            f"char_count: {len(conv_mem)}\n"
            f"extracted: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}\n"
            f"---\n\n"
            f"# Conversations Memory\n\n"
            f"{conv_mem}\n"
        )
        stats.write(out_path, content)

    # Project memories — dict keyed by project UUID → memory string
    project_memories = mem.get("project_memories", {})
    eh_memory_text = project_memories.get(EH_PROJECT_UUID, "") if isinstance(project_memories, dict) else ""

    if eh_memory_text:
        content = (
            f"---\n"
            f"type: project_memory\n"
            f"project_uuid: {EH_PROJECT_UUID}\n"
            f"char_count: {len(eh_memory_text)}\n"
            f"extracted: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}\n"
            f"---\n\n"
            f"# Emergency-Help Project Memory\n\n"
            f"{eh_memory_text}\n"
        )
        out_path = mem_dir / "emergency-help-project-memory.md"
        stats.write(out_path, content)
    else:
        out_path = mem_dir / "emergency-help-project-memory.md"
        content = (
            f"---\n"
            f"type: project_memory\n"
            f"project_uuid: {EH_PROJECT_UUID}\n"
            f"note: No project-specific memories found in export\n"
            f"---\n\n"
            f"# Emergency-Help Project Memory\n\n"
            f"No project-specific memories were found in the export for this project.\n"
            f"This may mean memories are stored at the account level rather than per-project.\n"
        )
        stats.write(out_path, content)

    del memories
    print("  Memories extracted")


# ---------------------------------------------------------------------------
# Step 3: Extract conversations
# ---------------------------------------------------------------------------
def extract_conversations():
    """Parse conversations.json, extract manifest threads + funding convos."""
    print("Loading conversations.json (84MB — this may take a moment)...")
    with open(CONVERSATIONS_JSON, encoding="utf-8") as f:
        all_convos = json.load(f)

    print(f"  Loaded {len(all_convos)} conversations, filtering...")

    # Build UUID sets for filtering
    thread_uuids = set(THREAD_MAP.values())
    funding_uuids = set(FUNDING_CONVERSATION_UUIDS.keys())
    needed_uuids = thread_uuids | funding_uuids

    # Filter to only needed conversations
    convo_lookup: dict[str, dict] = {}
    for c in all_convos:
        if c["uuid"] in needed_uuids:
            convo_lookup[c["uuid"]] = c

    # Release full dataset
    del all_convos
    print(f"  Filtered to {len(convo_lookup)} conversations")

    # Extract manifest threads
    threads_dir = OUTPUT_DIR / "threads"
    for thread_id, convo_uuid in THREAD_MAP.items():
        convo = convo_lookup.get(convo_uuid)
        if not convo:
            stats.thread_results[thread_id] = {
                "path": "",
                "messages": 0,
                "status": f"MISSING: UUID {convo_uuid} not found",
            }
            stats.errors.append(f"{thread_id}: conversation UUID not found: {convo_uuid}")
            continue

        content = format_conversation(convo)
        name_slug = slugify(convo.get("name", "untitled"))
        out_path = threads_dir / f"{thread_id}_{name_slug}.md"
        stats.write(out_path, content)
        stats.thread_results[thread_id] = {
            "path": str(out_path),
            "messages": len(convo.get("chat_messages", [])),
            "status": "ok",
        }

    # Extract funding conversations
    funding_dir = OUTPUT_DIR / "funding" / "from-other-conversations"
    for convo_uuid, slug in FUNDING_CONVERSATION_UUIDS.items():
        convo = convo_lookup.get(convo_uuid)
        if not convo:
            stats.errors.append(f"Funding convo not found: {convo_uuid}")
            continue

        content = format_conversation(convo)
        out_path = funding_dir / f"FUNDING_{slug}.md"
        stats.write(out_path, content)
        stats.funding_convos.append({
            "uuid": convo_uuid,
            "name": convo.get("name", ""),
            "path": str(out_path),
            "messages": len(convo.get("chat_messages", [])),
        })

    del convo_lookup
    ok_threads = sum(1 for r in stats.thread_results.values() if r["status"] == "ok")
    print(f"  Extracted {ok_threads}/{len(THREAD_MAP)} threads + {len(stats.funding_convos)} funding conversations")


# ---------------------------------------------------------------------------
# Step 4: Verification report
# ---------------------------------------------------------------------------
def build_verification_report():
    """Cross-check all FILE and THREAD extractions, produce report."""
    print("Building verification report...")

    lines = [
        "# Verification Report",
        "",
        f"**Generated:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"**Source:** Claude.ai account export (2026-02-16)",
        "",
        "---",
        "",
        "## File Verification (FILE-001 through FILE-060)",
        "",
        "| File ID | Status | Chars | SHA-256 (first 12) |",
        "|---------|--------|-------|---------------------|",
    ]

    files_ok = 0
    files_placeholder = 0
    files_missing = 0

    for i in range(1, 61):
        fid = f"FILE-{i:03d}"
        result = stats.file_results.get(fid, {"status": "NOT PROCESSED", "chars": 0, "sha": ""})
        status = result["status"]
        chars = result["chars"]
        sha_short = result["sha"][:12] if result["sha"] else "—"

        if status == "ok":
            files_ok += 1
            status_display = "OK"
        elif "placeholder" in status:
            files_placeholder += 1
            status_display = "PDF placeholder"
        else:
            files_missing += 1
            status_display = f"MISSING"

        lines.append(f"| {fid} | {status_display} | {chars:,} | `{sha_short}` |")

    lines.extend([
        "",
        f"**Summary:** {files_ok} extracted + {files_placeholder} PDF placeholder + {files_missing} missing = {files_ok + files_placeholder + files_missing}/60",
        "",
        "---",
        "",
        "## Thread Verification (THREAD-2026-001 through THREAD-2026-017)",
        "",
        "| Thread ID | Status | Messages | Path |",
        "|-----------|--------|----------|------|",
    ])

    threads_ok = 0
    for i in range(1, 18):
        tid = f"THREAD-2026-{i:03d}"
        if tid == "THREAD-2026-017":
            lines.append(f"| {tid} | Current session (expected absence) | — | — |")
            continue

        result = stats.thread_results.get(tid, {"status": "NOT PROCESSED", "messages": 0, "path": ""})
        status = result["status"]
        msgs = result["messages"]
        path = Path(result["path"]).name if result["path"] else "—"

        if status == "ok":
            threads_ok += 1
            status_display = "OK"
        else:
            status_display = "MISSING"

        lines.append(f"| {tid} | {status_display} | {msgs} | {path} |")

    lines.extend([
        "",
        f"**Summary:** {threads_ok}/16 threads extracted + 1 current session (expected) = {threads_ok + 1}/17",
        "",
        "---",
        "",
        "## Funding Extras",
        "",
        "### From omni-dromenon-machina (Project Docs)",
        "",
    ])

    for fd in stats.funding_docs:
        lines.append(f"- **{fd['name']}** — {fd['chars']:,} chars — `{fd['sha'][:12]}`")

    lines.extend([
        "",
        f"**Total ODM funding docs:** {len(stats.funding_docs)}/4",
        "",
        "### From Other Conversations",
        "",
    ])

    for fc in stats.funding_convos:
        lines.append(f"- **{fc['name']}** ({fc['uuid'][:8]}...) — {fc['messages']} messages")

    lines.extend([
        "",
        f"**Total funding conversations:** {len(stats.funding_convos)}/{len(FUNDING_CONVERSATION_UUIDS)}",
        "",
        "---",
        "",
        "## Summary Statistics",
        "",
        f"- **Total files written:** {stats.files_written}",
        f"- **Total characters written:** {stats.total_chars:,}",
        f"- **Errors:** {len(stats.errors)}",
        "",
    ])

    if stats.errors:
        lines.extend([
            "### Errors",
            "",
        ])
        for err in stats.errors:
            lines.append(f"- {err}")
        lines.append("")

    lines.extend([
        "---",
        "",
        "## Known Edge Cases",
        "",
        "| Case | Resolution |",
        "|------|-----------|",
        "| FILE-021 (PDF) | Placeholder pointing to `intake/multimedia-specialist.pdf` |",
        f"| FILE-009 duplicate in export | Deduplicated (first occurrence used) |",
        "| FILE-019 Unicode middle dot (U+00B7) | Normalized to hyphen in output filename |",
        "| THREAD-2026-017 (current session) | Marked as expected absence |",
        "| DOCX files exported as text | Saved as `.md` with format noted in frontmatter |",
        "",
    ])

    report = "\n".join(lines)
    out_path = OUTPUT_DIR / "VERIFICATION_REPORT.md"
    stats.write(out_path, report)
    print(f"  Verification report written ({files_ok + files_placeholder}/60 files, {threads_ok}/16 threads)")


# ---------------------------------------------------------------------------
# Step 5: Generate INDEX.md
# ---------------------------------------------------------------------------
def generate_index():
    """Create INDEX.md with links to all extracted files by category."""
    print("Generating INDEX.md...")

    lines = [
        "# Emergency-Help Project — File Index",
        "",
        f"**Generated:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"**Total files:** {len(FILE_MAP)} project docs + manifest + funding extras",
        "",
        "---",
        "",
    ]

    for category, file_ids in CATEGORY_MAP.items():
        cat_label = category.split("_", 1)[1].replace("-", " ").title()
        cat_prefix = category.split("_", 1)[0]
        lines.extend([
            f"## {cat_prefix}: {cat_label}",
            "",
        ])

        for fid in file_ids:
            result = stats.file_results.get(fid, {})
            path = result.get("path", "")
            status = result.get("status", "unknown")
            source = FILE_MAP.get(fid, "")

            if path:
                rel_path = Path(path).relative_to(OUTPUT_DIR)
                lines.append(f"- [{fid}]({rel_path}) — {source}")
            else:
                lines.append(f"- {fid} — {source} (**{status}**)")

        lines.append("")

    # Manifest
    lines.extend([
        "## Meta: Project Manifest v5",
        "",
        f"- [MANIFEST-V5](N_meta-documentation/MANIFEST-V5_project-manifest-v5.md)",
        "",
    ])

    # Threads
    lines.extend([
        "## Conversation Threads",
        "",
    ])
    for tid in sorted(stats.thread_results.keys()):
        result = stats.thread_results[tid]
        if result["path"]:
            rel_path = Path(result["path"]).relative_to(OUTPUT_DIR)
            lines.append(f"- [{tid}]({rel_path}) — {result['messages']} messages")
        else:
            lines.append(f"- {tid} — **{result['status']}**")
    lines.append("- THREAD-2026-017 — Current session (not in export)")
    lines.append("")

    # Funding extras
    lines.extend([
        "## Funding Materials (Cross-Project)",
        "",
        "### From omni-dromenon-machina",
        "",
    ])
    for fd in stats.funding_docs:
        rel_path = Path(fd["path"]).relative_to(OUTPUT_DIR)
        lines.append(f"- [{Path(fd['path']).name}]({rel_path})")
    lines.append("")

    lines.extend([
        "### From Other Conversations",
        "",
    ])
    for fc in stats.funding_convos:
        rel_path = Path(fc["path"]).relative_to(OUTPUT_DIR)
        lines.append(f"- [{fc['name']}]({rel_path})")
    lines.append("")

    index = "\n".join(lines)
    out_path = OUTPUT_DIR / "INDEX.md"
    stats.write(out_path, index)
    print("  INDEX.md generated")


# ---------------------------------------------------------------------------
# Step 6: Generate Funding Action Sequence
# ---------------------------------------------------------------------------
def generate_funding_action_sequence():
    """Pre-populate FUNDING_ACTION_SEQUENCE.md from extracted funding docs."""
    print("Generating Funding Action Sequence...")

    # Read key funding documents to synthesize
    funding_file_ids = ["FILE-016", "FILE-017", "FILE-050", "FILE-058", "FILE-059", "FILE-060"]
    source_summaries = []

    for fid in funding_file_ids:
        result = stats.file_results.get(fid, {})
        path = result.get("path", "")
        if path and Path(path).exists():
            content = Path(path).read_text(encoding="utf-8")
            # Extract first ~500 chars after frontmatter as summary
            parts = content.split("---", 2)
            body = parts[2] if len(parts) > 2 else content
            preview = body.strip()[:500]
            source_summaries.append(f"**{fid}** ({FILE_MAP.get(fid, '')}): {preview}...")

    content = f"""\
# Funding Action Sequence

**Generated:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}
**Status:** Pre-populated structure — requires follow-up session to fill specific deadlines, amounts, and eligibility details from extracted documents.

---

## 1. Benefits Cliff Context

Key constraints from FILE-059 (NYC Benefits Cliff Mechanics):

- **Safe grant-stacking range:** $5K–$9K/year in one-time grants without losing SNAP, Medicaid, or housing assistance
- **Medicaid binding constraint:** $21,597/year (138% FPL) for full Medicaid; Essential Plan at $0 premium covers up to $39,125/year
- **SNAP work requirements:** Effective March 2026 — may affect eligibility
- **NY lump-sum treatment:** SNAP excludes grants from income; Section 8/NYCHA excludes one-time non-recurring payments
- **Disabled artist pathway:** Medicaid Buy-In raises ceiling to $79,284/year
- **PASS plans and ABLE accounts** can shelter grant income from SSI means-testing

---

## 2. Priority 1: URGENT (Within 30 Days)

From FILE-060 (Six Priorities) — urgent deadlines identified:

| Opportunity | Type | Amount | Deadline | Status | Notes |
|------------|------|--------|----------|--------|-------|
| Eyebeam Residency | Residency | TBD | Check deadline | [ ] Not started | AI/creative technology focus |
| Rhizome "Counterstructural Commons" | Grant/Commission | TBD | Check deadline | [ ] Not started | Infrastructure/systems art |
| Rauschenberg Medical Emergency Grants | Emergency grant | Up to $5K | Rolling | [ ] Not started | For medical emergencies |

---

## 3. Priority 2: Near-Term (1–3 Months)

| Opportunity | Type | Amount | Deadline | Status | Notes |
|------------|------|--------|----------|--------|-------|
| Creative Capital 2027 | Grant | $50K+ | TBD | [ ] Not started | Multi-year artist project support |
| Knight Foundation | Grant | Varies | TBD | [ ] Not started | Values infrastructure capacity |
| Mellon Foundation | Grant | Varies | TBD | [ ] Not started | Values governance transparency |

---

## 4. Priority 3: Rolling/Quarterly Emergency Funds

| Fund | Amount | Frequency | Eligibility | Status |
|------|--------|-----------|-------------|--------|
| Foundation for Contemporary Arts | $1,500 | Monthly | Visual/performing artists | [ ] Check |
| Adolph & Esther Gottlieb Emergency Grant | $5K–$15K | Rolling | Artists 5+ years practice | [ ] Check |
| Pollock-Krasner Foundation | $1K–$30K | Rolling | Financial need + quality | [ ] Check |
| Artists' Fellowship Inc. | Varies | Annual | NYC-based artists | [ ] Check |

---

## 5. Priority 4: Career-Building (3–12 Months)

Fellowships organized by career lane (from FILE-058 market research):

### Lane A: Creative Technologist / R&D ($103K–$250K market range)
- NEW INC (New Museum) incubator
- Eyebeam residency
- Processing Foundation fellowship

### Lane B: Platform/Systems Engineering ($160K–$320K market range)
- AI orchestration consulting at $100–125/hr (corrected from FILE-060)
- Open-source fellowship programs

### Lane C: Academic/Grant (Variable)
- Fulbright Digital Humanities
- NEA grants
- University digital humanities positions

---

## 6. Identity Position Targeting

From FILE-016 & FILE-017 (Funding Blueprints) — four identity positions for grant applications:

### As Educator
- Teaching experience: 100+ courses, 2,000+ students, 8 institutions
- Target: NEA, state arts councils, university partnerships

### As Multimedia Artist
- Portfolio: 17.5M+ views, $2M raised for clients, 328% ROI
- Target: Creative Capital, Foundation for Contemporary Arts, NYSCA

### As AI Founder / Systems Architect
- 70+ repositories across 4 GitHub organizations
- AI agent orchestration market: $47–52B projected by 2030
- Target: Knight Foundation, Mozilla, Eyebeam

### As Community-Focused Practitioner
- Queer, neurodivergent, housing-displaced
- Target: Ali Forney Center partnerships, Destination Tomorrow, identity-specific grants

---

## 7. Status Tracking

| Source Doc | Opportunity | Deadline | Type | Amount | Status | Notes |
|-----------|------------|----------|------|--------|--------|-------|
| FILE-060 | Eyebeam | TBD | Residency | TBD | Not started | |
| FILE-060 | Rhizome | TBD | Commission | TBD | Not started | |
| FILE-060 | Rauschenberg | Rolling | Emergency | Up to $5K | Not started | |
| FILE-016 | Creative Capital | TBD | Grant | $50K+ | Not started | |
| FILE-016 | Knight Foundation | TBD | Grant | Varies | Not started | |
| FILE-017 | Mellon Foundation | TBD | Grant | Varies | Not started | |
| FILE-059 | Benefits review | March 2026 | Compliance | N/A | Not started | SNAP work req. |

---

## Sources Synthesized

{chr(10).join(f'- {s}' for s in source_summaries) if source_summaries else '- (source documents will be read in follow-up session)'}

---

## Next Steps

1. **Read extracted funding documents** (FILE-016, -017, -058, -059, -060) for specific deadlines and amounts
2. **Read ODM funding docs** in `funding/from-other-projects/` for additional opportunities
3. **Read funding conversations** in `funding/from-other-conversations/` for context
4. **Fill in TBD fields** with verified current deadlines
5. **Prioritize by** safe grant-stacking threshold ($5K–$9K) and benefits cliff constraints
"""

    out_path = OUTPUT_DIR / "funding" / "FUNDING_ACTION_SEQUENCE.md"
    stats.write(out_path, content)
    print("  Funding Action Sequence generated")


# ---------------------------------------------------------------------------
# Step 7: Generate README.md
# ---------------------------------------------------------------------------
def generate_readme():
    """Create the directory README.md."""
    print("Generating README.md...")

    content = f"""\
# Emergency-Help Project — Extracted Archive

**Source:** Claude.ai account export (2026-02-16)
**Project:** NYC Crisis Survival Resources & Professional Reconstitution Documentation
**Manifest Version:** 5.0 (February 15, 2026)
**Extraction Date:** {datetime.now(timezone.utc).strftime('%Y-%m-%d')}

---

## Overview

This directory contains the complete extracted content from the `emergency-help` Claude.ai project,
organized according to the v5 Project Manifest's 17-category taxonomy. Additionally, funding-related
materials from the `omni-dromenon-machina` project and other conversations have been cross-referenced
and extracted.

## Directory Structure

```
emergency-help/
├── README.md                      # This file
├── INDEX.md                       # Cross-reference index with links
├── VERIFICATION_REPORT.md         # Extraction coverage report
│
├── A_identity-context/            # FILE-001, FILE-002
├── B_crisis-resources/            # FILE-003 through FILE-010
├── C_crisis-toolkit/              # FILE-011 through FILE-013
├── D_strategic-planning/          # FILE-014, FILE-015
├── E_funding-strategy/            # FILE-016, FILE-017
├── F_professional-positioning/    # FILE-018 through FILE-021
├── G_organizational-architecture/ # FILE-022, FILE-023
├── H_orchestration-system/        # FILE-024 through FILE-033
├── I_audit-framework/             # FILE-034 through FILE-040
├── J_reconstitution-framework/    # FILE-041 through FILE-044
├── K_professional-portfolio/      # FILE-045 through FILE-047
├── L_technical-inventories/       # FILE-048, FILE-049
├── M_conversation-syntheses/      # FILE-050
├── N_meta-documentation/          # FILE-051 through FILE-053 + v5 manifest
├── O_ai-handoff-prompts/          # FILE-054 through FILE-057
├── P_research-reports/            # FILE-058, FILE-059
├── Q_strategic-transition/        # FILE-060
│
├── threads/                       # 16 conversation transcripts
├── funding/
│   ├── from-other-projects/       # Funding docs from omni-dromenon-machina
│   ├── from-other-conversations/  # Funding conversations from other projects
│   └── FUNDING_ACTION_SEQUENCE.md # Prioritized funding checklist
│
└── memories/                      # Account & project memory exports
```

## File Naming Convention

`FILE-XXX_short-slug.ext` — preserves manifest IDs for cross-referencing while being human-readable.

## Re-running Extraction

```bash
cd /Users/4jp/Workspace/portfolio
.venv/bin/python scripts/extract_emergency_help.py
```

The script is idempotent — it overwrites existing output on re-run.

## Key Documents

- **[FUNDING_ACTION_SEQUENCE.md](funding/FUNDING_ACTION_SEQUENCE.md)** — Prioritized funding/grants checklist
- **[INDEX.md](INDEX.md)** — Complete cross-reference index
- **[VERIFICATION_REPORT.md](VERIFICATION_REPORT.md)** — Extraction coverage verification
"""

    out_path = OUTPUT_DIR / "README.md"
    stats.write(out_path, content)
    print("  README.md generated")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print(f"Emergency-Help Extraction Script")
    print(f"================================")
    print(f"Output: {OUTPUT_DIR}")
    print()

    # Verify source files exist
    for path in [PROJECTS_JSON, CONVERSATIONS_JSON, MEMORIES_JSON]:
        if not path.exists():
            print(f"FATAL: Source file not found: {path}", file=sys.stderr)
            sys.exit(1)

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Run extraction steps in order
    extract_project_docs()
    extract_memories()
    extract_conversations()
    build_verification_report()
    generate_index()
    generate_funding_action_sequence()
    generate_readme()

    print()
    print(f"Done! {stats.files_written} files written, {stats.total_chars:,} total characters")
    if stats.errors:
        print(f"  {len(stats.errors)} error(s) — see VERIFICATION_REPORT.md")
    print(f"  Output: {OUTPUT_DIR}")

    return 0 if not stats.errors else 1


if __name__ == "__main__":
    sys.exit(main())
