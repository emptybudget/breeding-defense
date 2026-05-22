# Coding Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## 5. AI Handoff — Keep `PROGRESS.md` Current

This project is collaborated on across multiple AI assistants. `PROGRESS.md` is the shared context file.

- **Read `PROGRESS.md` first** at the start of every session — it carries state the chat history doesn't.
- **Update `PROGRESS.md` in the same commit** as any meaningful change: new files, API changes, completed/added checklist items, constant tweaks, architecture shifts.
- Keep it dense and skimmable. Tables/checklists over prose. No fluff.
- Update the "마지막 갱신" date.
- At the end of each user-facing update, also leave a copy-pasteable handoff summary in chat.

---

## 6. Verification — The User Drives the Browser

**The user verifies UI/gameplay themselves via IDX preview. AI must NOT run headless browser verification.**

- ❌ Do NOT install Playwright, Puppeteer, Chromium, or any headless browser.
- ❌ Do NOT take automated screenshots of the running game.
- ❌ Do NOT loop on "spawn dev server → screenshot → inspect pixels".
- ✅ DO verify code with `npm run build` (tsc + vite) and unit logic via pure-TS tests if needed.
- ✅ DO start `npm run dev` only to confirm the server boots (HTTP 200) — then stop, report the port, hand off.
- The user opens the IDX port preview and plays the game. Trust them to report what they see.

---

## 7. Project Subagents

Project-scoped specialists in `.claude/agents/`:

- **`brainstormer`** — 아이디어 발산. 코드 수정 금지. 다양한 옵션 + 트레이드오프.
- **`game-designer`** — 게임 디자인 분석. 4박자 사이클 기준으로 평가. 코드 수정 금지.
- **`designer`** — 캐릭터/UI/아트 의뢰서 작성, 톤·스타일 결정, 스토어 메타 사양 조언. 코드 수정 금지.
- **`refactor-expert`** — 구조적 리팩토링. 동작 보존, `npm run build` 검증 필수.

Invoke them when the task matches their description. They auto-load `CLAUDE.md` + `PROGRESS.md` for context.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
