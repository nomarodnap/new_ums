# AGENTS.md

This file gives Gemini — and any other AI coding agent working in this repo (Cursor, v0) — the context and conventions needed to work on this project consistently. It documents the **T3-inspired 2026 stack** and, more importantly, *why* each piece was chosen, so a future session doesn't silently re-litigate a decision that's already been made.

## Project Snapshot (Completed Phase 1-6)

- **What this is:** Internal web application for กรมประมง (Department of Fisheries) staff — reporting tools, dashboards, and integrations with external APIs.
- **Who uses it:** Internal government officers only. No public sign-up flow.
- **Priority order:** correctness & security > maintainability > speed of iteration. Every mutation should be written as if an auditor will read it later — because on a government system, eventually one will.
- **Current State:** The system features complete CRUD for bills, RBAC, automated internal audits, executive dashboards (Recharts), and an in-app notification/email engine. LINE Notify has been officially deprecated in favor of email simulations.

## Tech Stack

| Layer | Choice | Why it's the 2026 pick |
|---|---|---|
| Language | TypeScript, strict mode | End-to-end type safety is the entire point of a "T3" stack |
| Framework | Next.js 16, App Router | Stable React Compiler, Cache Components, active LTS |
| UI runtime | React 19 | Ships with Next.js 16 |
| Styling | Tailwind CSS v4 | CSS-first `@theme` config, no `tailwind.config.js`, Lightning CSS engine |
| Components | shadcn/ui (CLI v4) | Code lives in your repo (no version lock-in); ships `shadcn/skills` so AI agents use it correctly |
| ORM | Drizzle ORM | Plain-TypeScript schema, zero codegen step, smallest bundle for edge/serverless — and the schema style AI coding tools read most reliably |
| Database | PostgreSQL | Unchanged — already your standard |
| Auth | Better Auth | Self-hosted: sessions live in *your* Postgres, not a third party's — the right call for government data. Ships RBAC/organization plugins out of the box |
| Validation | Zod v4 | ~4-14x faster parsing than v3, shared schemas between client and server |
| API layer | Server Actions (default) + optional tRPC v11 | See "API Layer" below |
| Client data fetching | TanStack Query v5 | For dashboards that poll, paginate, or need optimistic updates |
| Lint & format | Biome + a thin ESLint config for `eslint-plugin-react-hooks` / `eslint-config-next` | Biome is 10–25x faster and replaces Prettier + most of ESLint, but doesn't cover Next-specific and type-aware rules yet |
| Package manager | pnpm | Mature, disk-efficient, identical behavior on Vercel, Docker, and CI (Bun is maturing fast here too — worth a spike, just not the default) |
| Deployment | Docker, self-hosted | See "Deployment" below |

### Why this isn't the original T3 Stack

The classic 2022 T3 Stack is Next.js + tRPC + Tailwind + Prisma + NextAuth. Three things changed by 2026:

1. **Prisma → Drizzle.** Prisma 7 (Nov 2025) dropped its Rust engine and closed much of the performance gap, so Prisma is still a perfectly fine choice — just not the default here. Drizzle's plain-TypeScript schema has no separate DSL and no `generate` step, which matters more for a "vibe coding" workflow where Cursor/Gemini are reading and editing the schema directly.
2. **NextAuth → Better Auth.** This isn't even a contested pick anymore — Auth.js (formerly NextAuth) is now maintained by the Better Auth team, so Better Auth is the continuation of that project, not a risky fork. It also ships RBAC and organization plugins, which map directly onto "permission/role-based access" instead of something to hand-roll.
3. **tRPC → optional.** It's no longer assumed by default — see below.

## API Layer: Server Actions vs. tRPC

**Default to Server Actions** for every mutation (forms, admin actions, anything triggered by a user submitting something):
- No separate route, works directly with `useActionState` / `useFormStatus`.
- Every action parses its input through a Zod schema before it touches the database — never trust `FormData` directly.
- Consider `next-safe-action` to remove the repetitive parsing/error boilerplate shown below; it's optional, the manual pattern works fine too.

