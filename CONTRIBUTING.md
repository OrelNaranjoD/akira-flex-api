# 🧭 Workflow and Release Guide (NestJS API)

This guide explains how to collaborate on the NestJS API repository in an organized way, without creating branches per task, using semantic commits in English, and controlling releases from the `main` branch.

## 🔧 Branch structure

- **develop**: shared working branch. All day-to-day work and task integration happens here.
- **main**: protected branch. Only updated by merge from `develop` and used to publish official releases.

## 🔁 Operational flow

### 1. Daily work on develop

- The whole team works directly on the `develop` branch.
- Each commit must follow the semantic commit convention in English and include the task identifier (e.g. `AFA-101`).
- Valid examples:
  - `feat(AFA-101): add user controller`
  - `fix(AFA-102): correct JWT validation`
  - `refactor(AFA-103): optimize database queries`
- Do not create branches per task. Tracking is done in the Kanban board and reflected in commits.

### 2. Publishing a new release

- When a stable release is ready:
  - Perform a manual merge from `develop` into `main` (via PR).
  - Run the `build` workflow (it can be triggered automatically on `push` to `main` or manually via `workflow_dispatch`).
  - Select the release type:
    - `patch`: for minor fixes or internal adjustments
    - `minor`: for new features that maintain compatibility
    - `major`: for breaking changes

### 3. Error handling and rollback

- If a published release has problems:
  - Fix the issue in `develop`.
  - Merge the fix from `develop` into `main`.
  - Re-run the `build` workflow with an appropriate release type (you can bump minor/major to force a new release if necessary).

- The `main` branch must be protected and require review before merging.
- Keep branches synchronized: after each release ensure `develop` includes the changes from `main`.

---

```sh
# Switch to develop
git checkout develop

# Update develop with remote changes
git pull origin develop

# Work in develop
# Make your changes here

# Stage changes and create a semantic commit
git add .
git commit -m "feat(AFA-101): add user controller"

# Push changes to develop
git push origin develop

# Send PR for review and wait for approval
# Create PR to main
gh pr create --base main --head develop --title "Merge develop into main" --body "Automated PR to merge changes from develop into main"

# NOTE: Stay on the PR page for review and approval for OrelNaranjoD


# Sync develop with main after release if necessary
git fetch --all
git pull origin main
git push origin develop

# View commit history
git log --oneline --decorate --graph --all
```
