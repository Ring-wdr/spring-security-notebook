---
name: backend-spring-security-workflow
description: Use only when editing backend implementation files under `backend/`, such as `src/main/java`, `src/test/java`, or `backend/pom.xml`. For notebook-style explanation, summaries, or study artifacts without backend code edits, use `notebooklm` instead.
---

# Backend Spring Security Workflow

Use this only for backend code changes in `D:\spring-security-notebook\backend`.

1. Read `AGENTS.md`, `backend/pom.xml`, the task-relevant backend files, and the matching document in `docs/spring-security-notebooklm-docs/`.
2. Read `.agents/skills/java-springboot/SKILL.md` and follow its Spring Boot conventions.
3. Keep edits inside `backend/src/main/java/`, `backend/src/test/java/`, or `backend/pom.xml` unless the task clearly requires adjacent backend config.
4. After backend Java or Maven changes, run `.\mvnw.cmd spotless:apply` in `backend`.
5. Before finishing, run `.\mvnw.cmd checkstyle:check` and `.\mvnw.cmd test`.
6. If `pom.xml`, build plugins, packaging, or lifecycle wiring changed, also run `.\mvnw.cmd verify`.
7. Do not use this skill for notebook-style explanation, summaries, or study artifacts that do not modify backend code. Use `notebooklm` there first.
