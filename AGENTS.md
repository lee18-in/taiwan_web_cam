<!-- Playbook-Version: 19 -->
<!-- Playbook-Variant: online -->
# AGENTS.md — Supreme Directives for AI Agents

> - **Language and Encoding Standards**: All project files MUST use **UTF-8**. Reply to user in **Traditional Chinese (繁體中文)**. Write `LLM_MEMORY.md`, `COMPONENT_MAP.md`, `ARCHIVE.md`, `README.md`, code annotations, and handover logs in **telegraphic Traditional Chinese + high-frequency/single-token English terms** (NEVER drift memory/logs into pure English; `AGENTS.md` alone uses telegraphic English).

## 0. Mandatory First Step

Before acting, read **this file's dir** `LLM_MEMORY.md` and `COMPONENT_MAP.md` (resolve by file path, not CWD; NEVER use `./` to avoid parent dir). **Read-only Q&A without file edits: answer after reading 3 files; skip self-check, baseline overwrite, and log**. For file edits, §2.1 review, or work execution, follow order: **Read 3 files -> Env self-check -> Save dirty tree (§2) -> Review pending (§2.1) -> Overwrite `交接基準 commit` (§2) -> Work**; on completion, update same `LLM_MEMORY.md`〈交接日誌〉and〈目前狀態〉.
- **Env self-check**: Run `git config --get core.hooksPath`. If empty and repo root has `scripts/hooks/` (with `pre-commit`/`commit-msg`), set `git config core.hooksPath scripts/hooks` and `chmod +x scripts/hooks/*`, log in〈地雷警告〉; **if dir/script missing, leave empty (NEVER force invalid path)** and note missing hook in〈地雷警告〉(standalone new entry MUST follow〈待審下壓保護〉first). NEVER overwrite existing values (e.g., `agent-hooks`); `chmod` failure is non-fatal—do not ask user every turn.

### Three-File Division

- `AGENTS.md` (this file): Immutable constitution, identical across repos; no project diffs.
- `LLM_MEMORY.md` (decaying): Status, next steps, handover log; archived over time, NEVER store long-term tech facts.
- `COMPONENT_MAP.md` (non-decaying): MUST start with〈六十秒進入狀況〉(add if missing; if file absent in this dir, create skeleton then read). Stores structure/cross-module contracts, build/test commands & code conventions (update live), decisions/rejections, env conditions, verification ledger; **store ONLY verified facts and finalized decisions—NEVER speculations or unsettled discussions**.
- **Telegraphic Principle**: Memory files, `README.md`, and logs use telegraphic Traditional Chinese to save context/tokens—strip filler words, particles, empty verbs (進行/執行), and grammatical classifiers; write common single-token English words (code/test/config/script/path/data/file/dir/log/review/user) directly without forced translation; **NEVER omit** physical units, negative/mandatory modals, quantitative thresholds, or contract anchors. Telegraphic file/log style does NOT apply to user replies (see §5).

### Anti-Bloat Maintenance

- **〈交接日誌〉> 10 KB** (bytes): First confirm non-decaying knowledge is in `COMPONENT_MAP.md` (extract/backfill if missed, NEVER discard), then compress oldest entries into〈已封存結論〉below threshold; if〈已封存結論〉too long, move to same-dir `ARCHIVE.md` (optional read, check on demand).
- **`LLM_MEMORY.md` full file > 16 KB**: Purge resolved Section A history, move/archive expired Section B to same-dir `ARCHIVE.md` or on-demand subfiles, deduplicate `COMPONENT_MAP.md` overlaps (NEVER delete unresolved reviews or active red lines).
- **`COMPONENT_MAP.md` > 16 KB**: Route below threshold (NEVER delete core red lines/contracts to fit size):
  * **Obsolete/superseded history** (old architectures, expired ledgers) -> same-dir `ARCHIVE.md`.
  * **Active verbose details** (long tables, large specs, long verification logs) -> same-dir on-demand subfiles (e.g., `docs/`), **NEVER mix into `ARCHIVE.md`**.
  * **Main file MUST retain**:〈六十秒進入狀況〉, core contracts & red lines, subfile pointers (path + scope); NEVER delete into vagueness or fragment.
- **`ARCHIVE.md` > 16 KB**: **NEVER load full file into main context**; maintain top `## 0. 索引總表` (`日期｜#標籤｜錨點｜摘要`, no hardcoded line numbers; prepend 1 line on every move into `ARCHIVE.md` from any source, including `LLM_MEMORY.md`/`COMPONENT_MAP.md`). Read top index first then partial-read; if missing/uncertain, spawn lightweight read-only subagent for summary + line numbers, or search if no subagent.
- **Stage-independent**: Handle any threshold breach immediately in any stage.

### Handover Log Rules

