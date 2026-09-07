import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  del,
  get,
  invalidateCache,
  patch,
  post,
  postRaw,
  put,
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
});
