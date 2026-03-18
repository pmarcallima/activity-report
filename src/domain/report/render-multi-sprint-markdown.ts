import type { MultiSprintReport, ReportModel } from "../../core/types.js";
import { getReportMessages, getMessages, formatReportDate } from "../../core/i18n.js";
import { summarizeStory, summarizeUnlinkedRepo } from "./summarize-report.js";
import { renderStoryBlock } from "./format-story-block.js";

export function renderMultiSprintMarkdown(multiSprintReport: MultiSprintReport): string {
  const lines: string[] = [];
  const firstLocale = multiSprintReport.reports[0]?.locale ?? "en";
  const cliT = getMessages(firstLocale);
  const reportT = getReportMessages(firstLocale);

  lines.push(`# ${cliT.multiSprintTitle}`);
  lines.push(`${reportT.generatedAt}: ${formatReportDate(multiSprintReport.generatedAt, firstLocale)}`);
  lines.push("");
  lines.push(`## ${cliT.overview}`);

  for (const report of multiSprintReport.reports) {
    const standaloneNote =
      report.stats.standaloneItemCount > 0
        ? `; ${report.stats.standaloneItemCount} ${reportT.overviewStandaloneShort}`
        : "";
    lines.push(
      `- ${report.sprint.name}: ${report.summary} ${reportT.overviewLinkedStories}: ${report.stats.storyCount}${standaloneNote}; ${reportT.overviewLinkedCommits}: ${report.stats.commitCount - report.stats.unlinkedCommitCount}; ${reportT.overviewUnlinkedCommits}: ${report.stats.unlinkedCommitCount}.`
    );
  }

  for (const report of multiSprintReport.reports) {
    const rt = getReportMessages(report.locale);
    lines.push("");
    lines.push(`## ${report.sprint.name}`);
    lines.push(`- ${rt.period}: ${report.period.from} to ${report.period.to}`);
    lines.push(`- ${rt.summary}: ${report.summary}`);
    lines.push("");
    lines.push(`### ${rt.userStories}`);

    if (report.stories.length === 0) {
      lines.push(`- ${cliT.noStoriesShort}`);
    } else {
      for (const story of report.stories) {
        renderStoryBlock(lines, story, (s) => summarizeStory(s, report.locale), false, rt, { headingLevel: 4 });
      }
    }

    if (report.standaloneWorkItems.length > 0) {
      lines.push("");
      lines.push(`### ${rt.tasksUnlinked}`);
      lines.push(`*${rt.tasksUnlinkedSubtitle}*`);
      for (const story of report.standaloneWorkItems) {
        renderStoryBlock(lines, story, (s) => summarizeStory(s, report.locale), true, rt, { headingLevel: 4 });
      }
    }

    if (report.includeUnlinkedTechnicalWork && report.unlinkedRepos.length > 0) {
      lines.push("");
      lines.push(`### ${rt.unlinkedWork}`);
      lines.push(`*${rt.unlinkedWorkSubtitle}*`);
      for (const repo of report.unlinkedRepos) {
        lines.push(`#### ${repo.repoName}`);
        lines.push(`- ${rt.summary}: ${summarizeUnlinkedRepo(repo, report.locale)}`);
        lines.push(`- Commits: ${repo.commitCount}`);
        lines.push(`- Reasons: ${repo.reasons.join(", ")}`);
        lines.push(`- ${rt.evidence}:`);
        for (const commit of repo.commits) {
          lines.push(`  - \`${commit.shortHash}\` - ${commit.message}`);
        }
      }
    }
  }

  return lines.join("\n");
}
