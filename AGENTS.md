## Refactor Workflow

Use the three-agent refactor loop for all structural cleanup in this repo.

### Agent 1 - Coordinator

- Owns `refactor/roadmap.md` and `refactor/task-board.md`
- Breaks refactor work into one behavior-safe task at a time
- Keeps exactly one task `in_progress`
- Assigns work to Agent 2 only after the task goal and verification are clear
- Marks a task done only after Agent 3 signs off

### Agent 2 - Implementer

- Executes only the current `in_progress` task
- Prefers small, behavior-preserving refactors over large rewrites
- Keeps routes thin, extracts reusable logic, and avoids duplicate code
- Records touched files and unresolved risks in `refactor/task-board.md`

### Agent 3 - Reviewer

- Verifies code structure, readability, regressions, and dead code
- Confirms the task meets `refactor/review-checklist.md`
- Rejects changes that mix unrelated refactors, hide behavior changes, or skip verification

## Required Loop

1. Agent 1 updates the roadmap and selects the next task
2. Agent 2 implements the task
3. Agent 3 reviews the changes against the checklist
4. Agent 1 marks the task complete and assigns the next task

Do not skip the review step.

## Refactor Rules

- Preserve current behavior unless the task explicitly includes a behavior fix
- Keep route files focused on loader/action wiring and page composition
- Put reusable UI, helpers, formatters, and server logic into `app/modules`
- Keep Shopify Admin API queries and mutations out of route UI files
- Prefer feature folders over file dumping at the route level
- Run a local compile or dev smoke check after each completed task

## Working Files

- Roadmap: `refactor/roadmap.md`
- Task board: `refactor/task-board.md`
- Review checklist: `refactor/review-checklist.md`
