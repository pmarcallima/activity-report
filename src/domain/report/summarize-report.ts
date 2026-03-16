import type { GitCommit, ReportModel, StoryAggregate, UnlinkedRepoActivity } from "../../core/types.js";

export function summarizeReport(report: Omit<ReportModel, "summary">): string {
  const parts: string[] = [];

  if (report.stories.length > 0) {
    const topStory = report.stories
      .slice()
      .sort((left, right) => right.commits.length - left.commits.length)[0];

    if (topStory) {
      parts.push(
        `Focused on ${formatStoryRef(topStory)} across ${formatRepoList(topStory.repos)}, covering ${topThemesFromCommits(topStory.commits, 3).join(", "
        )}.`
      );
    }
  } else {
    parts.push("No Azure-linked user stories were correlated for this sprint.");
  }

  if (report.includeUnlinkedTechnicalWork && report.unlinkedRepos.length > 0) {
    const topRepo = report.unlinkedRepos[0];
    if (topRepo) {
      parts.push(
        `Additional direct work was captured in ${topRepo.repoName}, mainly around ${topThemesFromCommits(topRepo.commits, 3).join(", "
        )}.`
      );
    }
  }

  return parts.join(" ");
}

export function summarizeStory(story: StoryAggregate): string {
  const themes = topThemesFromCommits(story.commits, 3);
  const relatedItemCount = story.relatedWorkItemIds.length || story.referencedItemIds.length;
  return `Worked across ${formatRepoList(story.repos)} on ${relatedItemCount} related item${
    relatedItemCount === 1 ? "" : "s"
  }, mainly covering ${themes.join(", ")}.`;
}

export function summarizeUnlinkedRepo(repo: UnlinkedRepoActivity): string {
  const themes = topThemesFromCommits(repo.commits, 3);
  return `Captured ${repo.commitCount} direct commit${repo.commitCount === 1 ? "" : "s"} in ${repo.repoName}, mainly around ${themes.join(", ")}.`;
}

function topThemesFromCommits(commits: GitCommit[], limit: number): string[] {
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

  return themes.length > 0 ? themes : ["implementation updates"];
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

function formatRepoList(repos: string[]): string {
  if (repos.length === 1) {
    return repos[0] ?? "the repository";
  }

  if (repos.length === 2) {
    return `${repos[0]} and ${repos[1]}`;
  }

  return `${repos.slice(0, -1).join(", ")}, and ${repos[repos.length - 1]}`;
}

function formatStoryRef(story: StoryAggregate): string {
  return `US#${story.storyId}`;
}
