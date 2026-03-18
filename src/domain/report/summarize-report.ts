import type { GitCommit, ReportModel, StoryAggregate, UnlinkedRepoActivity } from "../../core/types.js";
import { getReportMessages, replaceParams } from "../../core/i18n.js";

export function summarizeReport(report: Omit<ReportModel, "summary">): string {
  const t = getReportMessages(report.locale);
  const parts: string[] = [];

  if (report.stories.length > 0) {
    const topStory = report.stories
      .slice()
      .sort((left, right) => right.commits.length - left.commits.length)[0];

    if (topStory) {
      parts.push(
        replaceParams(t.summaryFocused, {
          ref: formatStoryRef(topStory),
          repos: formatRepoList(topStory.repos, t),
          themes: topThemesFromCommits(topStory.commits, 3, t).join(", ")
        })
      );
    }
  } else {
    parts.push(t.summaryNoStories);
  }

  if (report.standaloneWorkItems.length > 0) {
    parts.push(
      report.standaloneWorkItems.length === 1
        ? replaceParams(t.summaryStandaloneOne, {})
        : replaceParams(t.summaryStandalone, { count: String(report.standaloneWorkItems.length) })
    );
  }

  if (report.includeUnlinkedTechnicalWork && report.unlinkedRepos.length > 0) {
    const topRepo = report.unlinkedRepos[0];
    if (topRepo) {
      parts.push(
        replaceParams(t.summaryUnlinkedRepo, {
          repo: topRepo.repoName,
          themes: topThemesFromCommits(topRepo.commits, 3, t).join(", ")
        })
      );
    }
  }

  return parts.join(" ");
}

export function summarizeStory(story: StoryAggregate, locale: ReportModel["locale"] = "en"): string {
  const t = getReportMessages(locale);
  const themes = topThemesFromCommits(story.commits, 3, t);
  const relatedItemCount = story.relatedWorkItemIds.length || story.referencedItemIds.length;
  return replaceParams(t.summaryWorkedAcross, {
    repos: formatRepoList(story.repos, t),
    count: String(relatedItemCount),
    themes: themes.join(", ")
  });
}

export function summarizeUnlinkedRepo(repo: UnlinkedRepoActivity, locale: ReportModel["locale"] = "en"): string {
  const t = getReportMessages(locale);
  const themes = topThemesFromCommits(repo.commits, 3, t);
  return repo.commitCount === 1
    ? replaceParams(t.summaryCapturedOne, { repo: repo.repoName, themes: themes.join(", ") })
    : replaceParams(t.summaryCaptured, {
        count: String(repo.commitCount),
        repo: repo.repoName,
        themes: themes.join(", ")
      });
}

function topThemesFromCommits(
  commits: GitCommit[],
  limit: number,
  t: import("../../core/i18n.js").ReportMessages
): string[] {
  const normalized = commits
    .map((commit) => normalizeCommitMessage(commit.message))
    .filter((message) => message.length > 0);

  const frequency = new Map<string, number>();
  for (const message of normalized) {
    const theme = message.split(/,| e | and /i)[0]?.trim() ?? message;
    if (!theme) {
      continue;
    }
    frequency.set(theme, (frequency.get(theme) ?? 0) + 1);
  }

  const themes = [...frequency.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([theme]) => theme);

  return themes.length > 0 ? themes : [t.themeFallback];
}

function normalizeCommitMessage(message: string): string {
  return message
    .replace(/^\[[A-Z]+\]\s*/i, "")
    .replace(/^#\w+\s*-\s*/i, "")
    .replace(/^#\d+\s*-\s*/i, "")
    .replace(/^\d+\s*-\s*/i, "")
    .replace(/^Revert\s+/i, "revert ")
    .replace(/^[-:]+\s*/, "")
    .trim();
}

function formatRepoList(repos: string[], t: import("../../core/i18n.js").ReportMessages): string {
  if (repos.length === 1) {
    return repos[0] ?? t.theRepository;
  }

  if (repos.length === 2) {
    return `${repos[0]} ${t.and} ${repos[1]}`;
  }

  return `${repos.slice(0, -1).join(", ")}, ${t.and} ${repos[repos.length - 1]}`;
}

function formatStoryRef(story: StoryAggregate): string {
  return `US#${story.storyId}`;
}
