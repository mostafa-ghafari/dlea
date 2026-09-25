import { describe, expect, it } from "vitest";
import { englishDigits, scopeLabels } from "@/lib/ai-coach-data";

describe("scopeLabels", () => {
  it("maps every coach scope to its Persian label", () => {
    expect(scopeLabels.daily).toBe("روزانه");
    expect(scopeLabels.weekly).toBe("هفتگی");
    expect(scopeLabels.monthly).toBe("ماهانه");
    expect(scopeLabels.yearly).toBe("سالانه");
  });
});

describe("englishDigits", () => {
  it("renders backend numbers with Latin digits", () => {
    expect(englishDigits("+$۱,۳۲۶")).toBe("+$1,326");
    expect(englishDigits("۶۲.۵٪")).toBe("62.5%");
    expect(englishDigits("۴ معامله ثبت شد")).toBe("4 معامله ثبت شد");
    expect(englishDigits("۱۴۸")).toBe("148");
  });

  it("keeps Latin text and symbols untouched", () => {
    expect(englishDigits("Win Rate: 60%")).toBe("Win Rate: 60%");
    expect(englishDigits("EURUSD")).toBe("EURUSD");
    expect(englishDigits("")).toBe("");
  });
});
