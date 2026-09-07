import "@testing-library/jest-dom/vitest";

// jsdom lacks fetch — tests that exercise the API client stub it per-test,
// but provide a loud default so accidental network calls fail visibly.
globalThis.fetch ??= (() => {
  throw new Error("fetch is not stubbed in this test — mock it explicitly");
}) as typeof fetch;

// Clean localStorage between tests
beforeEach(() => {
  window.localStorage.clear();
});
