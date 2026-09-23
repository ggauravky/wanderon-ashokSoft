# WanderLuxe — Contributing Guidelines

Thank you for contributing to WanderLuxe! This guide outlines our engineering standards, cross-platform requirements, and pull request workflow.

---

## Table of Contents

1. [Workflow Overview](#workflow-overview)
2. [Branch Naming Conventions](#branch-naming-conventions)
3. [Cross-Platform Development Rules](#cross-platform-development-rules)
4. [File & Path Conventions](#file--path-conventions)
5. [Git Line Endings (`.gitattributes`)](#git-line-endings-gitattributes)
6. [Pre-PR Verification Checklist](#pre-pr-verification-checklist)
7. [Commit Message Standards](#commit-message-standards)
8. [Pull Request Process](#pull-request-process)

---

## Workflow Overview

WanderLuxe follows a trunk-based feature-branch development model:

1. `main` is our stable integration branch.
2. Direct commits to `main` are restricted. All changes must go through feature branches and pull requests.
3. Every pull request must pass automated linting, unit tests, and production build checks.

---

## Branch Naming Conventions

Create focused, single-purpose branches branched off the latest `main`:

```bash
git checkout main
git pull origin main
git checkout -b <type>/<short-description>
```

**Recommended branch prefixes:**
- `feature/<name>`: New user-facing or staff functionality (e.g., `feature/itinerary-export-csv`)
- `fix/<name>`: Bug fixes and defect repairs (e.g., `fix/quotation-tax-calc`)
- `docs/<name>`: Documentation improvements (e.g., `docs/environment-variables-update`)
- `refactor/<name>`: Code restructuring without functional change (e.g., `refactor/booking-service-cleanup`)
- `perf/<name>`: Performance optimizations (e.g., `perf/media-batch-resolution`)

---

## Cross-Platform Development Rules

Our engineering team works across **Windows 10/11**, **macOS (Intel & Apple Silicon)**, and **Linux**. To avoid cross-platform bugs:

### 1. Case-Sensitivity in Imports (Critical)

- **The Problem**: Windows (NTFS) and macOS (APFS default) filesystems are **case-insensitive**, whereas Linux production environments (Render, Ubuntu, Docker) are **case-sensitive**.
- **The Rule**: Import paths must match the file's disk casing **identically**:
  ```javascript
  // ❌ FAILS ON LINUX / RENDER (if file is NamedModal.jsx)
  import NamedModal from '../components/namedModal.jsx';

  // ✅ WORKS CROSS-PLATFORM
  import NamedModal from '../components/NamedModal.jsx';
  ```
- Always verify your imports when creating or renaming components.

### 2. Path Separators in Code

- **The Rule**: Never hardcode platform-specific directory slashes (`\` or Windows drive letters like `C:\...` or `D:\...`) in executable application code.
- Always use Node's native `path` module:
  ```javascript
  import path from 'node:path';
  import { fileURLToPath } from 'node:url';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // ✅ Clean, cross-platform path resolution
  const configPath = path.resolve(__dirname, '../config/settings.json');
  ```

### 3. Cross-Platform Shell Commands in Scripts

- Do not use shell-specific commands like `rm -rf`, `cp`, `mv`, or `export VAR=val` inside `package.json` scripts.
- Prefer Node-based scripts (`node scripts/...`) or cross-platform tools for build and maintenance tasks.

---

## Git Line Endings (`.gitattributes`)

The repository includes a top-level `.gitattributes` file that enforces **LF line endings** for all source code:

```gitattributes
* text=auto eol=lf
```

- **Avoid Mass Line-Ending Normalization**: Do not run global Git line-ending normalization commands in feature branches, as this creates massive, noisy diffs that obstruct code review.
- Configure your editor (VS Code, WebStorm) to use `LF` line endings by default.

---

## File & Path Conventions

### Never Commit:
- ❌ `.env` or `.env.*` files containing secrets or local configuration.
- ❌ `node_modules/` directories.
- ❌ `dist/`, `build/`, or generated bundle assets.
- ❌ OS metadata files (`.DS_Store`, `Thumbs.db`).
- ❌ Personal editor settings (`.vscode/*` is gitignored).

---

## Pre-PR Verification Checklist

Before pushing your branch and opening a pull request, run the complete verification suite locally:

```bash
# 1. Frontend: Check linting and build
cd frontend
npm run lint
npm run test:staff-foundation
npm run build

# 2. Backend: Check quotation and payment unit tests
cd ../backend
npm run test:quotation-v2
npm run test:payment-reliability

# 3. Root: Validate travel knowledge integrity
cd ..
node scripts/validateTravelData.js
```

Ensure that:
- [ ] All tests pass without warnings or errors.
- [ ] No temporary `console.log` debugging statements or commented-out code blocks remain.
- [ ] `git status` shows no untracked `.env` files or unexpected binary artifacts.

---

## Commit Message Standards

Write clear, concise commit messages in imperative mood:

```text
<type>(<scope>): <short summary>

[optional detailed description]
```

**Examples:**
- `feat(quotation): add multi-currency breakdown to customer DTO`
- `fix(checkout): guard against double-submitting payment verify request`
- `docs(setup): clarify Node 22 requirement for Vite 8`
- `refactor(auth): simplify role permission checking in authMiddleware`

---

## Pull Request Process

1. **Push your branch**:
   ```bash
   git push origin <type>/<short-description>
   ```
2. **Open a Pull Request**: Target `main`.
3. **Fill out the PR Template**:
   - Provide a concise summary of changes and user impact.
   - List the verification steps you ran locally.
   - Include screenshots or terminal logs for UI or diagnostic adjustments.
4. **Code Review**: At least one peer review is required before merging. Address review feedback by pushing additional commits to the same branch.
5. **Merge**: Once approved and CI passes, use **Squash and Merge** to maintain a clean Git history on `main`.
