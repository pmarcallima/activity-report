import { existsSync } from "node:fs";

import { logger } from "../../core/logger.js";
import { loadConfig } from "../../config/load-config.js";
import { detectGitIdentity } from "../../config/git-identity.js";
import { runAzureCommand } from "../../infra/azure/cli.js";
import type { Config } from "../../config/schema.js";

type DoctorCheckResult = {
  name: string;
  passed: boolean;
  message: string;
};

async function checkNodeVersion(): Promise<DoctorCheckResult> {
  const version = process.versions.node;
  const major = Number.parseInt(version.split(".")[0] ?? "0", 10);
  if (major >= 22) {
    return { name: "Node.js version", passed: true, message: `Node ${version} (>= 22)` };
  }
  return { name: "Node.js version", passed: false, message: `Node ${version} (requires >= 22)` };
}

async function checkAzLogin(): Promise<DoctorCheckResult> {
  try {
    await runAzureCommand(["account", "show"]);
    return { name: "Azure CLI login", passed: true, message: "Logged in to Azure CLI" };
  } catch {
    return { name: "Azure CLI login", passed: false, message: "Not logged in. Run 'az login'." };
  }
}

async function checkAzProjectAccess(config: { azure: { organization: string; project: string } }): Promise<DoctorCheckResult> {
  try {
    await runAzureCommand([
      "account",
      "get-access-token",
      "--resource",
      "499b84ac-1321-427f-aa17-267ca6975798",
      "--output",
      "json"
    ]);
    return { name: "Azure project access", passed: true, message: `Azure token available for ${config.azure.organization}/${config.azure.project}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { name: "Azure project access", passed: false, message: `Could not verify Azure token: ${message}` };
  }
}

async function checkRepoRoots(repoRoots: string[]): Promise<DoctorCheckResult> {
  const existingRoots: string[] = [];
  const missingRoots: string[] = [];

  for (const root of repoRoots) {
    if (existsSync(root)) {
      existingRoots.push(root);
    } else {
      missingRoots.push(root);
    }
  }

  if (missingRoots.length === 0) {
    return { name: "Repository roots", passed: true, message: `All ${existingRoots.length} repo roots exist.` };
  }

  const message = `${missingRoots.length} repo roots missing: ${missingRoots.join(", ")}`;
  return { name: "Repository roots", passed: missingRoots.length === 0, message };
}

async function checkGitIdentity(repoRoots: string[]): Promise<DoctorCheckResult> {
  const identity = await detectGitIdentity(repoRoots);
  if (identity) {
    return { name: "Git identity", passed: true, message: `${identity.name} <${identity.email}>` };
  }
  return { name: "Git identity", passed: false, message: "Could not detect Git identity from repo roots." };
}

async function checkConfig(): Promise<{ config: Config; result: DoctorCheckResult } | { config: undefined; result: DoctorCheckResult }> {
  try {
    const config = await loadConfig();
    return { config, result: { name: "Configuration", passed: true, message: "Valid activity-report configuration found." } };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { config: undefined, result: { name: "Configuration", passed: false, message } };
  }
}

export async function doctorCommand(): Promise<void> {
  const results: DoctorCheckResult[] = [];

  results.push(await checkNodeVersion());
  results.push(await checkAzLogin());
  const configResult = await checkConfig();
  results.push(configResult.result);

  if (configResult.config) {
    results.push(await checkAzProjectAccess(configResult.config));
    results.push(await checkRepoRoots(configResult.config.repoRoots));
    results.push(await checkGitIdentity(configResult.config.repoRoots));
  }

  logger.info("\nDoctor results:\n");
  for (const result of results) {
    const status = result.passed ? "✓" : "✗";
    logger.info(`${status} ${result.name}: ${result.message}`);
  }

  const allPassed = results.every((result) => result.passed);
  if (allPassed) {
    logger.info("\nAll checks passed. You are ready to generate reports.");
  } else {
    logger.error("\nSome checks failed. Fix the issues above before generating reports.");
    process.exitCode = 1;
  }
}
