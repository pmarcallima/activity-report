import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { readdir, stat } from "node:fs/promises";

const execFileAsync = promisify(execFile);

export type GitIdentity = {
  name: string;
  email: string;
};

export async function detectGitIdentity(repoPaths: string[]): Promise<GitIdentity | undefined> {
  for (const repoPath of repoPaths) {
    const gitPath = path.join(repoPath, ".git");
    try {
      await readdir(gitPath);
    } catch {
      continue;
    }

    try {
      const [nameResult, emailResult] = await Promise.all([
        execFileAsync("git", ["config", "user.name"], { cwd: repoPath, maxBuffer: 1024 * 1024 }),
        execFileAsync("git", ["config", "user.email"], { cwd: repoPath, maxBuffer: 1024 * 1024 })
      ]);

      const name = nameResult.stdout.trim();
      const email = emailResult.stdout.trim();

      if (name && email) {
        return { name, email };
      }
    } catch {
      continue;
    }
  }

  // Also check global config as fallback
  try {
    const [nameResult, emailResult] = await Promise.all([
      execFileAsync("git", ["config", "--global", "user.name"], { maxBuffer: 1024 * 1024 }),
      execFileAsync("git", ["config", "--global", "user.email"], { maxBuffer: 1024 * 1024 })
    ]);

    const name = nameResult.stdout.trim();
    const email = emailResult.stdout.trim();

    if (name && email) {
      return { name, email };
    }
  } catch {
    // No global config
  }

  return undefined;
}

export async function discoverRepoRoot(): Promise<string | undefined> {
  let currentDir = process.cwd();
  let gitCount = 0;
  let lastGitParent: string | undefined;

  // Walk up directory tree counting git repos
  while (true) {
    const gitPath = path.join(currentDir, ".git");
    try {
      const gitStat = await stat(gitPath);
      if (gitStat.isDirectory()) {
        gitCount++;
        lastGitParent = currentDir;
      }
    } catch {
      // Not a git repo, continue
    }

    // Also check for subdirectories that contain git repos
    try {
      const entries = await readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subGitPath = path.join(currentDir, entry.name, ".git");
          try {
            await stat(subGitPath);
            gitCount++;
            if (!lastGitParent) {
              lastGitParent = currentDir;
            }
          } catch {
            // Not a git repo
          }
        }
      }
    } catch {
      // Cannot read directory, continue
    }

    // Found multiple git repos, suggest this parent directory
    if (gitCount >= 2) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached root
      break;
    }
    currentDir = parentDir;
  }

  // Found only one, suggest it anyway
  if (lastGitParent) {
    return path.dirname(lastGitParent) !== lastGitParent ? path.dirname(lastGitParent) : lastGitParent;
  }

  return undefined;
}