import { describe, expect, it } from "vitest";

import {
  getReportMessages,
  getCliMessages,
  getMessages,
  replaceParams,
  formatReportDate,
  parseLocale,
  type Locale
} from "../../src/core/i18n.js";

describe("getReportMessages", () => {
  it("returns English messages for locale en", () => {
    const t = getReportMessages("en");
    expect(t.title).toBe("Activity Report");
    expect(t.period).toBe("Period");
    expect(t.generatedAt).toBe("Generated at");
    expect(t.overviewLinkedStories).toBe("Linked stories");
  });

  it("returns pt-BR messages for locale pt-BR", () => {
    const t = getReportMessages("pt-BR");
    expect(t.title).toBe("Relatório de Atividades");
    expect(t.period).toBe("Período");
    expect(t.generatedAt).toBe("Gerado em");
    expect(t.overviewLinkedStories).toBe("User stories vinculadas");
  });

  it("falls back to en for unknown locale key", () => {
    const t = getReportMessages("de" as Locale);
    expect(t.title).toBe("Activity Report");
  });
});

describe("getCliMessages", () => {
  it("returns English CLI messages for locale en", () => {
    const t = getCliMessages("en");
    expect(t.reportWritten).toBe("Report written to {path}");
    expect(t.noReportsFound).toContain("activity-report generate");
  });

  it("returns pt-BR CLI messages for locale pt-BR", () => {
    const t = getCliMessages("pt-BR");
    expect(t.reportWritten).toBe("Relatório salvo em {path}");
    expect(t.noReportsFound).toContain("activity-report generate");
  });

  it("includes tutorial messages for en and pt-BR", () => {
    const en = getCliMessages("en");
    expect(en.tutorialTitle).toBe("Quick start");
    expect(en.tutorialStepInit).toContain("activity-report init");
    const ptBR = getCliMessages("pt-BR");
    expect(ptBR.tutorialTitle).toBe("Início rápido");
    expect(ptBR.tutorialStepView).toContain("view");
  });
});

describe("getMessages", () => {
  it("returns both report and CLI keys for en", () => {
    const m = getMessages("en");
    expect(m.title).toBe("Activity Report");
    expect(m.reportWritten).toBe("Report written to {path}");
  });

  it("returns both report and CLI keys for pt-BR", () => {
    const m = getMessages("pt-BR");
    expect(m.title).toBe("Relatório de Atividades");
    expect(m.reportWritten).toBe("Relatório salvo em {path}");
  });
});

describe("replaceParams", () => {
  it("replaces single placeholder", () => {
    expect(replaceParams("Hello {name}", { name: "World" })).toBe("Hello World");
  });

  it("replaces multiple placeholders", () => {
    expect(
      replaceParams("Collected {commitCount} commits and {relatedCount} items", {
        commitCount: 10,
        relatedCount: 3
      })
    ).toBe("Collected 10 commits and 3 items");
  });

  it("replaces repeated placeholder", () => {
    expect(replaceParams("{x} and {x}", { x: "same" })).toBe("same and same");
  });

  it("returns original string when params empty", () => {
    expect(replaceParams("No params", {})).toBe("No params");
  });

  it("leaves unknown placeholders unchanged", () => {
    expect(replaceParams("Hello {name}", { other: "x" })).toBe("Hello {name}");
  });

  it("coerces number to string", () => {
    expect(replaceParams("Count: {n}", { n: 42 })).toBe("Count: 42");
  });
});

describe("parseLocale", () => {
  it("returns pt-BR for pt-br (lowercase)", () => {
    expect(parseLocale("pt-br")).toBe("pt-BR");
  });
  it("returns pt-BR for PT-BR (uppercase)", () => {
    expect(parseLocale("PT-BR")).toBe("pt-BR");
  });
  it("returns en for en (any case)", () => {
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("EN")).toBe("en");
  });
  it("returns undefined for empty or invalid", () => {
    expect(parseLocale(undefined)).toBeUndefined();
    expect(parseLocale("")).toBeUndefined();
    expect(parseLocale("  ")).toBeUndefined();
    expect(parseLocale("fr")).toBeUndefined();
  });
  it("accepts pt_br and normalizes to pt-BR", () => {
    expect(parseLocale("pt_br")).toBe("pt-BR");
  });
});

describe("formatReportDate", () => {
  it("formats ISO date in en locale", () => {
    const result = formatReportDate("2026-03-18T14:30:00.000Z", "en");
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\/2026/);
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it("formats ISO date in pt-BR locale", () => {
    const result = formatReportDate("2026-03-18T14:30:00.000Z", "pt-BR");
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\/2026/);
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});
