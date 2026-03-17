import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";

import { logger } from "../../core/logger.js";
import { detectGitIdentity, discoverRepoRoot, type GitIdentity } from "../../config/git-identity.js";
import { CONFIG_FILENAME } from "../../config/constants.js";
import { promptRequired, promptPath, promptConfirm, promptSelect } from "../prompt-utils.js";
import { detectAzureInfoFromRepo, type DetectedAzureInfo } from "../../infra/azure/detect-from-remotes.js";
import { discoverRepos } from "../../infra/git/discover-repos.js";
import { withSpinner } from "../progress.js";

type AzureConfig = {
  organization: string;
  project: string;
};

async function detectConfiguration(): Promise<{
  repoRoot: string | undefined;
  repos: Array<{ name: string; path: string }>;
  azureInfo: DetectedAzureInfo | undefined;
  gitIdentity: GitIdentity | undefined;
}> {
  const repoRoot = await withSpinner("Scanning for repositories...", async () => {
    return discoverRepoRoot();
  });

  let repos: Array<{ name: string; path: string }> = [];

  if (repoRoot) {
    try {
      repos = await withSpinner(`Found ${repos.length} repositories under ${repoRoot}`, async () => {
        return discoverRepos([repoRoot]);
      });
    } catch {
      // Failed to discover repos
    }
  }

  logger.info(`Found ${repos.length} repositories`);

  const azureInfo = await withSpinner("Detecting Azure DevOps configuration from git remotes...", async () => {
    for (const repo of repos.slice(0, 5)) {
      const results = await detectAzureInfoFromRepo(repo.path);
      if (results.length > 0) {
        logger.info(`Detected Azure DevOps: ${results[0].organization} / ${results[0].project}`);
        return results[0];
      }
    }
    return undefined;
  });

  if (azureInfo) {
    logger.info(`Detected Azure DevOps: ${azureInfo.organization} / ${azureInfo.project}`);
  }

  const gitIdentity = await withSpinner("Detecting Git identity...", async () => {
    if (repos.length > 0) {
      return detectGitIdentity(repos.map((r) => r.path));
    }
    return undefined;
  });

  if (gitIdentity) {
    logger.info(`Detected Git identity: ${gitIdentity.name} <${gitIdentity.email}>`);
  }

  return { repoRoot, repos, azureInfo, gitIdentity };
}

async function promptAzureConfiguration(detectedInfo?: DetectedAzureInfo): Promise<AzureConfig> {
  if (detectedInfo) {
    const useDetected = await promptConfirm(
      `Use detected Azure DevOps: ${detectedInfo.organization} / ${detectedInfo.project}?`,
      true
    );

    if (useDetected) {
      return {
        organization: detectedInfo.organization,
        project: detectedInfo.project
      };
    }
  }

  // If no detection or user declined, ask manually
  const organization = await promptRequired("Azure organization name (from your dev.azure.com URL):");
  const project = await promptRequired("Azure project name:");

  return { organization, project };
}

async function promptRepoConfiguration(
  detectedRoot: string | undefined,
  repos: Array<{ name: string; path: string }>
): Promise<string> {
  if (detectedRoot) {
    const useDetected = await promptConfirm(`Use detected repository root: ${detectedRoot}?`, true);
    if (useDetected) {
      return detectedRoot;
    }
  }

  const manualRoot = await promptPath("Repository root folder (parent directory containing Git repos):");
  return manualRoot;
}

async function promptOutputConfiguration(repoRoot: string): Promise<string> {
  const defaultOutput = path.join(repoRoot, "activity-report", "reports");
  const outputDir = await promptPath("Output directory for generated reports:", defaultOutput);
  return outputDir;
}

async function promptGitConfiguration(detectedIdentity?: GitIdentity): Promise<string | undefined> {
  if (detectedIdentity) {
    const useDetected = await promptConfirm(
      `Filter commits by detected email: ${detectedIdentity.email}?`,
      true
    );

    if (useDetected) {
      return detectedIdentity.email;
    }

    const configureDifferent = await promptConfirm("Configure a different email for commit filtering?", false);
    if (!configureDifferent) {
      return undefined;
    }

    return promptRequired("Git author email for commit filtering:");
  }

  const configureGit = await promptConfirm("Configure Git author email for commit filtering?", true);
  if (!configureGit) {
    return undefined;
  }

  return promptRequired("Git author email:");
}

