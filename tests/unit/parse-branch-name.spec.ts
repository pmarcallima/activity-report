import { describe, expect, it } from "vitest";

import { parseBranchName } from "../../src/infra/git/parse-branch-name.js";

describe("parseBranchName", () => {
  it("parses feature branches", () => {
    expect(parseBranchName("feature/12345_login-fix.testuser")).toEqual({
      raw: "feature/12345_login-fix.testuser",
      type: "feature",
      itemId: 12345,
      description: "login-fix",
      ownerSuffix: "testuser"
    });
  });

  it("parses hotfix branches", () => {
    expect(parseBranchName("hotfix/67890_timeout.testuser")?.type).toBe("hotfix");
  });

  it("returns undefined for ignored branch formats", () => {
    expect(parseBranchName("master")).toBeUndefined();
  });
});
