import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  normalizeMtDate,
  parseStatement,
  parseWorkbook,
  readStatementText,
  splitCsvLine,
} from "@/lib/mt-statement";

/**
 * Mirrors the shape MT5 produces for one report: a single grid holding the
 * Positions, Orders and Deals tables, where every data row carries an empty
 * `class="hidden"` spacer cell that shifts the columns after `Type`.
 */
const MT5_HTML = `
<table cellspacing="1" cellpadding="3" border="0">
  <tr><th colspan="14"><div><b>Positions</b></div></th></tr>
  <tr>
    <td><b>Time</b></td><td><b>Position</b></td><td><b>Symbol</b></td><td><b>Type</b></td>
    <td><b>Volume</b></td><td><b>Price</b></td><td><b>S / L</b></td><td><b>T / P</b></td>
    <td><b>Time</b></td><td><b>Price</b></td><td><b>Commission</b></td><td><b>Swap</b></td>
    <td colspan="2"><b>Profit</b></td>
  </tr>
  <tr bgcolor="#FFFFFF" align="right">
    <td>2026.09.24 11:45:40</td><td>381458257</td><td>XAUUSD</td><td>buy</td>
    <td class="hidden" colspan="8"></td>
    <td>0.01</td><td>4268.29</td><td>4263.90</td><td>4273.02</td>
    <td>2026.09.24 11:53:28</td><td>4263.80</td><td>-0.16</td><td>0.00</td>
    <td colspan="2">-4.49</td>
  </tr>
  <tr bgcolor="#FFFFFF" align="right">
    <td>2026.09.24 21:21:11</td><td>381788347</td><td>XAUUSD</td><td>buy</td>
    <td class="hidden" colspan="8"></td>
    <td>0.01</td><td>4267.95</td><td>4262.63</td><td>4283.14</td>
    <td>2026.09.25 04:00:57</td><td>4283.36</td><td>-0.16</td><td>-0.63</td>
    <td colspan="2">15.41</td>
  </tr>
  <tr><th colspan="14"><div><b>Orders</b></div></th></tr>
  <tr>
    <td><b>Open Time</b></td><td><b>Order</b></td><td><b>Symbol</b></td><td><b>Type</b></td>
    <td><b>Volume</b></td><td><b>Price</b></td><td><b>S / L</b></td><td><b>T / P</b></td>
    <td><b>Time</b></td><td colspan="2"><b>State</b></td><td colspan="3"><b>Comment</b></td>
  </tr>
  <tr bgcolor="#FFFFFF" align="right">
    <td>2026.09.25 04:00:57</td><td>381872131</td><td>XAUUSD</td><td>sell</td>
    <td>0.01 / 0.01</td><td>4283.14</td><td></td><td></td>
    <td>2026.09.25 04:00:57</td><td colspan="2">filled</td><td colspan="3">[tp 4283.14]</td>
  </tr>
  <tr bgcolor="#FFFFFF" align="right">
    <td>2026.09.24 11:53:28</td><td>381463465</td><td>XAUUSD</td><td>sell</td>
    <td>0.01 / 0.01</td><td>4263.90</td><td></td><td></td>
    <td>2026.09.24 11:53:28</td><td colspan="2">filled</td><td colspan="3">[sl 4263.90]</td>
  </tr>
  <tr><th colspan="14"><div><b>Deals</b></div></th></tr>
  <tr>
    <td><b>Time</b></td><td><b>Deal</b></td><td><b>Symbol</b></td><td><b>Type</b></td><td><b>Direction</b></td>
    <td><b>Volume</b></td><td><b>Price</b></td><td><b>Order</b></td><td class="hidden"><b>Cost</b></td>
    <td><b>Commission</b></td><td><b>Fee</b></td><td><b>Swap</b></td><td><b>Profit</b></td>
    <td><b>Balance</b></td><td><b>Comment</b></td>
  </tr>
  <tr bgcolor="#FFFFFF" align="right">
    <td>2026.09.24 11:53:28</td><td>2</td><td>XAUUSD</td><td>buy</td><td>out</td>
    <td>0.01</td><td>4263.80</td><td>381463465</td><td class="hidden"></td>
    <td>-0.16</td><td>0.00</td><td>-0.63</td><td>-4.49</td><td>4283.36</td><td></td>
  </tr>
</table>
`;

