import { describe, expect, it, vi, beforeEach } from "vitest";

import { collectCommits } from "../../src/infra/git/collect-commits.js";
import type { AppConfig, RepoInfo } from "../../src/core/types.js";

const mockExecFile = vi.fn();

vi.mock("node:child_process", () => ({
  execFile: (...args: unknown[]) => mockExecFile(...args)
}));

vi.mock("node:util", () => ({
  promisify: (fn: (...a: unknown[]) => Promise<unknown>) => (...args: unknown[]) => fn(...args)
}));

describe("collectCommits", () => {
  const repo: RepoInfo = { name: "test-repo", path: "/tmp/test-repo" };

  beforeEach(() => {
    mockExecFile.mockReset();
  });

  it("calls git log with since and until", async () => {
    mockExecFile.mockResolvedValueOnce({ stdout: "" });
    await collectCommits({
      repo,
      config: {},
      from: "2026-03-01",
      to: "2026-03-16"
    });
    expect(mockExecFile).toHaveBeenCalledWith(
      "git",
      expect.arrayContaining(["--since=2026-03-01", "--until=2026-03-16"]),
      expect.any(Object)
    );
  });

  it("adds --author for each authorEmail when config.git.authorEmails is set", async () => {
    mockExecFile.mockResolvedValueOnce({ stdout: "" });
    await collectCommits({
      repo,
      config: {
        git: { authorEmails: ["a@example.com", "b@example.com"] }
      },
      from: "2026-03-01",
      to: "2026-03-16"
    });
    const args = mockExecFile.mock.calls[0]?.[1] as string[];
    expect(args).toContain("--author=a@example.com");
    expect(args).toContain("--author=b@example.com");
  });

  it("adds single --author when config.git.authorEmail is set (no authorEmails)", async () => {
    mockExecFile.mockResolvedValueOnce({ stdout: "" });
    await collectCommits({
      repo,
      config: {
        git: { authorEmail: "single@example.com" }
      },
      from: "2026-03-01",
      to: "2026-03-16"
    });
    const args = mockExecFile.mock.calls[0]?.[1] as string[];
    expect(args).toContain("--author=single@example.com");
  });

  it("prefers authorEmails over authorEmail when both set", async () => {
    mockExecFile.mockResolvedValueOnce({ stdout: "" });
    await collectCommits({
      repo,
      config: {
        git: { authorEmail: "single@example.com", authorEmails: ["multi@example.com"] }
      },
      from: "2026-03-01",
      to: "2026-03-16"
    });
    const args = mockExecFile.mock.calls[0]?.[1] as string[];
    expect(args).toContain("--author=multi@example.com");
    expect(args).not.toContain("--author=single@example.com");
  });

  it("returns empty array when stdout is empty", async () => {
    mockExecFile.mockResolvedValueOnce({ stdout: "\n  \n" });
    const result = await collectCommits({
      repo,
      config: {},
      from: "2026-03-01",
      to: "2026-03-16"
    });
    expect(result).toEqual([]);
  });

  it("parses one commit line and filters Merge commit", async () => {
    const line = [
      "abc1234567890",
      "Author Name",
      "author@example.com",
      "2026-03-10T10:00:00+00:00",
      "Merge branch 'x'",
      "HEAD -> main, origin/feature/123"
    ].join("\u001f");
    mockExecFile.mockResolvedValueOnce({ stdout: line + "\n" });
    const result = await collectCommits({
      repo,
      config: {},
      from: "2026-03-01",
      to: "2026-03-16"
    });
    expect(result).toHaveLength(0);
  });

  it("parses one valid commit and returns GitCommit shape", async () => {
    const line = [
      "abc1234567890abcdef",
      "Author Name",
      "author@example.com",
      "2026-03-10T10:00:00+00:00",
      "feat: add login",
      "HEAD -> main, origin/feature/12345_desc"
    ].join("\u001f");
    mockExecFile.mockResolvedValueOnce({ stdout: line + "\n" });
    const result = await collectCommits({
      repo,
      config: { ignoreBranches: [] },
      from: "2026-03-01",
      to: "2026-03-16"
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      repoName: "test-repo",
      repoPath: "/tmp/test-repo",
      hash: "abc1234567890abcdef",
      shortHash: "abc1234",
      authorName: "Author Name",
      authorEmail: "author@example.com",
      authoredAt: "2026-03-10T10:00:00+00:00",
      message: "feat: add login"
    });
  });

  it("uses repo.path as cwd", async () => {
    mockExecFile.mockResolvedValueOnce({ stdout: "" });
    await collectCommits({
      repo: { name: "r", path: "C:/projects/r" },
      config: {},
      from: "2026-03-01",
      to: "2026-03-16"
    });
    expect(mockExecFile).toHaveBeenCalledWith(
      "git",
      expect.any(Array),
      expect.objectContaining({ cwd: "C:/projects/r" })
    );
  });
});
