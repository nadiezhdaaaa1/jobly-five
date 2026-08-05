import { describe, it, expect } from "vitest";
import { renderCoverLetter, buildAchievementsText, coverLetterPreview } from "@/lib/cover-letter";

const body = "<p>Hello {company} team,</p><p>the {role} role.</p><p>{Achievements}</p><p>Best regards,<br>{My name}</p>";

describe("cover letter", () => {
  it("fills tokens", () => {
    const out = renderCoverLetter(body, { company: "Acme", role: "PM", myName: "Ann Lee", achievements: "Speaking:\n• Talk" });
    expect(out).toContain("Hello Acme team,");
    expect(out).toContain("the PM role.");
    expect(out).toContain("• Talk");
    expect(out).toContain("Best regards,\nAnn Lee");
    expect(out).not.toMatch(/[{}]/);
  });
  it("drops empty achievements block and legacy tokens", () => {
    const out = renderCoverLetter("<p>Hi {hiring manager},</p><p>{Achievements}</p><p>{years} years</p>", { company: "A", role: "B", myName: "", achievements: "" });
    expect(out).toContain("Hi there,");
    expect(out).not.toContain("{");
  });
  it("builds achievements text", () => {
    const t = buildAchievementsText({ achievements: { speaking: [{ id: "1", description: "Talk", url: "", dates: "2024" }], conferences: [], publications: [], media: [], board: [], courses: [], awards: [] } as any, applyMode: "blocks", applyBlocks: ["speaking"] });
    expect(t).toBe("Speaking:\n• Talk (2024)");
    expect(buildAchievementsText({ achievements: {} as any, applyMode: "off", applyBlocks: ["speaking"] })).toBe("");
  });
  it("previews", () => {
    expect(coverLetterPreview(body, 20)).toContain("Hello {company}");
  });
});
