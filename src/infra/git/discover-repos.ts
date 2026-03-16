import { readdir } from "node:fs/promises";
import path from "node:path";

import type { RepoInfo } from "../../core/types.js";

export async function discoverRepos(reposRoots: string[]): Promise<RepoInfo[]> {
  const repos: RepoInfo[] = [];
  const seenPaths = new Set<string>();

  for (const reposRoot of reposRoots) {
    await walkForRepos(path.resolve(reposRoot), repos, seenPaths);
  }

  return repos.sort((left, right) => left.name.localeCompare(right.name));
}

async function walkForRepos(currentPath: string, repos: RepoInfo[], seenPaths: Set<string>): Promise<void> {
  const gitPath = path.join(currentPath, ".git");
  try {
    await readdir(gitPath);
    const normalizedPath = path.normalize(currentPath).toLowerCase();
    if (!seenPaths.has(normalizedPath)) {
      seenPaths.add(normalizedPath);
      repos.push({ name: path.basename(currentPath), path: currentPath });
    }
    return;
  } catch {
    // not a git repo, keep scanning
  }

  const entries = await readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (shouldSkipDirectory(entry.name)) {
      continue;
    }

    await walkForRepos(path.join(currentPath, entry.name), repos, seenPaths);
  }
}

function shouldSkipDirectory(directoryName: string): boolean {
  return ["node_modules", ".git", ".idea", ".vscode", "dist", "build", "coverage"].includes(directoryName);
}
