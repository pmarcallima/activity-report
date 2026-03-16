import type { ReportModel } from "../../core/types.js";
import { summarizeStory, summarizeUnlinkedRepo } from "./summarize-report.js";

export function renderMarkdown(report: ReportModel): string {
  const lines: string[] = [];

  lines.push("# Activity Report");
  lines.push(`Sprint: ${report.sprint.name}`);
  lines.push(`Period: ${report.period.from} to ${report.period.to}`);
  lines.push("");
  lines.push("## Highlights");
  lines.push(`- ${report.summary}`);
  lines.push(`- Worked on ${report.stats.storyCount} user stories across ${report.stats.repoCount} repositories.`);
  lines.push(`- Collected ${report.stats.commitCount} commits and ${report.stats.relatedItemCount} related work items.`);
  if (report.stats.hotfixCount > 0) {
    lines.push(`- Included ${report.stats.hotfixCount} hotfix commit${report.stats.hotfixCount === 1 ? "" : "s"}.`);
  }
  if (report.includeUnlinkedTechnicalWork && report.stats.unlinkedCommitCount > 0) {
    lines.push(
      `- Kept ${report.stats.unlinkedCommitCount} additional unlinked commit${report.stats.unlinkedCommitCount === 1 ? "" : "s"} from ${report.stats.unlinkedRepoCount} repositor${report.stats.unlinkedRepoCount === 1 ? "y" : "ies"}.`
    );
  }
  lines.push("");
  lines.push("## User Stories");
  lines.push("");

  if (report.stories.length === 0) {
    lines.push("No correlated user stories were found for the selected sprint and date range.");
  } else {
    for (const story of report.stories) {
      lines.push(`### US#${story.storyId} - ${story.storyTitle}`);
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

      lines.push("");
    }
  }

  if (report.includeUnlinkedTechnicalWork && report.unlinkedRepos.length > 0) {
    lines.push("## Unlinked Technical Work");
    lines.push("");

    for (const repo of report.unlinkedRepos) {
      lines.push(`### ${repo.repoName}`);
      lines.push(`- Summary: ${summarizeUnlinkedRepo(repo)}`);
      lines.push(`- Commits: ${repo.commitCount}`);
      lines.push(`- Reasons: ${repo.reasons.join(", ")}`);
      lines.push("- Evidence:");

      for (const commit of repo.commits) {
        lines.push(`  - \`${commit.shortHash}\` - ${commit.message}`);
      }

      lines.push("");
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
