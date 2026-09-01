import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-CQV86vH5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
/**
* Typed API client for the Dlea Django backend.
*
* Every endpoint mirrors a named export that used to live in `mock-data.ts`,
* so pages can swap `import { trades } from "@/lib/mock-data"` for
* `const trades = useTrades()` with no other changes. All fetches happen in
* `useEffect`, so SSR renders keep working (they see empty defaults).
*/
var API_BASE = "https://dlea.piqagram.ir/api";
function getAccessToken() {
	try {
		return window.localStorage.getItem("dlea:access");
	} catch {
		return null;
	}
}
async function request(path, init) {
	const headers = {};
	if (!(init?.body instanceof FormData)) headers["Content-Type"] = "application/json";
	const token = getAccessToken();
	if (token) headers.Authorization = `Bearer ${token}`;
	const res = await fetch(`${API_BASE}/${path.replace(/^\//, "")}`, {
		headers,
		...init
	});
	if (!res.ok) {
		let detail = `API ${res.status}: ${path}`;
		try {
			const body = await res.json();
			if (body?.detail) detail = body.detail;
		} catch {}
		throw new Error(detail);
	}
	if (res.status === 204) return;
	const text = await res.text();
	if (!text) return void 0;
	const data = JSON.parse(text);
	if (data && typeof data === "object" && Array.isArray(data.results)) {
		if (Object.keys(data).every((k) => [
			"count",
			"next",
			"previous",
			"results"
		].includes(k))) return data.results;
	}
	return data;
}
function get(path) {
	return request(path);
}
function post(path, body) {
	return request(path, {
		method: "POST",
		body: body == null ? void 0 : JSON.stringify(body)
	});
}
function patch(path, body) {
	return request(path, {
		method: "PATCH",
		body: body == null ? void 0 : JSON.stringify(body)
	});
}
function del(path) {
	return request(path, { method: "DELETE" });
}
function put(path, body) {
	return request(path, {
		method: "PUT",
		body: body == null ? void 0 : JSON.stringify(body)
	});
}
/** POST with raw body (e.g. FormData for file uploads) — no Content-Type header. */
function postRaw(path, body) {
	return request(path, {
		method: "POST",
		body
	});
}
var fetchDashboard = () => get("dashboard/");
var fetchTrades = () => get("trades/");
var fetchPortfolios = () => get("portfolios/");
var fetchJournalGroups = () => get("journal/groups/");
var fetchJournalEntries = () => get("journal/entries/");
var fetchGoals = () => get("goals/");
var fetchAchievements = () => get("achievements/");
var fetchPlans = () => get("plans/");
var fetchAdminStats = () => get("admin/stats/");
var fetchAdminCharts = () => get("admin/charts/");
var fetchAdminAiApis = () => get("admin/ai-apis/");
var fetchUsers = (page = 1, pageSize = 20, search = "") => get(`admin/users/?page=${page}&page_size=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ""}`);
var fetchPayments = () => get("admin/payments/");
var fetchSubscription = async () => {
	return (await get("subscription/"))[0] ?? null;
};
var fetchAiInsights = () => get("coach/insights/");
var fetchCoachPeriods = () => get("coach/periods/");
function generateCoachReport(scope, model) {
	return post("coach/generate/", {
		scope,
		model
	});
}
var fetchNews = () => get("news/");
var fetchTickets = () => get("tickets/");
var fetchNotifications = () => get("notifications/");
var fetchAudit = () => get("audit/");
function createPortfolio(input) {
	return post("portfolios/", input);
}
function updatePortfolio(id, changes) {
	return patch(`portfolios/${id}/`, changes);
}
function deletePortfolio(id) {
	return del(`portfolios/${id}/`);
}
function bulkImportTrades(items) {
	return post("trades/import/", items);
}
function updateTrade(id, changes) {
	return patch(`trades/${id}/`, changes);
}
function updateTradeScreenshots(id, screenshots) {
	return updateTrade(id, { screenshots });
}
function updateUser(id, changes) {
	return patch(`admin/users/${id}/`, changes);
}
function deleteUser(id) {
	return del(`admin/users/${id}/`);
}
function createGoal(input) {
	return post("goals/", input);
}
function updateGoal(id, changes) {
	return patch(`goals/${id}/`, changes);
}
function deleteGoal(id) {
	return del(`goals/${id}/`);
}
function createJournalGroup(input) {
	return post("journal/groups/", input);
}
function renameJournalGroup(id, changes) {
	return patch(`journal/groups/${id}/`, changes);
}
function deleteJournalGroup(id) {
	return del(`journal/groups/${id}/`);
}
function createJournalEntry(input) {
	return post("journal/entries/", input);
}
function updateJournalEntry(id, changes) {
	return patch(`journal/entries/${id}/`, changes);
}
function updateJournalFavorite(id, favorite) {
	return updateJournalEntry(id, { favorite });
}
var fetchProfile = () => get("profile/");
async function updateProfile(data) {
	const { avatarFile, ...rest } = data;
	if (avatarFile) {
		const formData = new FormData();
		if (rest.firstName !== void 0) formData.append("firstName", rest.firstName);
		if (rest.lastName !== void 0) formData.append("lastName", rest.lastName);
		if (rest.phone !== void 0) formData.append("phone", rest.phone);
		formData.append("avatar", avatarFile);
		return postRaw("profile/", formData);
	}
	return put("profile/", rest);
}
function useApi(loader, deps = []) {
	const [data, setData] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(null);
	const [tick, setTick] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		let alive = true;
		setLoading(true);
		loader().then((d) => {
			if (!alive) return;
			setData(d);
			setError(null);
		}).catch((e) => {
			if (!alive) return;
			setError(String(e instanceof Error ? e.message : e));
		}).finally(() => {
			if (alive) setLoading(false);
		});
		return () => {
			alive = false;
		};
	}, [...deps, tick]);
	return {
		data,
		loading,
		error,
		reload: () => setTick((t) => t + 1)
	};
}
function useTrades() {
	return useApi(fetchTrades).data ?? [];
}
function usePortfolios() {
	return useApi(fetchPortfolios).data ?? [];
}
function useJournalEntries() {
	return useApi(fetchJournalEntries).data ?? [];
}
function useAchievements() {
	return useApi(fetchAchievements).data ?? [];
}
var ROLE_NAMES = {
	trader: "تریدر",
	professional: "حرفه‌ای",
	master: "استاد",
	admin: "مدیر",
	vip: "ویژه",
	"trader-vip": "تریدر ویژه",
	"professional-vip": "حرفه‌ای ویژه",
	"master-vip": "استاد ویژه"
};
var fetchRole = () => get("role/");
function useRole() {
	return useApi(fetchRole).data ?? null;
}
function usePlans() {
	return useApi(fetchPlans).data ?? [];
}
function useUsers() {
	return useApi(() => fetchUsers(1, 1e3)).data?.results ?? [];
}
function useSubscription() {
	return useApi(fetchSubscription).data;
}
function useProfile() {
	return useApi(fetchProfile).data;
}
function useAiInsights() {
	return useApi(fetchAiInsights).data;
}
function useDashboard() {
	return useApi(fetchDashboard).data;
}
var PLAN_LIMITS_MAP = {
	free: {
		slug: "free",
		maxPortfolios: 1,
		maxTradesPerMonth: 50,
		features: [
			"portfolios",
			"trades",
			"journal",
			"calendar",
			"goals",
			"achievements",
			"news",
			"support",
			"settings"
		]
	},
	pro: {
		slug: "pro",
		maxPortfolios: -1,
		maxTradesPerMonth: -1,
		features: [
			"portfolios",
			"trades",
			"journal",
			"calendar",
			"goals",
			"achievements",
			"news",
			"support",
			"settings",
			"ai-coach",
			"risk",
			"mt-connection",
			"reports"
		]
	},
	promax: {
		slug: "promax",
		maxPortfolios: -1,
		maxTradesPerMonth: -1,
		features: [
			"portfolios",
			"trades",
			"journal",
			"calendar",
			"goals",
			"achievements",
			"news",
			"support",
			"settings",
			"ai-coach",
			"risk",
			"mt-connection",
			"reports",
			"psychology"
		]
	},
	vip: {
		slug: "vip",
		maxPortfolios: -1,
		maxTradesPerMonth: -1,
		features: [
			"portfolios",
			"trades",
			"journal",
			"calendar",
			"goals",
			"achievements",
			"news",
			"support",
			"settings",
			"ai-coach",
			"risk",
			"mt-connection",
			"reports",
			"psychology"
		]
	}
};
/** Return the limits for the current subscription. Falls back to "free". */
function usePlanLimits() {
	return PLAN_LIMITS_MAP[useSubscription()?.plan?.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9-]/g, "") ?? "free"] ?? PLAN_LIMITS_MAP.free;
}
//#endregion
export { useUsers as $, get as A, updateUser as B, fetchPayments as C, fetchTickets as D, fetchProfile as E, updateJournalEntry as F, useJournalEntries as G, useAiInsights as H, updateJournalFavorite as I, usePortfolios as J, usePlanLimits as K, updatePortfolio as L, post as M, renameJournalGroup as N, fetchUsers as O, updateGoal as P, useTrades as Q, updateProfile as R, fetchNotifications as S, fetchPortfolios as T, useApi as U, useAchievements as V, useDashboard as W, useRole as X, useProfile as Y, useSubscription as Z, fetchCoachPeriods as _, createJournalEntry as a, fetchJournalGroups as b, del as c, deletePortfolio as d, deleteUser as f, fetchAudit as g, fetchAdminStats as h, createGoal as i, patch as j, generateCoachReport as k, deleteGoal as l, fetchAdminCharts as m, ROLE_NAMES as n, createJournalGroup as o, fetchAdminAiApis as p, usePlans as q, bulkImportTrades as r, createPortfolio as s, API_BASE as t, deleteJournalGroup as u, fetchGoals as v, fetchPlans as w, fetchNews as x, fetchJournalEntries as y, updateTradeScreenshots as z };
