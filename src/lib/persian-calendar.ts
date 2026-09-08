/**
 * Persian (Jalali) calendar helpers.
 *
 * The backend computes Jalali dates with the `jdatetime` package and builds
 * the trading-calendar grid with its JDF arithmetic (Saturday-first weeks).
 * These helpers mirror that exact math client-side so the UI can always draw
 * the month frame — even before/without a server response — and so it can
 * resolve the current Jalali year/month without an approximate conversion.
 */

export type JalaliDate = { year: number; month: number; day: number };

/** Days in Jalali months 1–12 (Esfand adjusted separately for leap years). */
const JALALI_MONTH_DAYS = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
/** Days in Gregorian months 1–12 (February adjusted for leap years). */
const GREGORIAN_MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** ۱۴۰۳/۰۸/۲۶ → 1403/08/26 (normalizes the Persian digits the API emits). */
export function faDigitsToLatin(input: string): string {
  return input.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

/** `1405/06/17 15:30` → `1405/06/17` (persian or latin digits). */
export function datePart(jalaliDateTime: string): string {
  return faDigitsToLatin(jalaliDateTime).split(" ")[0] ?? "";
}

/**
 * Jalali → Gregorian (JDF algorithm, identical to jdatetime.JalaliToGregorian).
 * Returns { year, month, day } of the resulting Gregorian date.
 */
export function jalaliToGregorian(
  jy: number,
  jm: number,
  jd: number,
): { year: number; month: number; day: number } {
  const j = jy - 979;
  let gDayNo =
    365 * j +
    Math.floor(j / 33) * 8 +
    Math.floor(((j % 33) + 3) / 4) +
    jd -
    1 +
    79;
  for (let i = 0; i < jm - 1; i++) gDayNo += JALALI_MONTH_DAYS[i];

  let gy = 1600 + 400 * Math.floor(gDayNo / 146097); // 146097 = 365*400 + 400/4 − 400/100 + 400/400
  gDayNo %= 146097;

  let leap = 1;
  if (gDayNo >= 36525) {
    // 36525 = 365*100 + 100/4
    gDayNo -= 1;
    gy += 100 * Math.floor(gDayNo / 36524); // 36524 = 365*100 + 100/4 − 100/100
    gDayNo %= 36524;
    if (gDayNo >= 365) {
      gDayNo += 1;
    } else {
      leap = 0;
    }
  }

  gy += 4 * Math.floor(gDayNo / 1461); // 1461 = 365*4 + 4/4
  gDayNo %= 1461;
  if (gDayNo >= 366) {
    leap = 0;
    gDayNo -= 1;
    gy += Math.floor(gDayNo / 365);
    gDayNo %= 365;
  }

  let i = 0;
  for (;;) {
    const monthLen = GREGORIAN_MONTH_DAYS[i] + (i === 1 && leap ? 1 : 0);
    if (gDayNo < monthLen) break;
    gDayNo -= monthLen;
    i++;
  }
  return { year: gy, month: i + 1, day: gDayNo + 1 };
}

/**
 * Gregorian → Jalali (JDF algorithm, identical to jdatetime.GregorianToJalali).
 */
export function gregorianToJalali(
  gy: number,
  gm: number,
  gd: number,
): JalaliDate {
  const g = gy - 1600;
  const gm0 = gm - 1;

  let jDayNo =
    365 * g +
    Math.floor((g + 3) / 4) -
    Math.floor((g + 99) / 100) +
    Math.floor((g + 399) / 400) +
    gd -
    1 -
    79;
  for (let i = 0; i < gm0; i++) jDayNo += GREGORIAN_MONTH_DAYS[i];
  if (gm0 > 1 && ((g % 4 === 0 && g % 100 !== 0) || g % 400 === 0)) {
    // Gregorian leap year and after February
    jDayNo += 1;
  }

  const jNp = Math.floor(jDayNo / 12053);
  jDayNo %= 12053;
  let jy = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);
  jDayNo %= 1461;
  if (jDayNo >= 366) {
    jDayNo -= 1;
    jy += Math.floor(jDayNo / 365);
    jDayNo %= 365;
  }

  let i = 0;
  let broke = false;
  for (; i < 11; i++) {
    if (jDayNo < JALALI_MONTH_DAYS[i]) {
      i -= 1;
      broke = true;
      break;
    }
    jDayNo -= JALALI_MONTH_DAYS[i];
  }
  // Python `for … in range(11)` keeps i at 10 on normal exit (Esfand).
  if (!broke) i = 10;

  return { year: jy, month: i + 2, day: jDayNo + 1 };
}

/** Gregorian Date (local calendar) → Jalali date. */
export function gregorianDateToJalali(date: Date): JalaliDate {
  return gregorianToJalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
}

/** Today, in the Jalali calendar (local time). */
export function todayJalali(): JalaliDate {
  return gregorianDateToJalali(new Date());
}

/** Number of days in the given Jalali year/month. */
export function jalaliDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 30;
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  // Esfand: 30 days iff (year,12,30) is a real date. In a 29-day year the JDF
  // arithmetic rolls (year,12,30) over to next year's Farvardin 1, so it
  // coincides with (year+1,1,1) — exactly how jdatetime distinguishes the two.
  const day30 = jalaliToGregorian(year, 12, 30);
  const nextNowruz = jalaliToGregorian(year + 1, 1, 1);
  const same =
    day30.year === nextNowruz.year &&
    day30.month === nextNowruz.month &&
    day30.day === nextNowruz.day;
  return same ? 29 : 30;
}

/**
 * Full trading-calendar grid for a Jalali year/month: every cell of the
 * Saturday-first weeks (leading/trailing `null` cells are grid padding).
 * Mirrors `CalendarDayViewSet` in the backend.
 */
export function buildJalaliMonthGrid(
  year: number,
  month: number,
): (number | null)[] {
  const first = jalaliToGregorian(year, month, 1);
  // Gregorian weekday, Monday=0 … Sunday=6 (same as Python's date.weekday()).
  const jsDay = new Date(
    Date.UTC(first.year, first.month - 1, first.day),
  ).getUTCDay(); // Sun=0 … Sat=6
  const pyWeekday = (jsDay + 6) % 7;
  // Saturday = column 0 … Friday = column 6.
  const satOffset = (((pyWeekday - 5) % 7) + 7) % 7;

  const dim = jalaliDaysInMonth(year, month);
  const total = Math.ceil((satOffset + dim) / 7) * 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < total; i++) {
    const day = i - satOffset + 1;
    cells.push(day >= 1 && day <= dim ? day : null);
  }
  return cells;
}

/** `1405/06/17` for {year:1405, month:6, day:17} (latin digits). */
export function formatJalaliDate(d: JalaliDate): string {
  return `${d.year}/${String(d.month).padStart(2, "0")}/${String(d.day).padStart(2, "0")}`;
}

const JALALI_MONTH_NAMES = [
  "",
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export const jalaliMonthName = (month: number): string =>
  JALALI_MONTH_NAMES[month] ?? "";
