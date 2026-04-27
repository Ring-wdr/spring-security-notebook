---
name: modernize-next-react19
description: Modernize the repo's Next.js frontend by enabling React Compiler, removing unnecessary manual memoization, and refactoring legacy components toward React 19 patterns. Use when tasks mention React Compiler, `useMemo`/`useCallback`/`React.memo` cleanup, React 19 hooks such as `useEffectEvent`, `useActionState`, `useOptimistic`, or refreshing older code under `frontend/`.
---

# Modernize Next React19

## Overview

Use this skill as the frontend entry point for `D:\spring-security-notebook\frontend`.
The target stack is Next.js App Router, React 19, TypeScript, and Tailwind.

## Start Here

1. Read `frontend/AGENTS.md`, `frontend/package.json`, and the files named in the task.
2. If the task touches framework behavior, read the relevant guide in `frontend/node_modules/next/dist/docs/` before editing.
3. Preserve the learning flow of this repo:
   - Spring Boot remains the source of truth for auth and authorization.
   - `NEXT_PUBLIC_API_BASE_URL`, token refresh, role-gated navigation, and protected-route behavior must keep working.
   - Prefer small, readable refactors over abstractions that hide the auth flow.

## Modernization Workflow

1. Enable React Compiler the Next.js way.
   - Install `babel-plugin-react-compiler` in `frontend`.
   - Prefer `reactCompiler: true` in `frontend/next.config.ts`.
   - Avoid adding a custom Babel pipeline unless the task proves Next's built-in path is not enough.
2. Remove memoization that exists only defensively.
   - Delete `useMemo`, `useCallback`, and `React.memo` when they only stabilize literals, derived arrays, or handlers without measured benefit.
   - Keep manual memoization only when profiler evidence, a library contract, or a verified rendering hotspot requires it.
3. Prefer React 19 patterns when they simplify the code.
   - Use `useEffectEvent` when an Effect must read the latest values without forcing re-subscription.
   - Use `useActionState` for action-driven form or mutation flows.
   - Use `useOptimistic` with `startTransition` for optimistic UI and pending updates.
   - Keep `useState` or `useReducer` when newer hooks would add ceremony instead of clarity.
4. Respect App Router boundaries.
   - Keep `"use client"` only where interactivity or browser APIs require it.
   - Do not move working client auth flows to server-only patterns unless the task explicitly asks for that change.
   - Preserve navigation semantics when refactoring redirects or guards.
5. Verify after meaningful edits.
   - Run `npm run lint` in `frontend`.
   - Run `npm run build` when config, routing, or hook behavior changed.
   - When UI behavior changed, prefer `next-browser` for a quick browser check over source-only reasoning.

## Repo Hotspots

- `frontend/src/components/auth-provider.tsx`: session bootstrap, login/logout, refresh flow.
- `frontend/src/components/auth-guard.tsx`: protected-route redirects and role checks.
- `frontend/src/components/app-frame.tsx`: auth-aware navigation and logout entry.
- `frontend/src/app/login/page.tsx`: form state and post-login redirect flow.
- `frontend/src/lib/api-client.ts`: retry-on-refresh contract.

## Decision Rules

- Do not force React 19 hooks into places where they do not improve readability or behavior.
- If a refactor changes auth semantics, stop and re-check the current flow before continuing.
- If the user asked for backend or notebook work, do not load this skill unless the task explicitly touches `frontend/`.
