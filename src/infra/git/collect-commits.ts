import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { AppConfig, GitCommit, RepoInfo } from "../../core/types.js";
import { extractWorkItemId } from "./extract-work-item-id.js";
import { parseBranchName } from "./parse-branch-name.js";

const execFileAsync = promisify(execFile);

type CollectCommitsParams = {
  repo: RepoInfo;
  config: AppConfig;
  from: string;
  to: string;
};

export async function collectCommits({ repo, config, from, to }: CollectCommitsParams): Promise<GitCommit[]> {
  const prettyFormat = ["%H", "%an", "%ae", "%aI", "%s", "%D"].join("\u001f");
  const args = [
    "log",
    "--all",
    `--since=${from}`,
    `--until=${to}`,
    `--pretty=format:${prettyFormat}`
  ];

  const authorEmails =
    config.git?.authorEmails?.length ? config.git.authorEmails : config.git?.authorEmail ? [config.git.authorEmail] : [];
  for (const email of authorEmails) {
    args.push(`--author=${email}`);
  }

  const { stdout } = await execFileAsync("git", args, { cwd: repo.path, maxBuffer: 10 * 1024 * 1024 });

  if (!stdout.trim()) {
    return [];
  }

  return stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => {
      const parts = line.split("\u001f");
      const message = parts[4] ?? "";
      return !shouldIgnoreCommit(message);
    })
    .map((line) => {
      const [hash, authorName, authorEmail, authoredAt, message, decorations] = line.split("\u001f");
      const branchName = selectRelevantBranch(decorations ?? "", config.ignoreBranches);

      return {
        repoName: repo.name,
        repoPath: repo.path,
        hash,
        shortHash: hash.slice(0, 7),
        authorName,
        authorEmail,
        authoredAt,
        message,
        branchName,
        branchReference: branchName ? parseBranchName(branchName) : undefined,
        messageItemId: extractWorkItemId(message)
      } satisfies GitCommit;
    });
}

function shouldIgnoreCommit(message: string): boolean {
  return (
    message.startsWith("Merge ") ||
    message.startsWith("WIP on ") ||
    message.startsWith("index on ") ||
    message.startsWith("untracked files on ") ||
    message.startsWith("On ")
  );
}

function selectRelevantBranch(decorations: string, ignoredBranches: string[]): string | undefined {
  const refs = decorations
    .split(",")
    .map((value) => value.trim())
    .map((value) => value.replace(/^HEAD ->\s*/, ""))
    .map((value) => value.replace(/^origin\//, ""))
    .filter(Boolean)
    .filter((value) => !ignoredBranches.includes(value));

  for (const ref of refs) {
    if (parseBranchName(ref)) {
      return ref;
    }
  }

  return undefined;
}
