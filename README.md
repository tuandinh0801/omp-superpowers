# omp-superpowers

Native [omp (Oh My Pi)](https://github.com/can1357/oh-my-pi) plugin providing first-class Superpowers skills and execution protocol from [obra/superpowers](https://github.com/obra/superpowers).

Bundles the full Superpowers skill suite (brainstorming, tdd, systematic debugging, code review, etc.) and a native omp extension that automatically injects the `using-superpowers` bootstrap at session start and after context compaction, mapping Claude Code conventions onto omp built-in lowercase tools (`read`, `write`, `edit`, `bash`, `grep`, `glob`, `task`, `todo`).

## Installation

Install via npm:

```bash
omp install npm:omp-superpowers
```

Or install directly from GitHub:

```bash
omp install git:github.com/tuandinh0801/omp-superpowers
```

### Local Development

To link a local clone during development:

```bash
omp plugin link "$PWD"
```

> **Important:** Restart omp after installing or linking any plugin with extension code. `/reload-plugins` refreshes skills, commands, and MCP servers, but runtime extensions require an omp restart to evaluate.

## How it works

1. **Native Skill Discovery:** All skills live under `skills/<name>/SKILL.md` with description frontmatter, auto-discovered by omp's native plugin manager. Invoke them with `skill://<name>` or `/skill:<name>`.
2. **Context Bootstrap:** On `session_start` and `session_compact`, the extension injects the `using-superpowers` bootstrap rule into context before subsequent assistant turns.
3. **Tool Mapping:** Instructs the model to use omp's native lowercase built-in tools (`read`, `write`, `edit`, `bash`, `grep`, `glob`, `task`, `todo`) instead of hallucinating Claude Code tools like `Skill`, `Task`, or `TodoWrite`.

## Verification / Acceptance

Start a fresh omp session and prompt:

```text
Let's make a react todo list
```

Expected behavior:
- Automatically activates `skill://brainstorming` before generating code.
- Asks clarifying questions to refine design requirements.
- Uses lowercase `todo` for task tracking and `task` for subagent work.

## Updating Skills

### Automatic Sync & Release

A scheduled GitHub Action (`.github/workflows/sync-and-publish.yml`) runs daily at 02:00 UTC (and can be triggered manually via `workflow_dispatch`). When upstream changes are detected:
1. Tests are verified with `npm test`.
2. Patch version is bumped in `package.json`.
3. Changes and tags are committed/pushed to `main`.
4. GitHub release is created and published to npm and GitHub Packages.

### Manual Sync

To sync manually:

```bash
# Sync from main or specified ref/tag
bash scripts/sync-skills.sh [ref]

# Commit updated skills and pin
git add -A
git commit -m "chore: sync superpowers skills @ <ref>"
```

## Credits & License

- Based on [obra/superpowers](https://github.com/obra/superpowers) by Jesse Vincent and contributors (MIT License).
- MIT License.