- **Write Routing (Top Priority)**: Log events ONLY (`完成了什麼`/`驗證方式:`/`下一個 agent 該做什麼`/`地雷警告`); put non-decaying knowledge (decision rationale, failed approaches, verification methods, env conditions, recurring pitfalls) **immediately into `COMPONENT_MAP.md`**, keeping log "為何改" to a 1-line pointer.
- **Mandatory `驗證方式:`**: Write `未驗證` if unverified; declaring a mechanism or `.gitignore` active requires actual output (e.g., `git check-ignore -v`).
- **Max ~1200 bytes per entry**; title `### YYYY-MM-DD HH:MM [階段] <工具>`.
- **Pending-Review Push-Down (〈待審下壓保護〉)**: Before prepending (including standalone〈地雷警告〉from env self-check or dirty-tree save), if top entry has unresolved `需要審閱`, copy it into Section A〈阻塞點〉(with baseline commit range) first.
- **Ordering & Concurrency**: Use current-turn system metadata timestamp (MUST include local HH:MM, else run command; NEVER guess), newer than top entry and descending throughout; re-read `LLM_MEMORY.md` on multi-agent concurrency, remote pull, or `edit` match failure.
- Update top entry for same-session minor edits; add new entry ONLY on handover, stage switch (§1), or major progress/blocker.
- `下一個 agent 該做什麼` MUST be concrete and actionable (no boilerplate); write `無` if none.

## 1. Stage Division (Per `LLM_MEMORY.md`〈目前狀態〉; NEVER Exceed Authority)

Permissions follow stage regardless of tool/model; ONLY user may switch—agent NEVER self-switches.

- **Plan `[plan]`**: Write/revise plain-text architecture & plans in `LLM_MEMORY.md` ONLY; NEVER edit code unless marked〈已定案〉.
- **Build `[build]`**: Implement〈已定案〉plan in small steps (if build/test commands exist, verify every step; NEVER stack large unverified edits; on failure, trace root cause & codify recurring pitfalls into project tests/scripts & `COMPONENT_MAP.md`—NEVER alter `scripts/hooks/*`); NEVER rewrite plan—if blocked, log & halt that item (if design/premise is flawed, propose reverting to `[plan]`).
- **Maintain `[maintain]`**: Debug, minor fixes, watchdog & monitoring tuning; NEVER alter architecture—if needed, propose in log for user to decide on reverting to `[plan]`.

## 2. Handover Protocol (Hard Rules)

- **Overwrite `交接基準 commit` (Review First, Overwrite Second)**: With no pending review or after §2.1 review, overwrite〈目前狀態〉`交接基準 commit` with `git log -1 --format='%h %s'`; **leave untouched** during work (HEAD ahead is normal), **NEVER fill current or post-`--amend` hash**.
- If baseline hash invalidated (`rebase`/`amend`), NEVER guess—use `git log --oneline -10` to judge range and log in〈地雷警告〉.
- MUST commit before agent switch (WIP allowed, §3); start strictly from baseline commit + `LLM_MEMORY.md`, NEVER guess unlogged intent.
- Dirty working tree on takeover: commit **this dir's uncommitted changes ONLY** as `[takeover] WIP: 接手時發現未提交變更` and log in〈地雷警告〉before working; NEVER include cross-dir dirty/untracked files (§4)—log in〈地雷警告〉and `git add` file-by-file.
- **Sync Conflicts**: Auto-merge unambiguous minor conflicts semantically; **NEVER mechanically overwrite dual-modified files with `--ours`/`--theirs`** (`> 3` files or single file `> 3` conflict hunks/interleaved semantics: read both contexts before semantic merge, log method & verification):
  * **Compare/Temp**: Prefer Git index (`git show :1:/:2:/:3:<path>`); save temp copies in system temp dir (`/tmp/`, `$TEMP`) ONLY and delete right after merge—**NEVER leave in working tree**.
  * **Memory Files**: `LLM_MEMORY.md` keeps both logs sorted descending (push unresolved reviews to〈阻塞點〉), ask user on〈目前階段〉conflict, keep takeover `交接基準 commit`; `COMPONENT_MAP.md` keeps & deduplicates valid entries from both.
  * **Method/Red Lines**: Prefer `merge` (under `pre-commit`/`commit-msg` whitelist & §3); if `rebase` invalidates baseline, use fallback above; on **business either-or** or **`AGENTS.md` conflict**, halt, list diffs, and ask user; NEVER `push` without instruction.
- Without explicit user instruction: NEVER `push`, `force-push`, or alter remote branches.

### 2.1 Review Loop

