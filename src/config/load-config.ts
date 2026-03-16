import { readFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";

import { configSchema, type Config } from "./schema.js";
import { CONFIG_FILENAME } from "./constants.js";

function resolveEnvVariables(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, varName) => process.env[varName] ?? "");
}

function resolvePath(value: string, baseDir: string): string {
  const resolved = value.startsWith("~")
    ? value.replace("~", process.env.HOME ?? process.env.USERPROFILE ?? "")
    : value;

  if (path.isAbsolute(resolved)) {
    return resolved;
  }

  return path.resolve(baseDir, resolved);
}

function resolveConfigPaths(config: Config, baseDir: string): Config {
  return {
    ...config,
    repoRoots: config.repoRoots.map((root) => resolvePath(resolveEnvVariables(root), baseDir)),
    outputDir: resolvePath(resolveEnvVariables(config.outputDir), baseDir)
  };
}

function findConfigFile(filename: string, startDir?: string): string | undefined {
  const searchDir = startDir ?? process.cwd();
  const filePath = path.resolve(searchDir, filename);

  if (existsSync(filePath)) {
    return filePath;
  }

  return undefined;
}

export async function loadConfig(startDir?: string): Promise<Config> {
  const configPath = findConfigFile(CONFIG_FILENAME, startDir);

  if (!configPath) {
    throw new Error(
      `No configuration found. Run 'corepack pnpm dev init' to create ${CONFIG_FILENAME}.`
    );
  }

  const raw = await readFile(configPath, "utf8");
  const parsed = JSON.parse(raw);

  const baseDir = path.dirname(configPath);
  const withResolvedPaths = resolveConfigPaths(parsed, baseDir);

  return configSchema.parse(withResolvedPaths);
}
