import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

export type DetectedAzureInfo = {
  organization: string;
  project: string;
  source: string;
  repoName: string;
  url: string;
};

export async function detectAzureInfoFromRepo(repoPath: string): Promise<DetectedAzureInfo[]> {
  const results: DetectedAzureInfo[] = [];

  try {
    const { stdout } = await execFileAsync("git", ["remote", "-v"], {
      cwd: repoPath,
      maxBuffer: 1024 * 1024
    });

    const lines = stdout.trim().split(/\r?\n/).filter(Boolean);

    for (const line of lines) {
      const parsed = parseRemoteLine(line);
      if (parsed && !results.some((r) => r.organization === parsed.organization && r.project === parsed.project)) {
        results.push(parsed);
      }
    }
  } catch {
    // Not a git repo or git command failed
  }

  return results;
}

export async function detectAzureInfoFromRepos(repoPaths: string[]): Promise<DetectedAzureInfo[]> {
  const allResults: DetectedAzureInfo[] = [];

  for (const repoPath of repoPaths) {
    const results = await detectAzureInfoFromRepo(repoPath);
    for (const result of results) {
      if (!allResults.some((r) => r.organization === result.organization && r.project === result.project)) {
        allResults.push(result);
      }
    }
  }

  return allResults;
}

export function parseRemoteLine(line: string): DetectedAzureInfo | undefined {
  const match = line.match(/^(\S+)\s+(\S+)/);
  if (!match) return undefined;

  const source = match[1] ?? "";
  const url = match[2] ?? "";

  const parsed = parseAzureUrl(url);
  if (!parsed) return undefined;

  return {
    organization: parsed.organization,
    project: parsed.project,
    source,
    url,
    repoName: extractRepoName(url) ?? source
  };
}

export function parseAzureUrl(url: string): { organization: string; project: string } | undefined {
  const trimmed = url.trim();

  // dev.azure.com format: https://dev.azure.com/org/proj/_git/repo
  const devAzurePattern = /dev\.azure\.com\/([^/]+)\/([^/?#]+)/i;
  const devMatch = trimmed.match(devAzurePattern);
  if (devMatch) {
    return {
      organization: decodeURIComponent(devMatch[1] ?? ""),
      project: decodeURIComponent(devMatch[2] ?? "")
    };
  }

  // SSH format: git@ssh.dev.azure.com:v3/org/proj/repo
  const sshPattern = /ssh\.dev\.azure\.com:v3\/([^/]+)\/([^/?#]+)/i;
  const sshMatch = trimmed.match(sshPattern);
  if (sshMatch) {
    return {
      organization: decodeURIComponent(sshMatch[1] ?? ""),
      project: decodeURIComponent(sshMatch[2] ?? "")
    };
  }

  // visualstudio.com format: https://org.visualstudio.com/proj/_git/repo
  const visualstudioPattern = /([^/]+)\.visualstudio\.com\/([^/?#]+)/i;
  const vsMatch = trimmed.match(visualstudioPattern);
  if (vsMatch) {
    return {
      organization: vsMatch[1] ?? "",
      project: decodeURIComponent(vsMatch[2] ?? "")
    };
  }

  return undefined;
}

export function extractRepoName(url: string): string | undefined {
  // Try to extract repo name from _git/repo or v3/org/proj/repo patterns
  const gitSuffixPattern = /_git\/([^/?#]+)$/i;
  const gitMatch = url.match(gitSuffixPattern);
  if (gitMatch) {
    return decodeURIComponent(gitMatch[1] ?? "");
  }

  const sshPattern = /:v3\/[^/]+\/[^/]+\/([^/?#]+)$/i;
  const sshMatch = url.match(sshPattern);
  if (sshMatch) {
    return decodeURIComponent(sshMatch[1] ?? "");
  }

  return undefined;
}
