import type { AzureIteration, CorrelationResult, GitCommit, ReportModel, RepoInfo, UnlinkedRepoActivity } from "../../core/types.js";
import { summarizeReport } from "./summarize-report.js";

type BuildReportModelParams = {
  repos: RepoInfo[];
  commits: GitCommit[];
  sprint: AzureIteration;
  correlation: CorrelationResult;
  from: string;
  to: string;
  includeUnlinkedTechnicalWork: boolean;
  locale: "pt-BR" | "en";
};

export function buildReportModel({
  repos,
  commits,
  sprint,
  correlation,
  from,
  to,
  includeUnlinkedTechnicalWork,
  locale
}: BuildReportModelParams): ReportModel {
  const unlinkedRepos = includeUnlinkedTechnicalWork ? buildUnlinkedRepoActivity(correlation) : [];

  const baseReport = {
    sprint,
    period: { from, to },
    stories: correlation.includedStories,
    standaloneWorkItems: correlation.standaloneWorkItems,
    unlinkedRepos,
    includeUnlinkedTechnicalWork,
    locale,
    stats: {
      repoCount: repos.length,
      commitCount: commits.length,
      storyCount: correlation.includedStories.length,
      standaloneItemCount: correlation.standaloneWorkItems.length,
      relatedItemCount:
        correlation.includedStories.reduce((total, story) => total + story.relatedWorkItemIds.length, 0) +
        correlation.standaloneWorkItems.reduce((total, story) => total + story.relatedWorkItemIds.length, 0),
      hotfixCount:
        correlation.includedStories.reduce((total, story) => total + story.hotfixCommits.length, 0) +
        correlation.standaloneWorkItems.reduce((total, story) => total + story.hotfixCommits.length, 0),
      unlinkedCommitCount: unlinkedRepos.reduce((total, repo) => total + repo.commitCount, 0),
      unlinkedRepoCount: unlinkedRepos.length
    }
  };

  return {
    ...baseReport,
    summary: summarizeReport(baseReport)
  };
}

function buildUnlinkedRepoActivity(correlation: CorrelationResult): UnlinkedRepoActivity[] {
  const repos = new Map<string, UnlinkedRepoActivity>();

  for (const entry of correlation.excludedCommits) {
    const key = `${entry.commit.repoName}::${entry.commit.repoPath}`;
    const existing = repos.get(key) ?? {
      repoName: entry.commit.repoName,
      repoPath: entry.commit.repoPath,
      commitCount: 0,
      commits: [],
      reasons: []
    };

    existing.commits.push(entry.commit);
    existing.reasons.push(entry.reason);
    existing.commitCount = existing.commits.length;
    repos.set(key, existing);
  }

  return [...repos.values()]
    .map((repo) => ({
      ...repo,
      commits: repo.commits.sort((left, right) => left.authoredAt.localeCompare(right.authoredAt)),
      reasons: [...new Set(repo.reasons)]
    }))
    .sort((left, right) => right.commitCount - left.commitCount || left.repoName.localeCompare(right.repoName));
}
