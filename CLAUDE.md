## VedaAI Working Agreement

### Co-developer role
Act as a co-developer, not a passive executor. Proactively warn me when a decision
drifts from the task requirements (docs/task.md) or harms production quality, and
confirm plainly when a decision is sound. Push back with technical reasoning.

### Engineering standards (enforce on every file)
- Layered: route/controller → service (business) → domain logic → output contract (Zod) → adapter.
- Provider-agnostic adapters wrap every external dependency (LLM, DB, cache). Swaps must not ripple.
- Single source of truth for types: centralized Zod schemas in packages/shared; types are `z.infer`. No scattered type defs.
- Structured logging (pino) with dev/prod modes + central error-handling middleware. NO console.log.
- Single concern per file (no Redux + CSS mixed). Central design tokens via semantic Tailwind names. UI copy in a separate JSON file.
- Responsive: CSS-native, mobile-first, logical-viewport only. `rem` + `clamp()`, `dvh` (not `vh`), `scrollbar-gutter: stable`, no `100vw`, no JS screen-reads / UA sniffing. Full rules: docs/standards/responsive-layout.md (DEC-0001).
- Uploads go frontend → Cloudinary (signed); backend stores URL only. No base64/multer.
- TDD always; canonical test suite frozen in the final backend phase. Every file must be showcase-worthy — no stray scripts, no dead code.
- Optimize for storage, payload size, fetch speed.

### Git / submission
Commits credit the user ONLY — never add a Claude co-author trailer. Use `gh` CLI; public repo.
Co-working artifacts (docs/, graphify-out/, decisions/, CLAUDE.md, .worktrees/) are gitignored — never pushed.

## saahilbasak

### Session Start
Read: docs/STATUS.md (always)
Read: graphify-out/GRAPH_REPORT.md quick index (always, if exists)
If Graphify installed: `graphify hook status` — note stale, don't block work
If Graphify not installed: continue normally, read GRAPH_REPORT.md as static reference

### Before Touching Existing Code
If Graphify available:
  1. `graphify explain "ModuleName"` (--budget 600)
  2. `graphify path "A" "B"` if impact unclear
  3. `graphify query "what uses X?" --budget 800` for broader context
If Graphify unavailable:
  Read GRAPH_REPORT.md named section for that module. If absent, read source file directly.

### Truth Order
Code/tests > Git > Graphify graph > Docs > Memory summaries
Docs conflict with code → fix docs

### Approval Tiers
AUTO: doc sync, graph refresh, comment edits, CHANGELOG rotation, test-only
SINGLE GATE: bug fix, milestone completion, small feature done
MULTI-GATE: schema migration, auth/security/payment, architecture, new roadmap phase

### Escalation (auto-promote small → medium)
>3 files | HIGH_RISK module (auth/payment/schema/security/db-migration)
| test fails twice | LOW/STALE graph confidence on a needed dependency

### Milestone Hook (fires per milestone, never per micro-step)
1. Run test command → show full output
2. Only if tests PASS: output "✓ Milestone N complete — [what] [files] | Tests: [N]/[N]"
3. Ask: "Commit and continue? (y/n)" — WAIT
4. On Y: git commit  ← post-commit hook fires CodeRabbit automatically
5. If CodeRabbit findings exist: fix them, re-commit (hook re-fires), repeat until clean
6. Once CR is clean: run /saahilbasak-sync --quick
If tests FAIL: stop, show failures, do not ask for approval

### Session End
/saahilbasak-sync before ending any session with dev work