**Reach for tRPC v11** only when a page needs several independent, cacheable, client-driven queries — a dashboard that filters, paginates, and refetches without a full page reload is the textbook case. tRPC + TanStack Query solves that specific shape of problem well. Don't add it "just in case" — it's an escape hatch, not a foundation.

**Don't build a public REST/OpenAPI layer** unless a real external consumer needs it (another agency's system, a mobile app). If that day comes, oRPC gives the same type safety as tRPC plus a generated OpenAPI spec, usually a better fit than hand-written route handlers.

```typescript
// src/server/actions/reports.ts
"use server";

import { z } from "zod";
import { db } from "@/server/db";
import { reports } from "@/server/db/schema";
import { requireRole } from "@/server/auth";

const createReportSchema = z.object({
  title: z.string().min(1).max(200),
});

export async function createReport(formData: FormData) {
  const session = await requireRole(["staff", "supervisor", "admin"]);

  const parsed = createReportSchema.safeParse({
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  await db.insert(reports).values({
    id: crypto.randomUUID(),
    title: parsed.data.title,
    createdBy: session.user.id,
  });

  return { success: true };
}
```

## Caching (Next.js 16 Cache Components)

Next.js 16 made caching **opt-in**: every route/component runs at request time unless explicitly marked `"use cache"`. For this project:
- Default to *no* caching on anything showing per-user or per-role data — dashboards, reports, anything gated by permission. Correctness beats speed here.
- Only add `"use cache"` to genuinely shared, non-personalized content (a reference list, a public FAQ) — and double-check it doesn't leak role-specific fields before doing so.

## Commands

```bash
pnpm dev            # dev server (Turbopack by default in Next.js 16)
pnpm build          # production build
pnpm lint           # biome check + eslint (react-hooks/next rules only)
pnpm format         # biome format --write
pnpm typecheck      # tsc --noEmit
pnpm db:generate    # drizzle-kit generate — new migration from schema changes
pnpm db:migrate     # drizzle-kit migrate — apply pending migrations
pnpm db:studio      # drizzle-kit studio — visual DB browser
pnpm test           # vitest
pnpm test:e2e       # playwright test
```

## Folder Structure

```text
src/
  app/
    (dashboard)/          # route group — authenticated staff area
    api/auth/[...all]/    # Better Auth handler (route.ts)
  components/
    ui/                   # shadcn/ui primitives — regenerate via CLI, don't hand-edit
  server/
    db/
      schema.ts           # Drizzle schema — single source of truth
      index.ts            # db client singleton
    actions/              # Server Actions, grouped by domain
    auth.ts                # Better Auth instance + requireRole() helper
  lib/
    validations/           # shared Zod schemas (imported by client and server)
  middleware.ts             # lightweight redirect-only auth check
drizzle/                    # generated SQL migrations — never hand-edit
```

## Coding Conventions

- Server Components by default. Add `"use client"` only where interactivity requires it (`useState`, `onClick`, forms).
- No `any` — if a type is genuinely unknown, use `unknown` and narrow it.
- No placeholder code (`// TODO: implement`). Ship complete implementations, or say explicitly in chat what's left undone — never leave it as a silent gap in committed code.
- Name Server Actions with a verb: `createReport`, `updateStaffRole` — not `reportAction`.
- Every Server Action re-checks permission server-side. A hidden button in the UI is not access control.

## Database (Drizzle)