- Commits modifying files outside `LLM_MEMORY.md`/`README.md`/`ARCHIVE.md` (including code/config/`COMPONENT_MAP.md`/subfiles/plans/proposals, or manual `AGENTS.md` edits; pure Branch C constitution sync of `AGENTS.md`/`CLAUDE.md`/`GEMINI.md` from latest Playbook—and updating ONLY the 3 exempt files—requires no `LLM_MEMORY.md` entry or per-repo review): add no extra tag or column—log what & why (1 line) in `完成了什麼`, and start `下一個 agent 該做什麼` with `本次改動需要審閱：<檢查點/風險>`.
- **Backlog Reminder**: If unresolved `需要審閱` (including〈阻塞點〉) `>= 2` on takeover, list upfront and ask user to sign off now or open a new session (including `/clear` context wipe) for review, **without hard-blocking current commit**; reminder NEVER waives review ("not hard-blocking" applies ONLY to commit—NEVER skip review to start work).
- If top log or〈阻塞點〉has unresolved `需要審閱`, review first on takeover: run `git diff <交接基準 commit>..HEAD -- <this dir>` (path optional at repo root) to inspect prior edits (single new session may batch-review multiple items) **before overwriting baseline** (§0/§2), checking:
  1. Fits architecture/rules without breaking existing logic.
  2. Log contains claimed test/verification records.
  - **Pass**: Log conclusion in new entry, remove from〈阻塞點〉, then resume work.
  - **Fail**: NEVER self-fix prior edits; log issues, halt, and await ruling (per §5 if human decision needed).
- **No Self-Review**: Agent writing `需要審閱` MUST NEVER self-review its just-committed edits in **same uncleared context** (nor delegate review to subagent); **halt after commit** and write `等待 new session（或 /clear 清空 context，建議換模型）審閱`—full `/clear` context wipe (NOT `/compact`) + re-reading 3 files from scratch counts as new session.
- **Dual-Track Closure**:
  * **User Sign-Off (Post-hoc)**: User states "我看過，結案" (or equivalent) -> log time & `使用者已審閱結案`, remove from〈阻塞點〉(equals new-session pass).
  * **User Exemption (Pre-hoc)**: User states "本次不需審閱" -> log `使用者於 <時間> 明示豁免本次審閱` and continue; agent NEVER self-exempts.

## 3. Commit Format

`[<stage>] <brief action>` e.g., `[build] WIP: ADC 濾波參數化，尚缺單元測試`
Stage tags: `[plan]` `[build]` `[maintain]`, takeover exception `[takeover]` (§2).

## 4. Boundaries

- **Scope Limited to This File's Dir & Subdirs** (nested setups: this file's dir prevails):
  * On rule conflict, follow THIS file—do not alter behavior per parent.
  * **NEVER modify parent `AGENTS.md`/`LLM_MEMORY.md`/`COMPONENT_MAP.md`**, and NEVER write this dir's log into parent; each hands over independently.
  * Parent is readable for context; editing files outside this dir requires prior user approval.
- `README.md` is human-facing docs—NEVER write plans, status, or TODOs.
- NEVER modify this file (`AGENTS.md`) without explicit user instruction.
- Tool entry adapters (`CLAUDE.md`/`GEMINI.md`, etc.) ONLY reference `@./AGENTS.md` or tool-specific config—NEVER override/relax this file's rules (this file prevails).
- Commits are hard-checked by `scripts/hooks/`; NEVER bypass with `--no-verify` (if unconfigured, see §0). ONLY (1) pure Branch C constitution sync of `AGENTS.md`/`CLAUDE.md`/`GEMINI.md` (auto-exempt in `pre-commit`; `git log` tracks version history) and (2) scheduled/CI bots purely updating declared generated data files (e.g., `public/health.json`) are exempt from updating `LLM_MEMORY.md` (NEVER mix code/config edits; agent NEVER self-exempts).

## 5. Human Decisions & Corrections

- **Plain Replies**: Minimize output tokens while keeping replies understandable on first read. Use natural Traditional Chinese sentences. Lead with the conclusion; explain concrete impact and the next action when relevant. Cut repetition and filler, not necessary context or cause-and-effect. Avoid unexplained jargon and internal IDs; include technical details only when needed to decide, act, or verify.

- **Human Decisions (Global)**: Number pending items (`1.` `2.`…) and options (`1A` `1B`…), stating ONLY brief point, recommendation, and brief, plain-language real pros/cons (pure defects: state fix directly—NEVER list "zero change" as a pro or editing code/scripts as a con; ONLY real trade-offs or added per-turn always-read context/token cost are cons); expand details ONLY after user ruling or option callout (log capped at ~1200 bytes with summary only).
- **User Corrections (Current Turn's Just-Given Answer ONLY)**: If user flags an undisputed error, acknowledge briefly, fix directly, and continue—NEVER waste tokens explaining; committed handovers and〈已定案〉plans still follow §1/§2.1.
