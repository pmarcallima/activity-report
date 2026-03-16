import type { MultiSprintReport, ReportModel } from "../../core/types.js";
import { summarizeStory, summarizeUnlinkedRepo } from "./summarize-report.js";

export function renderMultiSprintMarkdown(multiSprintReport: MultiSprintReport): string {
  const lines: string[] = [];

  lines.push("# Activity Report - Last Sprints");
  lines.push(`Generated at: ${multiSprintReport.generatedAt}`);
  lines.push("");
  lines.push("## Overview");

  for (const report of multiSprintReport.reports) {
    lines.push(
      `- ${report.sprint.name}: ${report.summary} Linked stories: ${report.stats.storyCount}; linked commits: ${report.stats.commitCount - report.stats.unlinkedCommitCount}; unlinked commits: ${report.stats.unlinkedCommitCount}.`
    );
  }

  for (const report of multiSprintReport.reports) {
    lines.push("");
    lines.push(`## ${report.sprint.name}`);
    lines.push(`- Period: ${report.period.from} to ${report.period.to}`);
    lines.push(`- Summary: ${report.summary}`);
    lines.push("");
    lines.push("### User Stories");

    if (report.stories.length === 0) {
      lines.push("- No correlated user stories found.");
    } else {
      for (const story of report.stories) {
        lines.push(`#### US#${story.storyId} - ${story.storyTitle}`);
        lines.push(`- State: ${story.storyState}`);
        lines.push(`- Summary: ${summarizeStory(story)}`);
        lines.push(`- Link quality: ${formatLinkQuality(story.exactMatchCount, story.inferredMatchCount)}`);
        if (story.relatedWorkItemIds.length > 0) {
          lines.push(`- Related work items: ${story.relatedWorkItemIds.map((itemId) => `#${itemId}`).join(", ")}`);
        }
        lines.push(`- Repositories: ${story.repos.map((repo) => `\`${repo}\``).join(", ")}`);
        lines.push("- Evidence:");
        for (const commit of story.commits.sort((left, right) => left.authoredAt.localeCompare(right.authoredAt))) {
          lines.push(`  - \`${commit.repoName}\` - \`${commit.shortHash}\` - ${commit.message}`);
        }
      }
    }

    if (report.includeUnlinkedTechnicalWork && report.unlinkedRepos.length > 0) {
      lines.push("");
      lines.push("### Unlinked Technical Work");
      for (const repo of report.unlinkedRepos) {
        lines.push(`#### ${repo.repoName}`);
        lines.push(`- Summary: ${summarizeUnlinkedRepo(repo)}`);
        lines.push(`- Commits: ${repo.commitCount}`);
        lines.push(`- Reasons: ${repo.reasons.join(", ")}`);
        lines.push("- Evidence:");
        for (const commit of repo.commits) {
          lines.push(`  - \`${commit.shortHash}\` - ${commit.message}`);
        }
      }
    }
  }

  return lines.join("\n");
}

function formatLinkQuality(exactMatchCount: number, inferredMatchCount: number): string {
  const parts: string[] = [];
  if (exactMatchCount > 0) {
    parts.push(`${exactMatchCount} exact`);
  }
  if (inferredMatchCount > 0) {
    parts.push(`${inferredMatchCount} inferred`);
  }

  return parts.length > 0 ? parts.join(", ") : "no linked commits";
}
