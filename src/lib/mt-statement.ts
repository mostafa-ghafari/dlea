/**
 * MetaTrader statement parsing for the manual import flow.
 *
 * MT reports pack several grids into a single document — Positions, Orders and
 * Deals — and only *Positions* holds closed round-trips. The two other grids
 * look nearly identical (same Symbol/Type column pair and two timestamps), so
 * scraping every row and guessing "the last number is the profit" pulled order
 * rows in and dropped their SL/TP price into the PnL column. Everything here
 * is therefore driven by the header row, not by cell position.
 */
import * as XLSX from "xlsx";

export type ParsedTrade = {
  ticket: string;
  symbol: string;
  side: "buy" | "sell";
  volume: string;
  entry: string;
  exit: string;
  sl: string;
  tp: string;
  commission: string;
  swap: string;
  taxes: string;
  openTime: string;
  closeTime: string;
  profit: string;
};

/** Column indices resolved from a statement's header row. */
type ColumnMap = {
  openTime?: number;
  closeTime?: number;
  ticket?: number;
  symbol?: number;
  side?: number;
  volume?: number;
  entry?: number;
  exit?: number;
  sl?: number;
  tp?: number;
  commission?: number;
  swap?: number;
  taxes?: number;
  profit?: number;
};

/** Every header label we understand, used to recognise a header row. */
const KNOWN_LABELS = new Set([
  "time",
  "opentime",
  "closetime",
  "position",
  "order",
  "deal",
  "ticket",
  "symbol",
  "item",
  "instrument",
  "type",
  "volume",
  "size",
  "lots",
  "price",
  "sl",
  "stoploss",
  "tp",
  "takeprofit",
  "commission",
  "swap",
  "taxes",
  "fee",
  "profit",
  "state",
  "comment",
  "balance",
  "direction",
  "cost",
  "deposit",
  "withdrawal",
  "credit",
]);

const normalizeLabel = (v: string) =>
  v.toLowerCase().replace(/[\s/._\-()]+/g, "");

/** Symbol shapes MT statements use: EURUSD, XAUUSD, US30, EURUSD.a */
const SYMBOL_RE = /^[A-Za-z]{6}(\.[a-z]+)?$|^(XAUUSD|XAGUSD|US30|NAS100)/i;
const MT_TIME_RE = /\d{4}[./-]\d{2}[./-]\d{2}[ T]\d{2}:\d{2}/;

function looksLikeHeader(cells: string[]): boolean {
  let hits = 0;
  for (const c of cells) if (KNOWN_LABELS.has(normalizeLabel(c))) hits++;
  return hits >= 3;
}

/**
 * Map a header row to column indices.
 *
 * Returns null unless the row heads a closed-positions grid. A positions
 * header is the only one carrying a Profit column *and* an open/close pair, so
 * Orders (no Profit) and Deals (a single Time/Price) are rejected here and all
 * of their rows are then skipped.
 */
function headerToColumns(cells: string[]): ColumnMap | null {
  const map: ColumnMap = {};
  let times = 0;
  let prices = 0;

  cells.forEach((raw, i) => {
    switch (normalizeLabel(raw)) {
      case "time":
      case "opentime":
      case "closetime":
        if (times++ === 0) map.openTime = i;
        else if (times === 2) map.closeTime = i;
        return;
      case "position":
      case "order":
      case "deal":
      case "ticket":
        map.ticket ??= i;
        return;
      case "symbol":
      case "item":
      case "instrument":
        map.symbol ??= i;
        return;
      case "type":
        map.side ??= i;
        return;
      case "volume":
      case "size":
      case "lots":
        map.volume ??= i;
        return;
      case "price":
        if (prices++ === 0) map.entry = i;
        else if (prices === 2) map.exit = i;
        return;
      case "sl":
      case "stoploss":
        map.sl ??= i;
        return;
      case "tp":
      case "takeprofit":
        map.tp ??= i;
        return;
      case "commission":
        map.commission ??= i;
        return;
      case "swap":
        map.swap ??= i;
        return;
      case "taxes":
        map.taxes ??= i;
        return;
      case "profit":
        map.profit ??= i;
        return;
      default:
        return;
    }
  });

  if (map.profit === undefined) return null;
  if (map.symbol === undefined || map.side === undefined) return null;
  if (map.openTime === undefined || map.closeTime === undefined) return null;
  return map;
}

