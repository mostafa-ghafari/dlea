import { describe, expect, it } from "vitest";
import { scopeLabels } from "@/lib/ai-coach-data";

describe("scopeLabels", () => {
  it("maps every coach scope to its Persian label", () => {
    expect(scopeLabels.daily).toBe("روزانه");
    expect(scopeLabels.weekly).toBe("هفتگی");
    expect(scopeLabels.monthly).toBe("ماهانه");
    expect(scopeLabels.yearly).toBe("سالانه");
  });
});
