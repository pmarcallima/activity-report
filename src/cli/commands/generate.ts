import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { loadConfig } from "../../config/load-config.js";
import { logger } from "../../core/logger.js";
import { slugify, uniqueNumbers, extractSprintNumber } from "../../core/utils.js";
import type {
  AppConfig,
  AzureIteration,
  GenerateOptions,
  GeneratePipelineResult,
  MultiSprintReport,
  SprintSelection
} from "../../core/types.js";
import { writeDebugFiles } from "../../debug/write-debug-files.js";
import { buildReportModel } from "../../domain/report/build-report-model.js";
import { renderMultiSprintMarkdown } from "../../domain/report/render-multi-sprint-markdown.js";
import { renderMarkdown } from "../../domain/report/render-markdown.js";
import { getAccessToken } from "../../infra/azure/get-access-token.js";
import { getIterations } from "../../infra/azure/get-iterations.js";
import { resolveSprint } from "../../infra/azure/resolve-sprint.js";
import { getSprintWorkItemIds } from "../../infra/azure/get-sprint-work-items.js";
import { getWorkItemDetails } from "../../infra/azure/get-work-item-details.js";
import { collectCommits } from "../../infra/git/collect-commits.js";
import { discoverRepos } from "../../infra/git/discover-repos.js";
import { correlateCommitsToItems } from "../../domain/correlation/correlate-commits-to-items.js";

export async function generateCommand(options: GenerateOptions): Promise<void> {
  if ((options.from && !options.to) || (!options.from && options.to)) {
    throw new Error("Provide both --from and --to when overriding the report period.");
  }

  const config = await loadConfig();
  const token = await getAccessToken();

  if (options.lastSprints) {
    await generateLastSprintsCommand({ config, token, options });
    return;
  }

  const sprintSelection = resolveSprintSelection(options.sprint);
  const result = await generateSingleSprintReport({ config, token, sprintSelection, options });

  if (options.debug ?? config.debug.enabledByDefault) {
    const debugDir = path.join(path.dirname(result.outputPath), "debug");
    await writeDebugFiles(debugDir, result);
    logger.info(`Debug files written to ${debugDir}`);
  }

  logger.info(`Report written to ${result.outputPath}`);
}

async function generateLastSprintsCommand({
  config,
  token,
  options
}: {
  config: AppConfig;
  token: string;
  options: GenerateOptions;
}): Promise<void> {
  const sprintCount = Number(options.lastSprints);
  if (!Number.isInteger(sprintCount) || sprintCount < 1) {
    throw new Error("--last-sprints must be a positive integer.");
  }

  logger.info("Resolving sprint history...");
  const allIterations = await getIterations(config, token);
  const currentSprint = await resolveSprint(config, token, { mode: "current" });
  const selectedSprints = selectLastSprints(allIterations, currentSprint, sprintCount);

  // Generate folder name: sprints-12-11-10
  const sprintNumbers = selectedSprints
    .map((s) => extractSprintNumber(s.name))
    .filter((n): n is number => n !== undefined)
    .join("-");
  const combinedSlug = sprintNumbers ? `sprints-${sprintNumbers}` : `last-${sprintCount}-sprints`;
  
  const outputBase = options.output ? path.resolve(options.output) : path.resolve(config.outputDir, combinedSlug);
  const reports: GeneratePipelineResult[] = [];

  for (const sprint of selectedSprints) {
    logger.info(`Generating report for ${sprint.name}...`);
    const result = await generateSingleSprintReport({
      config,
      token,
      sprintSelection: { mode: "named", sprintName: sprint.name },
      options: {
        ...options,
        output: path.join(outputBase, buildSprintFolderName(sprint.name))
      }
    });

    reports.push(result);
  }

  const combined: MultiSprintReport = {
    generatedAt: new Date().toISOString(),
    reports: reports.map((result) => result.report)
  };
  const combinedPath = path.join(outputBase, "report.md");
  await mkdir(path.dirname(combinedPath), { recursive: true });
  await writeFile(combinedPath, renderMultiSprintMarkdown(combined), "utf8");

  if (options.debug ?? config.debug.enabledByDefault) {
    const debugDir = path.join(outputBase, "debug");
    await writeDebugFiles(debugDir, { ...combined, outputPath: combinedPath } as GeneratePipelineResult);
    logger.info(`Debug files written to ${debugDir}`);
  }

  logger.info(`Combined report written to ${combinedPath}`);
}