```typescript
// src/server/db/schema.ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

- Schema lives only in `src/server/db/schema.ts` — never write raw `CREATE TABLE` / `ALTER TABLE` by hand.
- Workflow: edit `schema.ts` → `pnpm db:generate` → review the generated SQL in `drizzle/` → `pnpm db:migrate`.
- Never hand-edit a migration file in `drizzle/` once it's been applied anywhere shared (staging/prod) — generate a new one instead.

## Auth & Permissions (Government Context)

- Roles are modeled once through Better Auth's RBAC/organization plugin — not scattered as ad-hoc `if (user.email === "...")` checks.
- `middleware.ts` does a **cheap, optimistic check only** (session cookie presence) to redirect unauthenticated users away from `/dashboard/*` for UX. It is *not* the security boundary — middleware runs on the Edge runtime and shouldn't be doing real permission lookups.
- The actual authorization boundary is a shared `requireRole()` helper, called at the top of every Server Component and Server Action that touches sensitive data (a "Data Access Layer" pattern):

```typescript
// src/server/auth.ts
import { headers } from "next/headers";
import { auth } from "./auth-config"; // your betterAuth({...}) instance

type Role = "admin" | "auditor" | "strategy_finance" | "central_staff" | "regional_staff" | "user";

export async function requireRole(allowed: Role[]) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !allowed.includes(session.user.role as Role)) {
    throw new Error("Unauthorized");
  }

  return session;
}
```

Better Auth's exact config shape moves fast between versions — check its current docs when wiring this up for real; the pattern (one shared helper, called everywhere, middleware as UX-only) is the part that should stay stable.

## Domain Schema Context (Drizzle)

The core entities of this application are closely related to government utilities disbursement workflow:
- **`departments`**: Hierarchy of central and regional units.
- **`budgets`**: Annual allocated vs. transferred amounts per department.
- **`utilityBills`**: The central source of truth for all utility payments. Status tracks both invoice (`RECEIVED`, `NOT_RECEIVED`) and payment (`PENDING`, `PAID`).
- **`audits`**: A separate table that flags abnormal utility bills for internal review by auditors.
- **`notifications`**: A table for the Notification Engine to store warnings about budget limits and late payments.

## Environment Variables

```bash
DATABASE_URL=            # Postgres connection string (Drizzle)
BETTER_AUTH_SECRET=      # random 32+ byte secret
BETTER_AUTH_URL=         # e.g. http://localhost:3000, or the internal agency domain in prod

# Notifications
# NOTE: LINE Notify is out of service. We use an Email Simulation module (src/lib/email.ts)
# that simulates sending emails. In production, connect this to Resend or Nodemailer.
# RESEND_API_KEY=re_...
```

Add a `<SERVICE>_API_KEY` entry here (with a one-line note on what it's for) every time a new external API integration is added — don't let it live only in `.env` with no documentation trail.

## Security Notes

- Never commit `.env*` files — confirm `.gitignore` covers them before the first commit.
- Treat every external API response as untrusted input: validate it with Zod before storing or displaying it.
- Log who performed sensitive mutations — a `createdBy` / `performedBy` column, not just `updatedAt`.
- Keep Next.js patched. It shipped several Server Components / Middleware security advisories over the past year — including a critical Server Components RCE (CVE-2025-55182) disclosed in December 2025 — so treat a version bump as a security patch, not an optional feature update, especially on a government system.
- Government/citizen data considerations fall under Thailand's PDPA — when a feature touches personal data, that's a compliance question, not just a technical one.

## Testing

- Unit / integration: Vitest, colocated as `*.test.ts` next to the file it tests.
- End-to-end: Playwright — cover auth-gated flows first. A broken permission check matters far more here than a broken button.
- Minimum bar before merging: any Server Action that mutates official data has at least one test proving an unauthorized role gets rejected.

## Git Workflow

- Simplified GitFlow: short-lived feature branches off `main`, one PR per feature/fix.
- Squash merge into `main` — write the PR title like the changelog entry it will become.
- No direct commits to `main`, even solo — the PR is the diff you'll want later when tracing a change.

## Deployment

Default assumption: **self-hosted** on the agency's own infrastructure (data center / GDCC), not public Vercel. Official government data usually shouldn't sit on a third-party platform outside agency control unless that's been explicitly cleared.

- `next.config.ts`: `output: "standalone"` for a minimal Docker image.
- Multi-stage Dockerfile: build stage with full `node_modules`, runtime stage with only the standalone output.
- Nginx or Caddy in front for TLS termination inside the agency network.
- If one piece is genuinely public and holds no sensitive data (a public status page, say), Vercel is fine for *that piece* — don't let that decision default onto the whole app.

## AI Agent Behaviors & Tool Usage

- **Language:** Communicate with the developer in Thai to ensure smooth interaction, but write all code, variable names, and code comments strictly in English.
- **Context Gathering:** Aggressively use search tools (like `grep_search` and `view_file`) to understand the surrounding context and existing codebase before modifying or writing any new code. Do not guess the structure.
- **Requirement Source of Truth:** ALWAYS refer to the `requestment_clean.txt` file in the root directory for business rules, validation conditions, and feature requirements. Do not invent business logic without cross-referencing this document.
- **Artifacts:** Use markdown artifacts (like `implementation_plan.md` and `walkthrough.md`) for breaking down complex architectural changes and verifying steps before execution.

## Design & Aesthetics Guidelines

- **Rich Aesthetics (Tailwind v4 & shadcn/ui):** Do NOT build barebones or simple MVPs. Use modern UI design principles:
  - Employ sleek dark modes or harmonious curated color palettes (not basic red, blue, green).
  - Use modern typography (e.g., Inter, Roboto, Outfit) over browser defaults.
  - Implement smooth gradients, micro-animations, and hover effects to make the application feel premium and responsive.
  - Rely on standard shadcn/ui components but ensure they look customized and professional.
  - **Date/Month Pickers**: Every calendar and date input MUST use the Thai language and the Buddhist Era (พ.ศ.) year format (Year + 543). Native `<input type="date">` and `<input type="month">` are prohibited. You must use or build custom React components (e.g. `DatePickerBE`, `MonthPickerBE`) to enforce this format.

## Pre-Completion Checklist (For AI)

Before marking any task or feature as "done", verify the following:
- No `any` types were introduced (use `unknown` and type-narrowing instead).
- There is no placeholder code (`// TODO: implement`). Ship complete implementations.
- If applicable, verify that `pnpm typecheck`, `pnpm lint`, or `pnpm format` passes to ensure no errors were introduced.

## Error Handling & Responses

- **Server Actions:** Always return a standardized response object to make client-side error handling predictable. Use a discriminated union pattern:
  `{ success: true, data: T } | { success: false, error: string | Record<string, string[]> }`
- **Client Side:** Use robust toast notifications or form error states to display these errors clearly to the user.

## Naming Conventions

- **Files/Directories:** Use `kebab-case` for standard files and folders (e.g., `user-profile.ts`, `data-table.tsx`).
- **React Components:** Use `PascalCase` for component function names and their corresponding files if it exclusively exports the component (e.g., `UserProfile.tsx`).
- **Server Actions:** Use verbs in camelCase (e.g., `createReport`, `updateStaffRole`).

## Notes for AI Coding Tools

- This file is the source of truth for stack decisions — point Cursor and v0 at it too, not just Gemini.
- Next.js 16 ships its own `AGENTS.md` with version-matched framework docs. Treat that as "how Next.js works" and this file as "how *this project* uses Next.js" — don't duplicate framework docs here.
- shadcn/ui ships `shadcn/skills` specifically so coding agents use its CLI instead of hand-writing a component it already has — if an agent is about to write a dropdown/dialog/combobox from scratch, it should run `npx shadcn@latest add <component>` first.
- **Base UI & shadcn/ui (CLI v4) Gotchas:**
  - The new Base UI implementation **does not use the `asChild` prop** for composition in the same way Radix did.
  - Passing `asChild` to components like `<Button>`, `<DropdownMenuTrigger>`, or `<SidebarMenuButton>` will often cause hydration errors (e.g., `<button>` inside `<button>`).
  - **Solution:** Use the `render` prop instead (e.g., `<Button render={<Link href="..." />} />` or `<DropdownMenuTrigger render={<Button />} />`) or for standard Next.js routing, use `<Link className={buttonVariants({ variant: "default" })}>`.
  - **Select Component Label Rendering:** When using the `Select` component (which wraps Base UI), the `<SelectValue>` will default to rendering the selected `value` instead of the label if not explicitly provided in uncontrolled mode. You MUST either provide the mapped label as `children` to `<SelectValue>` conditionally, or make the `Select` controlled and pass the current mapped label.

## Do Not

- Don't introduce a new dependency (state manager, UI kit, ORM) without updating this file — future sessions shouldn't have to reverse-engineer the stack from `package.json`.
- Don't change the ORM's dialect assumption (Postgres) without discussion — schema, migrations, and the RBAC plugin all assume it.
- Don't use Pages Router patterns (`getServerSideProps`, `pages/`) — this project is App Router only.