function resolveWorkRootPlaceholder(absolutePath: string, workRoot: string): string {
  const normalizedPath = path.normalize(absolutePath).toLowerCase();
  const normalizedWorkRoot = path.normalize(workRoot).toLowerCase();

  if (normalizedPath.startsWith(normalizedWorkRoot)) {
    return absolutePath.replace(/^.+\\work\\/i, "${WORK_ROOT}\\").replace(/^.+\/work\//i, "${WORK_ROOT}/");
  }

  return absolutePath;
}

function buildConfigContent(
  azure: AzureConfig,
  repoRoot: string,
  outputDir: string,
  useEnvPlaceholders: boolean,
  gitEmail?: string
): string {
  const config = {
    azure: {
      organization: azure.organization,
      project: azure.project
    },
    repoRoots: useEnvPlaceholders ? [resolveWorkRootPlaceholder(repoRoot, repoRoot)] : [repoRoot],
    outputDir: useEnvPlaceholders ? resolveWorkRootPlaceholder(outputDir, repoRoot) : outputDir,
    ...(gitEmail ? { git: { authorEmail: gitEmail } } : {}),
    ignoreBranches: ["master", "develop"],
    report: {
      includeUnlinkedTechnicalWork: true
    },
    debug: {
      enabledByDefault: false
    }
  };

  return JSON.stringify(config, null, 2);
}

async function previewAndConfirm(configContent: string): Promise<boolean> {
  logger.info("\n" + "=".repeat(50));
  logger.info("Configuration preview:");
  logger.info("=".repeat(50));
  logger.info(configContent);
  logger.info("=".repeat(50) + "\n");

  return promptConfirm("Save this configuration?", true);
}

export async function initCommand(options: { force?: boolean }): Promise<void> {
  const configPath = path.resolve(CONFIG_FILENAME);

  if (existsSync(configPath) && !options.force) {
    logger.error(`${CONFIG_FILENAME} already exists. Use --force to overwrite it.`);
    process.exitCode = 1;
    return;
  }

  try {
    const { repoRoot, repos, azureInfo, gitIdentity } = await detectConfiguration();

    const azure = await promptAzureConfiguration(azureInfo);
    const selectedRepoRoot = await promptRepoConfiguration(repoRoot, repos);
    const outputDir = await promptOutputConfiguration(selectedRepoRoot);

    const useEnvPlaceholders = await promptConfirm(
      "Use ${WORK_ROOT} placeholders for paths (recommended for team sharing)?",
      true
    );

    const gitEmail = await promptGitConfiguration(gitIdentity);

    const configContent = buildConfigContent(azure, selectedRepoRoot, outputDir, useEnvPlaceholders, gitEmail);

    const confirmed = await previewAndConfirm(configContent);

    if (!confirmed) {
      logger.info("Configuration cancelled.");
      return;
    }

    // Create output directory
    const finalOutputDir = useEnvPlaceholders
      ? outputDir.replace(/\$\{WORK_ROOT\}/, selectedRepoRoot.split(/\\work\\/i)[0] + "\\work")
      : outputDir;

    await mkdir(finalOutputDir, { recursive: true });
    logger.info(`Created output directory: ${finalOutputDir}`);

    // Write configuration
    await writeFile(configPath, configContent, "utf8");
    logger.info(`Wrote ${configPath}`);

    if (useEnvPlaceholders) {
      logger.info("\nRemember to set the WORK_ROOT environment variable:");
      logger.info("  PowerShell: $env:WORK_ROOT = \"C:\\Users\\you\\work\"");
      logger.info("  CMD:        set WORK_ROOT=C:\\Users\\you\\work");
      logger.info("  Bash:       export WORK_ROOT=/home/you/work");
    }

    logger.info("\nNext steps:");
    logger.info("  1. Run: corepack pnpm dev doctor");
    logger.info("  2. Run: corepack pnpm dev generate --last-sprints 2");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to initialize: ${message}`);
    process.exitCode = 1;
  }
}