/** Split one CSV line, tolerating quoted fields and , ; or tab separators. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if ((ch === "," || ch === ";" || ch === "\t") && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/**
 * Turn an HTML statement into a grid, dropping MT's `class="hidden"` spacer
 * cells so the data columns line up with the header row (they otherwise shift
 * every value after the Type column by one).
 */
export function htmlToRows(html: string): string[][] {
  return (html.match(/<tr[\s\S]*?<\/tr>/gi) ?? []).map((tr) =>
    (tr.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? [])
      .filter((c) => !/class\s*=\s*["']hidden["']/i.test(c))
      .map((c) =>
        c
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim(),
      ),
  );
}

function csvToRows(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .map((l) => splitCsvLine(l));
}

/** Read the statement rows on the assumption the header lives somewhere in them. */
export function parseStatementRows(rows: string[][]): ParsedTrade[] {
  const number = (v: string) => Number(String(v).replace(/[^\d.-]/g, "")) || 0;
  const cell = (row: string[], i: number | undefined) =>
    i === undefined ? "" : (row[i] ?? "").trim();

  const trades: ParsedTrade[] = [];
  let cols: ColumnMap | null = null;

  rows.forEach((row) => {
    if (looksLikeHeader(row)) {
      cols = headerToColumns(row);
      return;
    }
    if (!cols) return;

    const symbol = cell(row, cols.symbol);
    const side = cell(row, cols.side).toLowerCase();
    if (!SYMBOL_RE.test(symbol)) return;
    if (side !== "buy" && side !== "sell") return;

    const openTime = cell(row, cols.openTime);
    const closeTime = cell(row, cols.closeTime);
    // Closed positions only — an open row has no close time yet.
    if (!MT_TIME_RE.test(openTime) || !MT_TIME_RE.test(closeTime)) return;

    const ticket = cell(row, cols.ticket);
    // Order rows pack both legs into one volume cell, e.g. "0.01 / 0.01".
    const volume = cell(row, cols.volume).split("/")[0] ?? "";

    trades.push({
      ticket: /^\d{6,}$/.test(ticket) ? ticket : "-",
      symbol: symbol.toUpperCase(),
      side,
      volume: String(number(volume)),
      entry: String(number(cell(row, cols.entry))),
      exit: String(number(cell(row, cols.exit))),
      sl: String(number(cell(row, cols.sl))),
      tp: String(number(cell(row, cols.tp))),
      commission: String(number(cell(row, cols.commission))),
      swap: String(number(cell(row, cols.swap))),
      taxes: String(number(cell(row, cols.taxes))),
      openTime,
      closeTime,
      profit: String(number(cell(row, cols.profit))),
    });
  });

  return trades;
}

/** Extract closed positions from a MetaTrader CSV or HTML statement. */
export function parseStatement(text: string, isHtml: boolean): ParsedTrade[] {
  return parseStatementRows(isHtml ? htmlToRows(text) : csvToRows(text));
}

/** Extract closed positions from a MetaTrader XLSX/XLS statement. */
export function parseWorkbook(buffer: ArrayBuffer): ParsedTrade[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const rows = (raw as unknown[][]).map((r) =>
    r.map((v) => (v == null ? "" : String(v))),
  );
  return parseStatementRows(rows);
}

/**
 * Read a statement file as text.
 *
 * MT5 writes its HTML report as UTF-16, which `File.text()` (always UTF-8)
 * turns into a document with no readable tags — so the BOM, or the NUL high
 * bytes of unpadded UTF-16, decides the decoder.
 */
export async function readStatementText(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let encoding: string | null = null;

  if (bytes[0] === 0xff && bytes[1] === 0xfe) encoding = "utf-16le";
  else if (bytes[0] === 0xfe && bytes[1] === 0xff) encoding = "utf-16be";
  else if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf)
    encoding = "utf-8";
  else {
    let zeros = 0;
    const n = Math.min(bytes.length, 1024);
    for (let i = 1; i < n; i += 2) if (bytes[i] === 0) zeros++;
    if (n > 8 && zeros > n / 4) encoding = "utf-16le";
  }

  if (!encoding) return file.text();
  try {
    return new TextDecoder(encoding).decode(bytes);
  } catch {
    return file.text();
  }
}

/** MetaTrader timestamps have no seconds — Django needs them. */
export function normalizeMtDate(raw: string): string {
  const cleaned = raw.replace(/\./g, "-").trim();
  const parts = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?/.exec(cleaned);
  if (!parts) return new Date().toISOString();
  return `${parts[1]}T${parts[2]}${parts[3] ?? ":00"}`;
}