async function generateSingleSprintReport({
  config,
  token,
  sprintSelection,
  options
}: {
  config: AppConfig;
  token: string;
  sprintSelection: SprintSelection;
  options: GenerateOptions;
}): Promise<GeneratePipelineResult> {

  logger.info("Resolving sprint...");
  const sprint = await resolveSprint(config, token, sprintSelection);

  const from = options.from ?? sprint.startDate?.slice(0, 10);
  const to = options.to ?? sprint.finishDate?.slice(0, 10);

  if (!from || !to) {
    throw new Error("Could not determine report date range. Provide --from and --to or use a sprint with start/end dates.");
  }

  logger.info("Discovering repositories...");
  const repos = await discoverRepos(config.repoRoots);

  logger.info(`Collecting commits from ${repos.length} repositories...`);
  const commitGroups = await Promise.all(repos.map((repo) => collectCommits({ repo, config, from, to })));
  const commits = commitGroups.flat();

  logger.info("Loading Azure sprint work items...");
  const workItemIds = await getSprintWorkItemIds(config, token, sprint);
  const referencedWorkItemIds = commits
    .map((commit) => commit.branchReference?.itemId ?? commit.messageItemId)
    .filter((itemId): itemId is number => Number.isInteger(itemId));
  const [sprintWorkItems, referencedWorkItems] = await Promise.all([
    getWorkItemDetails(config, token, uniqueNumbers(workItemIds)),
    getWorkItemDetails(config, token, uniqueNumbers(referencedWorkItemIds), { expandRelated: true })
  ]);
  const workItems = mergeWorkItems([...sprintWorkItems, ...referencedWorkItems]);

  logger.info("Correlating commits to Azure work items...");
  const correlation = correlateCommitsToItems(commits, workItems);
  const report = buildReportModel({
    repos,
    commits,
    sprint,
    correlation,
    from,
    to,
    includeUnlinkedTechnicalWork: config.report.includeUnlinkedTechnicalWork
  });
  const markdown = renderMarkdown(report);

  const outputPath = resolveOutputPath(config.outputDir, options.output, sprint.name, to);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, markdown, "utf8");

  return {
    repos,
    commits,
    sprint,
    workItems,
    correlation,
    report,
    outputPath
  };
}

function resolveSprintSelection(rawSprint?: string): SprintSelection {
  if (!rawSprint || rawSprint === "current") {
    return { mode: "current" };
  }

  return { mode: "named", sprintName: rawSprint };
}

function buildSprintFolderName(sprintName: string): string {
  const sprintNumber = extractSprintNumber(sprintName);
  if (sprintNumber !== undefined) {
    return `sprint-${sprintNumber}`;
  }
  // Fallback to slugified name for non-standard sprint names
  return slugify(sprintName);
}

function resolveOutputPath(
  outputDir: string, 
  customOutput: string | undefined, 
  sprintName: string, 
  toDate: string
): string {
  const folderName = buildSprintFolderName(sprintName);
  
  if (customOutput) {
    const resolved = path.resolve(customOutput);
    if (path.extname(resolved) === ".md") {
      return resolved;
    }
    return path.join(resolved, folderName, "report.md");
  }

  return path.join(path.resolve(outputDir), folderName, "report.md");
}

function selectLastSprints(iterations: AzureIteration[], currentSprint: AzureIteration, count: number): AzureIteration[] {
  const sorted = iterations
    .filter((iteration) => iteration.startDate && iteration.finishDate)
    .sort((left, right) => new Date(right.startDate ?? 0).getTime() - new Date(left.startDate ?? 0).getTime());

  const currentIndex = sorted.findIndex((iteration) => iteration.id === currentSprint.id || iteration.path === currentSprint.path);
  const startIndex = currentIndex >= 0 ? currentIndex : 0;
  return sorted.slice(startIndex, startIndex + count);
}

function mergeWorkItems<T extends { id: number }>(items: T[]): T[] {
  const merged = new Map<number, T>();

  for (const item of items) {
    merged.set(item.id, item);
  }

  return [...merged.values()];
}
