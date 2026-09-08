import { describe, expect, it } from "vitest";
import {
  buildJalaliMonthGrid,
  datePart,
  faDigitsToLatin,
  gregorianToJalali,
  jalaliDaysInMonth,
  jalaliToGregorian,
} from "@/lib/persian-calendar";

/**
 * Vectors captured from the backend's own `jdatetime` (6.1.0):
 * gregorianToJalali(gy,gm,gd) → [jy,jm,jd]
 */
const G2J: number[][] = [
  [2026, 3, 13, 1404, 12, 22],
  [2031, 1, 3, 1409, 10, 13],
  [2029, 2, 12, 1407, 11, 24],
  [2030, 1, 17, 1408, 10, 28],
  [2024, 1, 3, 1402, 10, 13],
  [2027, 7, 3, 1406, 4, 12],
  [2024, 2, 18, 1402, 11, 29],
  [2027, 1, 27, 1405, 11, 7],
  [2030, 2, 8, 1408, 11, 20],
  [2031, 11, 19, 1410, 8, 28],
  [2021, 10, 19, 1400, 7, 27],
  [2027, 1, 8, 1405, 10, 18],
  [2021, 9, 28, 1400, 7, 6],
  [2023, 5, 14, 1402, 2, 24],
  [2023, 9, 4, 1402, 6, 13],
  [2030, 5, 18, 1409, 2, 28],
  [2031, 3, 4, 1409, 12, 13],
  [2030, 10, 21, 1409, 7, 29],
  [2024, 6, 4, 1403, 3, 15],
  [2029, 12, 3, 1408, 9, 13],
  [2030, 1, 20, 1408, 11, 1],
  [2024, 8, 22, 1403, 6, 1],
  [2029, 7, 25, 1408, 5, 4],
  [2026, 8, 19, 1405, 5, 28],
  [2028, 6, 10, 1407, 3, 21],
  [2024, 3, 23, 1403, 1, 4],
  [2024, 2, 19, 1402, 11, 30],
  [2025, 9, 16, 1404, 6, 25],
  [2026, 12, 15, 1405, 9, 24],
  [2025, 10, 3, 1404, 7, 11],
];

/**
 * jalaliToGregorian(jy,jm,jd) → [gy,gm,gd]
 */
const J2G: number[][] = [
  [1401, 9, 14, 2022, 12, 5],
  [1403, 6, 5, 2024, 8, 26],
  [1413, 7, 2, 2034, 9, 24],
  [1400, 9, 19, 2021, 12, 10],
  [1408, 6, 23, 2029, 9, 13],
  [1409, 10, 16, 2031, 1, 6],
  [1412, 2, 27, 2033, 5, 16],
  [1400, 5, 16, 2021, 8, 7],
  [1400, 1, 24, 2021, 4, 13],
  [1407, 11, 19, 2029, 2, 7],
  [1412, 5, 23, 2033, 8, 13],
  [1410, 11, 12, 2032, 2, 1],
  [1398, 8, 12, 2019, 11, 3],
  [1403, 10, 4, 2024, 12, 24],
  [1413, 1, 7, 2034, 3, 27],
  [1407, 3, 24, 2028, 6, 13],
  [1405, 7, 13, 2026, 10, 5],
  [1413, 2, 6, 2034, 4, 26],
  [1412, 7, 18, 2033, 10, 9],
  [1406, 3, 27, 2027, 6, 17],
  [1411, 9, 9, 2032, 11, 29],
  [1411, 6, 22, 2032, 9, 12],
  [1410, 4, 5, 2031, 6, 26],
  [1400, 3, 5, 2021, 5, 26],
  [1405, 11, 8, 2027, 1, 28],
  [1398, 8, 27, 2019, 11, 18],
  [1403, 5, 10, 2024, 7, 31],
  [1398, 3, 14, 2019, 6, 4],
  [1415, 6, 20, 2036, 9, 10],
  [1408, 3, 23, 2029, 6, 12],
];

/**
 * (jy, jm) → [satOffset, daysInMonth, totalCells]
 */
const GRIDS: number[][] = [
  [1405, 6, 1, 31, 35],
  [1405, 8, 6, 30, 42],
  [1403, 12, 4, 30, 35],
  [1405, 1, 0, 31, 35],
  [1405, 5, 5, 31, 42],
  [1404, 12, 6, 29, 35],
  [1410, 1, 6, 31, 42],
  [1405, 12, 0, 29, 35],
  [1402, 12, 3, 29, 35],
  [1406, 1, 1, 31, 35],
  [1400, 12, 1, 29, 35],
];

describe("persian-calendar conversion", () => {
  it.each(G2J)(
    "gregorianToJalali(%i, %i, %i) matches jdatetime",
    (gy, gm, gd, jy, jm, jd) => {
      expect(gregorianToJalali(gy, gm, gd)).toEqual({
        year: jy,
        month: jm,
        day: jd,
      });
    },
  );

  it.each(J2G)(
    "jalaliToGregorian(%i, %i, %i) matches jdatetime",
    (jy, jm, jd, gy, gm, gd) => {
      expect(jalaliToGregorian(jy, jm, jd)).toEqual({
        year: gy,
        month: gm,
        day: gd,
      });
    },
  );

  it("round-trips a known date (today is 1405/06/17 = 2026-09-08)", () => {
    const j = gregorianToJalali(2026, 9, 8);
    expect(j).toEqual({ year: 1405, month: 6, day: 17 });
    const g = jalaliToGregorian(1405, 6, 17);
    expect(g).toEqual({ year: 2026, month: 9, day: 8 });
  });
});

describe("persian-calendar month grid", () => {
  it.each(GRIDS)(
    "month %i/%i builds offset=%i, %i days, %i cells",
    (jy, jm, offset, dim, total) => {
      expect(jalaliDaysInMonth(jy, jm)).toBe(dim);
      const grid = buildJalaliMonthGrid(jy, jm);
      expect(grid).toHaveLength(total);
      // Exactly `offset` leading nulls…
      expect(grid.slice(0, offset).every((c) => c === null)).toBe(true);
      // …then day 1..dim in order, then trailing nulls.
      expect(grid.slice(offset, offset + dim)).toEqual(
        Array.from({ length: dim }, (_, i) => i + 1),
      );
      expect(grid.slice(offset + dim).every((c) => c === null)).toBe(true);
    },
  );

  it("keeps the Saturday-first layout for the current month", () => {
    // 1405/06 (شهریور ۱۴۰۵) begins on a Tuesday (offset 1).
    const grid = buildJalaliMonthGrid(1405, 6);
    expect(grid[0]).toBeNull();
    expect(grid[1]).toBe(1);
    expect(grid).toHaveLength(35);
  });
});

describe("persian-calendar string helpers", () => {
  it("normalizes Persian digits in API date labels", () => {
    expect(faDigitsToLatin("۱۴۰۵/۰۶/۱۷ ۱۵:۳۰")).toBe("1405/06/17 15:30");
    expect(datePart("۱۴۰۵/۰۶/۱۷ ۱۵:۳۰")).toBe("1405/06/17");
    expect(datePart("1405/06/17 15:30")).toBe("1405/06/17");
  });
});