describe("parseStatement", () => {
  it("reads only the closed positions out of an MT5 HTML report", () => {
    const trades = parseStatement(MT5_HTML, true);

    expect(trades.map((t) => t.ticket)).toEqual(["381458257", "381788347"]);
  });

  it("keeps the profit in the profit column instead of borrowing S/L or T/P", () => {
    const trades = parseStatement(MT5_HTML, true);

    expect(trades.map((t) => t.profit)).toEqual(["-4.49", "15.41"]);
    // 4283.14 is the second position's T/P and order 381872131's price — it
    // used to land in PnL once the Orders grid was scraped as trades.
    expect(trades.some((t) => t.profit === "4283.14")).toBe(false);
  });

  it("maps entry, exit and the stop levels", () => {
    const [first] = parseStatement(MT5_HTML, true);

    expect(first).toMatchObject({
      symbol: "XAUUSD",
      side: "buy",
      volume: "0.01",
      entry: "4268.29",
      exit: "4263.8",
      sl: "4263.9",
      tp: "4273.02",
      commission: "-0.16",
      swap: "0",
      openTime: "2026.09.24 11:45:40",
      closeTime: "2026.09.24 11:53:28",
    });
  });

  it("parses an MT4-style CSV by header name", () => {
    const csv = [
      "Ticket;Open Time;Type;Size;Item;Price;S / L;T / P;Close Time;Price;Commission;Taxes;Swap;Profit",
      "373827373;2026.09.04 15:00:36;sell;0.01;XAUUSD;4467.90;4460.00;4475.00;2026.09.04 15:01:51;4466.71;-0.16;0.00;0.00;1.19",
    ].join("\n");

    expect(parseStatement(csv, false)).toEqual([
      {
        ticket: "373827373",
        symbol: "XAUUSD",
        side: "sell",
        volume: "0.01",
        entry: "4467.9",
        exit: "4466.71",
        sl: "4460",
        tp: "4475",
        commission: "-0.16",
        swap: "0",
        taxes: "0",
        openTime: "2026.09.04 15:00:36",
        closeTime: "2026.09.04 15:01:51",
        profit: "1.19",
      },
    ]);
  });

  it("ignores an open position that has no close time yet", () => {
    const html = `
      <tr><td><b>Time</b></td><td><b>Position</b></td><td><b>Symbol</b></td><td><b>Type</b></td>
      <td><b>Volume</b></td><td><b>Price</b></td><td><b>S / L</b></td><td><b>T / P</b></td>
      <td><b>Time</b></td><td><b>Price</b></td><td><b>Commission</b></td><td><b>Swap</b></td>
      <td><b>Profit</b></td></tr>
      <tr><td>2026.09.25 09:00:00</td><td>9</td><td>EURUSD</td><td>buy</td>
      <td>0.10</td><td>1.10000</td><td></td><td></td><td></td><td></td><td>0.00</td>
      <td>0.00</td><td></td></tr>
    `;

    expect(parseStatement(html, true)).toEqual([]);
  });
});

describe("splitCsvLine", () => {
  it("keeps separators that live inside quotes", () => {
    expect(splitCsvLine('a;"b;c";d')).toEqual(["a", "b;c", "d"]);
  });
});

describe("parseWorkbook", () => {
  it("reads positions and skips the orders grid of an XLSX report", () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Trade History Report"],
      [],
      ["Positions"],
      [
        "Time",
        "Position",
        "Symbol",
        "Type",
        "Volume",
        "Price",
        "S / L",
        "T / P",
        "Time",
        "Price",
        "Commission",
        "Swap",
        "Profit",
      ],
      [
        "2026.09.04 15:00:36",
        "373827373",
        "XAUUSD",
        "sell",
        "0.01",
        "4467.90",
        "",
        "",
        "2026.09.04 15:01:51",
        "4466.71",
        "-0.16",
        "0.00",
        "1.19",
      ],
      [],
      ["Orders"],
      [
        "Open Time",
        "Order",
        "Symbol",
        "Type",
        "Volume",
        "Price",
        "S / L",
        "T / P",
        "Time",
        "State",
        "Comment",
      ],
      [
        "2026.09.25 04:00:57",
        "381872131",
        "XAUUSD",
        "sell",
        "0.01 / 0.01",
        "4283.14",
        "",
        "",
        "2026.09.25 04:00:57",
        "filled",
        "[tp 4283.14]",
      ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Report");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

    const trades = parseWorkbook(buffer as ArrayBuffer);

    expect(trades.map((t) => t.ticket)).toEqual(["373827373"]);
    expect(trades[0]).toMatchObject({
      profit: "1.19",
      entry: "4467.9",
      exit: "4466.71",
    });
  });
});

describe("readStatementText", () => {
  it("decodes the UTF-16 report MT5 exports", async () => {
    const ascii = "<tr><td>XAUUSD</td></tr>";
    const bytes = new Uint8Array(2 + ascii.length * 2);
    bytes[0] = 0xff;
    bytes[1] = 0xfe;
    for (let i = 0; i < ascii.length; i++) {
      bytes[2 + i * 2] = ascii.charCodeAt(i);
    }

    const file = new File([bytes], "ReportHis.html");
    await expect(readStatementText(file)).resolves.toContain("<tr>");
  });

  it("leaves plain UTF-8 alone", async () => {
    const file = new File(["<tr><td>XAUUSD</td></tr>"], "report.html");
    await expect(readStatementText(file)).resolves.toBe(
      "<tr><td>XAUUSD</td></tr>",
    );
  });
});

describe("normalizeMtDate", () => {
  it("rewrites MT dots and adds the missing seconds", () => {
    expect(normalizeMtDate("2026.09.24 11:45")).toBe("2026-09-24T11:45:00");
    expect(normalizeMtDate("2026.09.24 11:45:40")).toBe("2026-09-24T11:45:40");
  });
});
