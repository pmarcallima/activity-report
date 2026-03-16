# Activity Report CLI

Generate a sprint-scoped Markdown activity report by correlating Git commits from multiple repositories with Azure DevOps work items, while keeping unmatched work in a fallback section.

## Requirements

- Node.js 22+
- Azure CLI logged in (`az login`)

## Installation

### Option 1: Global CLI (Recommended)

Build and link globally:

```bash
npm install
npm run build
npm link
```

Now you can run `activity-report` from anywhere:

```bash
activity-report init
activity-report doctor
activity-report generate --last-sprints 2
```

### Option 2: Local Development

```bash
pnpm install
pnpm dev init
pnpm dev doctor
pnpm dev generate --last-sprints 2
```

## Quickstart

Run the init command to create configuration:

```bash
activity-report init
```

The `init` command will ask for:
- your Azure DevOps organization and project
- repository root folders
- output directory for reports

## Commands

- `init` - create configuration file
- `doctor` - validate configuration and environment
- `generate` - create activity report

## Usage

```bash
activity-report generate
activity-report generate --sprint current
activity-report generate --sprint "Features Sprint 12"
activity-report generate --last-sprints 2
activity-report generate --from 2026-03-01 --to 2026-03-13
activity-report generate --debug
```

## Configuration

The CLI uses a single `activity-report.json` file. This file contains personal settings (paths, email) and should **not be committed** to version control.

Example configuration:

```json
{
  "azure": {
    "organization": "your-org",
    "project": "Your Project"
  },
  "repoRoots": [
    "C:\\Users\\you\\work"
  ],
  "outputDir": "C:\\Users\\you\\reports",
  "git": {
    "authorEmail": "you@company.com"
  },
  "ignoreBranches": ["master", "develop"],
  "report": {
    "includeUnlinkedTechnicalWork": true
  },
  "debug": {
    "enabledByDefault": false
  }
}
```

### Git Identity

The CLI uses your Git identity to attribute commits. It checks:

1. Local git config in each repo root (takes precedence)
2. Global git config as fallback

To use a different identity for a specific project, initialize git and set local config:

```bash
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

Or configure globally:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Environment Variables in Paths

Use `${VAR_NAME}` placeholders for portable paths:

```json
{
  "repoRoots": ["${WORK_ROOT}\\my-project"],
  "outputDir": "${WORK_ROOT}\\activity-report\\reports"
}
```

Set the variable before running:

```powershell
$env:WORK_ROOT = "C:\\Users\\you\\work"
activity-report generate --last-sprints 2
```

## Current Behavior

- Scans nested repositories under each path in `repoRoots`
- Reads commits for the configured Git author
- Parses `feature/<id>_description.<name>` and `hotfix/<id>_description.<name>` branches
- Loads sprint work items from Azure DevOps
- Rolls task, bug, and other work item activity up to the parent user story when possible
- Shows link quality as exact or inferred in report sections
- Adds generated summaries for each sprint, story, and unlinked repo section
- Keeps unmatched commits in `Unlinked Technical Work` when `includeUnlinkedTechnicalWork` is enabled
- Can generate a combined report for the last N sprints with `--last-sprints`
- Writes a Markdown report to `outputDir`
- Writes debug JSON only when `--debug` is enabled
