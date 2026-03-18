import type { ReportModel } from "../../core/types.js";
import { getReportMessages, replaceParams } from "../../core/i18n.js";
import { summarizeStory, summarizeUnlinkedRepo } from "./summarize-report.js";
import { renderStoryBlock } from "./format-story-block.js";

export function renderMarkdown(report: ReportModel): string {
  const t = getReportMessages(report.locale);
  const lines: string[] = [];

  lines.push(`# ${t.title}`);
  lines.push(`${t.sprint}: ${report.sprint.name}`);
  lines.push(`${t.period}: ${report.period.from} to ${report.period.to}`);
  lines.push("");
  lines.push(`## ${t.highlights}`);
  lines.push(`- ${report.summary}`);
  lines.push(`- ${replaceParams(t.workedStories, { storyCount: String(report.stats.storyCount), repoCount: String(report.stats.repoCount) })}`);
  if (report.stats.standaloneItemCount > 0) {
    lines.push(
      report.stats.standaloneItemCount === 1
        ? `- ${t.standaloneItemsOne}`
        : `- ${replaceParams(t.standaloneItems, { count: String(report.stats.standaloneItemCount) })}`
    );
  }
  lines.push(`- ${replaceParams(t.commitsAndItems, { commitCount: String(report.stats.commitCount), relatedCount: String(report.stats.relatedItemCount) })}`);
  if (report.stats.hotfixCount > 0) {
    lines.push(
      report.stats.hotfixCount === 1
        ? `- ${t.hotfixCountOne}`
        : `- ${replaceParams(t.hotfixCount, { count: String(report.stats.hotfixCount) })}`
    );
  }
  if (report.includeUnlinkedTechnicalWork && report.stats.unlinkedCommitCount > 0) {
    lines.push(
      `- ${replaceParams(t.unlinkedCommits, {
        count: String(report.stats.unlinkedCommitCount),
        repoCount: String(report.stats.unlinkedRepoCount)
      })}`
    );
  }
  lines.push("");
  lines.push(`## ${t.userStories}`);
  lines.push("");

  if (report.stories.length === 0) {
    lines.push(t.noStories);
  } else {
    for (const story of report.stories) {
      renderStoryBlock(lines, story, (s) => summarizeStory(s, report.locale), false, t);
    }
  }

  if (report.standaloneWorkItems.length > 0) {
    lines.push(`## ${t.tasksUnlinked}`);
    lines.push(`*${t.tasksUnlinkedSubtitle}*`);
    lines.push("");
    for (const story of report.standaloneWorkItems) {
      renderStoryBlock(lines, story, (s) => summarizeStory(s, report.locale), true, t);
    }
  }

  if (report.includeUnlinkedTechnicalWork && report.unlinkedRepos.length > 0) {
    lines.push(`## ${t.unlinkedWork}`);
    lines.push(`*${t.unlinkedWorkSubtitle}*`);
    lines.push("");

    for (const repo of report.unlinkedRepos) {
      lines.push(`### ${repo.repoName}`);
      lines.push(`- ${t.summary}: ${summarizeUnlinkedRepo(repo, report.locale)}`);
      lines.push(`- Commits: ${repo.commitCount}`);
      lines.push(`- Reasons: ${repo.reasons.join(", ")}`);
      lines.push(`- ${t.evidence}:`);

      for (const commit of repo.commits) {
        lines.push(`  - \`${commit.shortHash}\` - ${commit.message}`);
      }

      lines.push("");
    }
  }

  return lines.join("\n");
}
