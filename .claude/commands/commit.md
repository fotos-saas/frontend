---
allowed-tools: Bash(git *), Agent
description: Review + commit (review KÖTELEZŐ >20 sor változásnál)
---

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your task

A változtatások commitolása **review-val**:

### 1. Változások felmérése
Nézd meg a diff méretét. Ha **>20 sor** a változás:

### 2. Code Review (KÖTELEZŐ >20 sor felett)
Spawolj egy `everything-claude-code:code-reviewer` subagent-et hogy review-zza a módosított fájlokat.
- Ha CRITICAL hibát talál → **javítsd ELŐSZÖR**, utána commitolj
- Ha WARNING → javítsd ha gyorsan lehet, különben commitolj megjegyzéssel
- Ha csak SUGGESTION → commitolj

### 3. Commit
- Stage a releváns fájlokat (NE adj hozzá `.env`, credentials, stb.)
- Commit message: magyar, konvencionális format (`feat:`, `fix:`, `refactor:`, stb.)
- NE írd alá Claude Code-dal
- FONTOS: `frontend/` és `backend/` KÜLÖN git repo! Ha mindkettőben van változás, MINDKETTŐBEN commitolj!
- `git pull --rebase` PUSH ELŐTT
- Push mindkét repóba ha volt változás

### 4. Ha <=20 sor a változás
Egyszerű commit, review nélkül. Stage + commit + push.
