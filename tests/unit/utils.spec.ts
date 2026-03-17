import { describe, expect, it } from "vitest";
import { uniqueNumbers, slugify, extractSprintNumber, isContiguousRange, buildMultiSprintFolderName } from "../../src/core/utils.js";

describe("uniqueNumbers", () => {
  it("removes duplicate numbers", () => {
    const result = uniqueNumbers([1, 2, 2, 3, 3, 3]);
    expect(result).toEqual([1, 2, 3]);
  });

  it("returns empty array for empty input", () => {
    const result = uniqueNumbers([]);
    expect(result).toEqual([]);
  });

  it("preserves order of first occurrence", () => {
    const result = uniqueNumbers([3, 1, 2, 1, 3]);
    expect(result).toEqual([3, 1, 2]);
  });
});

describe("slugify", () => {
  it("converts spaces to hyphens", () => {
    const result = slugify("hello world");
    expect(result).toBe("hello-world");
  });

  it("converts to lowercase", () => {
    const result = slugify("HELLO WORLD");
    expect(result).toBe("hello-world");
  });

  it("removes leading and trailing hyphens", () => {
    const result = slugify("--hello world--");
    expect(result).toBe("hello-world");
  });

  it("handles multiple consecutive non-alphanumeric chars", () => {
    const result = slugify("hello!!!world");
    expect(result).toBe("hello-world");
  });

  it("handles sprint names", () => {
    const result = slugify("Features Sprint 12");
    expect(result).toBe("features-sprint-12");
  });
});

describe("extractSprintNumber", () => {
  it("extracts number from 'Sprint 12'", () => {
    const result = extractSprintNumber("Sprint 12");
    expect(result).toBe(12);
  });

  it("extracts number from 'sprint 12' (lowercase)", () => {
    const result = extractSprintNumber("sprint 12");
    expect(result).toBe(12);
  });

  it("extracts number from 'SPRINT 12' (uppercase)", () => {
    const result = extractSprintNumber("SPRINT 12");
    expect(result).toBe(12);
  });

  it("extracts number from 'Features Sprint 12'", () => {
    const result = extractSprintNumber("Features Sprint 12");
    expect(result).toBe(12);
  });

  it("extracts number from 'Sprint-12' (with hyphen)", () => {
    const result = extractSprintNumber("Sprint-12");
    expect(result).toBe(12);
  });

  it("extracts number from 'Sprint  12' (multiple spaces)", () => {
    const result = extractSprintNumber("Sprint  12");
    expect(result).toBe(12);
  });

  it("returns undefined for 'Hotfixes Sprint'", () => {
    const result = extractSprintNumber("Hotfixes Sprint");
    expect(result).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    const result = extractSprintNumber("");
    expect(result).toBeUndefined();
  });

  it("returns undefined for 'Iteration 3'", () => {
    const result = extractSprintNumber("Iteration 3");
    expect(result).toBeUndefined();
  });

  it("extracts first number if multiple present", () => {
    const result = extractSprintNumber("Sprint 12 - Task 45");
    expect(result).toBe(12);
  });
});

describe("isContiguousRange", () => {
  it("returns true for single number", () => {
    expect(isContiguousRange([5])).toBe(true);
  });

  it("returns true for contiguous ascending numbers", () => {
    expect(isContiguousRange([1, 2, 3, 4, 5])).toBe(true);
  });

  it("returns true for non-sorted contiguous numbers", () => {
    expect(isContiguousRange([5, 3, 4, 1, 2])).toBe(true);
  });

  it("returns false for non-contiguous numbers", () => {
    expect(isContiguousRange([1, 2, 4, 5])).toBe(false);
  });

  it("returns false for gap in range", () => {
    expect(isContiguousRange([38, 39, 40, 41, 43])).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(isContiguousRange([])).toBe(true);
  });
});

describe("buildMultiSprintFolderName", () => {
  it("builds range name for contiguous sprints", () => {
    const result = buildMultiSprintFolderName(["Sprint 38", "Sprint 39", "Sprint 40", "Sprint 41", "Sprint 42", "Sprint 43"]);
    expect(result).toBe("sprints-38-43");
  });

  it("builds sorted list for non-contiguous sprints", () => {
    const result = buildMultiSprintFolderName(["Sprint 43", "Sprint 41", "Sprint 39"]);
    expect(result).toBe("sprints-39-41-43");
  });

  it("handles single sprint", () => {
    const result = buildMultiSprintFolderName(["Sprint 43"]);
    expect(result).toBe("sprints-43");
  });

  it("handles non-standard sprint names", () => {
    const result = buildMultiSprintFolderName(["Custom Sprint"]);
    expect(result).toBe("multi-sprint");
  });
});
