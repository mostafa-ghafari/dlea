import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  confirmPaymentOrder,
  del,
  fetchPaymentHealth,
  fetchPaymentOrder,
  get,
  invalidateCache,
  patch,
  post,
  postRaw,
  put,
  runPaymentHealthCheck,
  startCheckout,
} from "@/lib/api";

const API_BASE = "http://localhost:8000/api";

function mockFetch(status = 200, body: unknown = {}) {
  const ok = status >= 200 && status < 300;
  const res = {
    ok,
    status,
    async json() {
      return body;
    },
    async text() {
      return typeof body === "string" ? body : JSON.stringify(body);
    },
  } as Response;
  const fn = vi.fn().mockResolvedValue(res);
  vi.stubGlobal("fetch", fn);
  return fn;
}

beforeEach(() => {
  invalidateCache(""); // wipe the module-level GET cache
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("GET caching", () => {
  it("serves a cached GET within the TTL without refetching", async () => {
    const fetchMock = mockFetch(200, [{ id: "1" }]);
    await get("trades/");
    await get("trades/");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE}/trades/`,
      expect.anything(),
    );
  });

  it("refetches after the 60s TTL expires", async () => {
    const nowSpy = vi.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000_000);
    const fetchMock = mockFetch(200, []);
    await get("trades/"); // caches with ts=1_000_000
    await Promise.resolve(); // flush the in-flight cleanup microtask
    nowSpy.mockReturnValue(1_061_000); // 61s later
    await get("trades/");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("deduplicates concurrent in-flight GETs", async () => {
    const fetchMock = mockFetch(200, [{ id: "1" }]);
    const [a, b] = [get("portfolios/"), get("portfolios/")];
    await Promise.all([a, b]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("invalidateCache evicts entries by prefix", async () => {
    const fetchMock = mockFetch(200, []);
    await get("trades/");
    await get("dashboard/");
    invalidateCache("trades");
    await get("trades/");
    await get("dashboard/");
    // trades/ refetched (evicted), dashboard/ still cached
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not cache failed GETs", async () => {
    const fetchMock = mockFetch(500, { detail: "boom" });
    await expect(get("trades/")).rejects.toThrow();
    // Second attempt must hit the network again
    await expect(get("trades/")).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("mutations", () => {
  it("sends JSON body and invalidates the matching GET cache", async () => {
    const fetchMock = mockFetch(201, { id: "9" });
    await get("trades/");
    await post("trades/", { symbol: "XAUUSD" });
    await get("trades/"); // must refetch — cache was invalidated
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const postCall = fetchMock.mock.calls[1];
    expect(postCall[0]).toBe(`${API_BASE}/trades/`);
    expect(postCall[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ symbol: "XAUUSD" }),
    });
  });

  it("adds the Bearer token from localStorage", async () => {
    window.localStorage.setItem("dlea:access", "tok-123");
    const fetchMock = mockFetch(200, []);
    await get("trades/");
    const [, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(init.headers).toMatchObject({ Authorization: "Bearer tok-123" });
  });

  it("sends raw FormData without a Content-Type header", async () => {
    const fetchMock = mockFetch(200, {});
    const fd = new FormData();
    fd.append("avatar", new Blob(["x"], { type: "image/png" }), "a.png");
    await postRaw("profile/", fd);
    const [, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(init.method).toBe("POST");
    expect(init.headers).not.toHaveProperty("Content-Type");
  });

  it("PATCH / PUT / DELETE pass the right methods", async () => {
    const fetchMock = mockFetch(200, {});
    await patch("trades/1/", { symbol: "EURUSD" });
    await put("role/", { role: "vip" });
    await del("trades/1/");
    const methods = fetchMock.mock.calls.map(([, init]) => init?.method);
    expect(methods).toEqual(["PATCH", "PUT", "DELETE"]);
  });
});

describe("response handling", () => {
  it("unwraps the DRF pagination wrapper", async () => {
    mockFetch(200, {
      count: 2,
      next: null,
      previous: null,
      results: [{ id: "1" }, { id: "2" }],
    });
    const data = await get("trades/");
    expect(data).toEqual([{ id: "1" }, { id: "2" }]);
  });

  it("keeps non-standard wrappers intact (admin users page)", async () => {
    mockFetch(200, {
      count: 1,
      page: 1,
      page_size: 20,
      results: [{ id: "1" }],
    });
    const data = await get<{ count: number; results: unknown[] }>(
      "admin/users/",
    );
    expect(data).toMatchObject({ count: 1, page: 1 });
  });

  it("returns undefined for 204 responses", async () => {
    mockFetch(204, "");
    expect(await del("trades/1/")).toBeUndefined();
  });

  it("throws the server detail on error responses", async () => {
    mockFetch(400, { detail: "پرتفولیوی نامعتبر است" });
    await expect(post("trades/", {})).rejects.toThrow("پرتفولیوی نامعتبر است");
  });

  it("falls back to a generic message for non-JSON errors", async () => {
    mockFetch(500, "Internal Server Error");
    await expect(get("dashboard/")).rejects.toThrow("API 500: dashboard/");
  });

  it("names a gateway timeout instead of the path it was asked for", async () => {
    // What nginx answers once proxy_read_timeout expires: HTML, not DRF's JSON.
    mockFetch(
      504,
      "<html><head><title>504 Gateway Time-out</title></head></html>",
    );
    const error = await post("coach/generate/", { scope: "weekly" }).catch(
      (e) => e,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(504);
    expect(error.gateway).toBe(true);
    // The path on its own is what made this unfixable from the user's side.
    expect(error.message).not.toContain("API 504");
    expect(error.message).toContain("۵۰۴");
  });

  it("keeps the app's own 502 detail, which is not a gateway failure", async () => {
    // The view answers a Gemini failure with 502 *and* a Persian detail. The
    // detail has to win, or a real and actionable error would be reported as a
    // proxy timeout — and the coach would tell the user to refresh instead.
    mockFetch(502, { detail: "Gemini (relay 1) مهلت انتظار تمام شد" });
    const error = await post("coach/generate/", { scope: "weekly" }).catch(
      (e) => e,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error.gateway).toBe(false);
    expect(error.message).toBe("Gemini (relay 1) مهلت انتظار تمام شد");
  });

  it("does not mistake a plain 500 for a gateway", async () => {
    mockFetch(500, "Internal Server Error");
    const error = await get("dashboard/").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.gateway).toBe(false);
  });
});

describe("payment gateway", () => {
  it("opens a checkout session for the chosen plan and cycle", async () => {
    const fetchMock = mockFetch(200, {
      paymentId: 7,
      paymentUrl: "https://gateway.zibal.ir/start/15966442233311",
    });
    const session = await startCheckout("promax", "yearly");
    expect(session.paymentUrl).toContain("gateway.zibal.ir");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${API_BASE}/billing/checkout/`);
    expect(init.body).toBe(JSON.stringify({ plan: "promax", cycle: "yearly" }));
  });

  it("surfaces the gateway's own refusal message to the buyer", async () => {
    mockFetch(400, { detail: "آدرس بازگشت نامعتبر است" });
    await expect(startCheckout("pro", "monthly")).rejects.toThrow(
      "آدرس بازگشت نامعتبر است",
    );
  });

  it("asks the gateway again about a pending order", async () => {
    const fetchMock = mockFetch(200, {
      id: 7,
      status: "موفق",
      referenceId: "778899",
    });
    const order = await confirmPaymentOrder(7);
    expect(order.status).toBe("موفق");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${API_BASE}/billing/orders/7/`);
    expect(init.method).toBe("POST");
  });

  it("re-reads an order after it was confirmed (cache not reused)", async () => {
    mockFetch(200, { id: 7, status: "در انتظار" });
    await fetchPaymentOrder(7);
    mockFetch(200, { id: 7, status: "موفق" });
    await confirmPaymentOrder(7); // invalidates `billing/orders/7`
    const after = await fetchPaymentOrder(7);
    expect(after.status).toBe("موفق");
  });
});

describe("admin payment health", () => {
  const report = {
    checkedAt: "2026-09-15T12:00:00+00:00",
    live: false,
    sandbox: true,
    merchant: "ziba*",
    callbackUrl: "https://dlea.piqagram.ir/api/billing/callback/",
    amounts: {
      minRial: 1000,
      maxRial: 4_000_000_000,
      minToman: 100,
      maxToman: 400_000_000,
    },
    summary: { passed: 3, failed: 0, warned: 2, skipped: 1 },
    checks: [
      { id: "gateway", title: "اتصال به درگاه", status: "skipped", detail: "" },
    ],
    plans: [],
    orders: {
      pending: 0,
      stuck: 0,
      failedRecent: 0,
      failedWindowDays: 2,
      recentFailed: [],
      oldestStuck: null,
      lastPaid: null,
    },
    codes: [{ code: 106, message: "آدرس بازگشت نامعتبر است" }],
  };

  it("reads the offline snapshot without calling the gateway", async () => {
    const fetchMock = mockFetch(200, report);
    const data = await fetchPaymentHealth();
    expect(data.summary.warned).toBe(2);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${API_BASE}/admin/payment-health/`);
    expect(init.method ?? "GET").toBe("GET");
    expect(data.codes[0].code).toBe(106);
  });

  it("runs the live check with a POST and returns the same shape", async () => {
    const fetchMock = mockFetch(200, {
      ...report,
      live: true,
      summary: { passed: 8, failed: 0, warned: 2, skipped: 0 },
    });
    const data = await runPaymentHealthCheck();
    expect(data.live).toBe(true);
    expect(data.summary.passed).toBe(8);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${API_BASE}/admin/payment-health/`);
    expect(init.method).toBe("POST");
  });

  it("keeps a non-admin out with the server's message", async () => {
    mockFetch(403, { detail: "شما به این بخش دسترسی ندارید" });
    await expect(fetchPaymentHealth()).rejects.toThrow(
      "شما به این بخش دسترسی ندارید",
    );
  });
});
