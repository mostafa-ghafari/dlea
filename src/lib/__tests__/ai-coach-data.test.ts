import { describe, expect, it } from "vitest";
import { coachNumber, englishDigits, scopeLabels } from "@/lib/ai-coach-data";

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

describe("coachNumber", () => {
  it("moves a trailing dollar sign in front of the amount", () => {
    expect(coachNumber("+1,326$")).toBe("+$1,326");
    expect(coachNumber("-220$")).toBe("-$220");
    expect(coachNumber("+10$")).toBe("+$10");
  });

  it("handles stored rows that still carry Persian digits", () => {
    expect(coachNumber("+۱۰$")).toBe("+$10");
    expect(coachNumber("-۲۲۰$")).toBe("-$220");
    expect(coachNumber("۳۳.۳٪")).toBe("33.3%");
    expect(coachNumber("+$۱,۳۲۶")).toBe("+$1,326");
  });

  it("leaves already-correct money and non-money values alone", () => {
    expect(coachNumber("+$1,326")).toBe("+$1,326");
    expect(coachNumber("62.5%")).toBe("62.5%");
    expect(coachNumber("XAUUSD")).toBe("XAUUSD");
    expect(coachNumber("9")).toBe("9");
  });
});
