import { describe, expect, it } from "vitest";
import {
  parseAzureUrl,
  parseRemoteLine,
  extractRepoName,
  detectAzureInfoFromRepo
} from "../../src/infra/azure/detect-from-remotes.js";

describe("parseAzureUrl", () => {
  it("parses dev.azure.com HTTPS URL", () => {
    const url = "https://dev.azure.com/myorg/myproject/_git/myrepo";
    const result = parseAzureUrl(url);
    expect(result).toEqual({
      organization: "myorg",
      project: "myproject"
    });
  });

  it("parses dev.azure.com HTTPS URL with encoded characters", () => {
    const url = "https://dev.azure.com/myorg/My%20Project/_git/myrepo";
    const result = parseAzureUrl(url);
    expect(result).toEqual({
      organization: "myorg",
      project: "My Project"
    });
  });

  it("parses visualstudio.com legacy HTTPS URL", () => {
    const url = "https://myorg.visualstudio.com/myproject/_git/myrepo";
    const result = parseAzureUrl(url);
    expect(result).toEqual({
      organization: "myorg",
      project: "myproject"
    });
  });

  it("parses SSH URL format", () => {
    const url = "git@ssh.dev.azure.com:v3/myorg/myproject/myrepo";
    const result = parseAzureUrl(url);
    expect(result).toEqual({
      organization: "myorg",
      project: "myproject"
    });
  });

  it("returns undefined for GitHub URL", () => {
    const url = "https://github.com/user/repo.git";
    const result = parseAzureUrl(url);
    expect(result).toBeUndefined();
  });

  it("returns undefined for GitLab URL", () => {
    const url = "https://gitlab.com/user/repo.git";
    const result = parseAzureUrl(url);
    expect(result).toBeUndefined();
  });
});

describe("extractRepoName", () => {
  it("extracts repo name from _git suffix", () => {
    const url = "https://dev.azure.com/org/proj/_git/myrepo";
    const result = extractRepoName(url);
    expect(result).toBe("myrepo");
  });

  it("extracts repo name from SSH format", () => {
    const url = "git@ssh.dev.azure.com:v3/org/proj/myrepo";
    const result = extractRepoName(url);
    expect(result).toBe("myrepo");
  });

  it("returns undefined for non-Azure URL", () => {
    const url = "https://github.com/user/repo";
    const result = extractRepoName(url);
    expect(result).toBeUndefined();
  });
});

describe("parseRemoteLine", () => {
  it("parses git remote line with dev.azure.com URL", () => {
    const line = "origin\thttps://dev.azure.com/myorg/myproject/_git/myrepo (fetch)";
    const result = parseRemoteLine(line);
    expect(result).toEqual({
      organization: "myorg",
      project: "myproject",
      source: "origin",
      url: "https://dev.azure.com/myorg/myproject/_git/myrepo",
      repoName: "myrepo"
    });
  });

  it("parses git remote line with visualstudio.com URL", () => {
    const line = "upstream\thttps://myorg.visualstudio.com/myproject/_git/myrepo (push)";
    const result = parseRemoteLine(line);
    expect(result).toEqual({
      organization: "myorg",
      project: "myproject",
      source: "upstream",
      url: "https://myorg.visualstudio.com/myproject/_git/myrepo",
      repoName: "myrepo"
    });
  });

  it("returns undefined for GitHub remote", () => {
    const line = "origin\thttps://github.com/user/repo.git (fetch)";
    const result = parseRemoteLine(line);
    expect(result).toBeUndefined();
  });

  it("returns undefined for invalid line", () => {
    const line = "not a valid line";
    const result = parseRemoteLine(line);
    expect(result).toBeUndefined();
  });
});

describe("detectAzureInfoFromRepo", () => {
  it("returns empty array for non-existent path", async () => {
    const result = await detectAzureInfoFromRepo("/non/existent/path");
    expect(result).toEqual([]);
  });

  it("returns empty array for directory without git", async () => {
    const result = await detectAzureInfoFromRepo("/tmp");
    expect(result).toEqual([]);
  });
});
