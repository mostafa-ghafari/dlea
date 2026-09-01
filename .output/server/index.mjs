globalThis.__nitro_main__ = import.meta.url;
import { i as serve, r as NodeResponse } from "./_libs/h3-v2+rou3+srvx.mjs";
import { a as toEventHandler, i as defineLazyEventHandler, n as HTTPError, r as defineHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { i as withoutTrailingSlash, n as joinURL, r as withLeadingSlash, t as decodePath } from "./_libs/ufo.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/assets/admin-context-BdfrVGyO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"82e4-9HJ3piWJrxbyio/DHQ8onuHE2oE\"",
		"mtime": "2026-08-30T09:49:34.729Z",
		"size": 33508,
		"path": "../public/assets/admin-context-BdfrVGyO.js"
	},
	"/assets/app-B7l15SCl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8d-EUECtZPaytDbJB+V/YWtnE0R6C0\"",
		"mtime": "2026-08-30T09:49:34.738Z",
		"size": 141,
		"path": "../public/assets/app-B7l15SCl.js"
	},
	"/favicon.png": {
		"type": "image/png",
		"etag": "\"6a7-NERBkAA4h8v+p0B2dczcK61+lkk\"",
		"mtime": "2026-08-28T13:23:02.051Z",
		"size": 1703,
		"path": "../public/favicon.png"
	},
	"/assets/app.achievements-Er94wFxc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a48-T0YsJ5i8qoABdVH7/UMAtU4/iYA\"",
		"mtime": "2026-08-30T09:49:34.742Z",
		"size": 6728,
		"path": "../public/assets/app.achievements-Er94wFxc.js"
	},
	"/assets/app.admin-BSsVq4MH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8fe-CpHZPr3EYZJmYIM5/+OhuVyXdyA\"",
		"mtime": "2026-08-30T09:49:34.744Z",
		"size": 2302,
		"path": "../public/assets/app.admin-BSsVq4MH.js"
	},
	"/assets/app.admin.apis-DSYGTbc4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"99b-XtTgMytGbZ9cPXfIS82EHGtkO7o\"",
		"mtime": "2026-08-30T09:49:34.753Z",
		"size": 2459,
		"path": "../public/assets/app.admin.apis-DSYGTbc4.js"
	},
	"/assets/app.admin.audit-DdaZr-P6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f-653GUt0C0MgUniyCWOhc96zFlLQ\"",
		"mtime": "2026-08-30T09:49:34.756Z",
		"size": 79,
		"path": "../public/assets/app.admin.audit-DdaZr-P6.js"
	},
	"/assets/app.admin.dashboard-BSQgtOQL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f-1BJcfK1GEQSNp3AhQ5GBI/BoPKo\"",
		"mtime": "2026-08-30T09:49:34.760Z",
		"size": 79,
		"path": "../public/assets/app.admin.dashboard-BSQgtOQL.js"
	},
	"/assets/app.admin.logs-ZMzzAZYq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c70-9Isn6sIabAvreQxvxF9WYgTp1AI\"",
		"mtime": "2026-08-30T09:49:34.770Z",
		"size": 3184,
		"path": "../public/assets/app.admin.logs-ZMzzAZYq.js"
	},
	"/assets/app.admin.news-CNVha3Jm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f-rAOFkLGa8HUV0edD+Lh+vT8GvFY\"",
		"mtime": "2026-08-30T09:49:34.773Z",
		"size": 79,
		"path": "../public/assets/app.admin.news-CNVha3Jm.js"
	},
	"/assets/app.admin.payments-DkShJZ__.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c83-WnycyM48KDY6KCerkZ+7xvITLGI\"",
		"mtime": "2026-08-30T09:49:34.775Z",
		"size": 3203,
		"path": "../public/assets/app.admin.payments-DkShJZ__.js"
	},
	"/assets/app.admin.plans-B9HVFb2V.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f-ktlID2qu7fXFbqWGENBdL9qA2tE\"",
		"mtime": "2026-08-30T09:49:34.776Z",
		"size": 79,
		"path": "../public/assets/app.admin.plans-B9HVFb2V.js"
	},
	"/assets/app.admin.tickets-Hr7lxmhG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f-/y02OY1BwpHW1hLSv/QJw0SswA4\"",
		"mtime": "2026-08-30T09:49:34.777Z",
		"size": 79,
		"path": "../public/assets/app.admin.tickets-Hr7lxmhG.js"
	},
	"/assets/app.admin.users-DNz5iKco.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f-Uo7FP3CaK2TDO5VVMJj+O4zpNIM\"",
		"mtime": "2026-08-30T09:49:34.777Z",
		"size": 79,
		"path": "../public/assets/app.admin.users-DNz5iKco.js"
	},
	"/assets/app.ai-coach-CGBgeziC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2fd0-dxMJpTz1HbUse1h7P26Tih/bK9o\"",
		"mtime": "2026-08-30T09:49:34.778Z",
		"size": 12240,
		"path": "../public/assets/app.ai-coach-CGBgeziC.js"
	},
	"/assets/app.billing-vboDBUtB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1319-G2+waeFqipSWzswtYFJWS5YpT7g\"",
		"mtime": "2026-08-30T09:49:34.778Z",
		"size": 4889,
		"path": "../public/assets/app.billing-vboDBUtB.js"
	},
	"/assets/app.calendar-f7328kQd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fc3-Q+W3oP08GxxhfMdvW1pHfh3v8C8\"",
		"mtime": "2026-08-30T09:49:34.779Z",
		"size": 4035,
		"path": "../public/assets/app.calendar-f7328kQd.js"
	},
	"/assets/app.dashboard-BdJdSNtQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9c2e-4gEsx76beM2cqp/xrTPRwZjliXU\"",
		"mtime": "2026-08-30T09:49:34.779Z",
		"size": 39982,
		"path": "../public/assets/app.dashboard-BdJdSNtQ.js"
	},
	"/assets/app.goals-BgPi4zU_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"18ec-QNkxa0o9Ry9j1iFbbscprsT2G6I\"",
		"mtime": "2026-08-30T09:49:34.792Z",
		"size": 6380,
		"path": "../public/assets/app.goals-BgPi4zU_.js"
	},
	"/assets/app.journal-s0TgEVYo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4a01-Umpuwa4jiTp+PaDI5wRUtFL7Cpc\"",
		"mtime": "2026-08-30T09:49:34.793Z",
		"size": 18945,
		"path": "../public/assets/app.journal-s0TgEVYo.js"
	},
	"/assets/app.news.index-CdWoXc89.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"722-EU9fhmUG9W2jSulYYMaEnCJt6y4\"",
		"mtime": "2026-08-30T09:49:34.908Z",
		"size": 1826,
		"path": "../public/assets/app.news.index-CdWoXc89.js"
	},
	"/assets/app.news._id-OXHQQz7v.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"72d-v+uTEMNaokJcm5Yf6HazGiljlkw\"",
		"mtime": "2026-08-30T09:49:34.908Z",
		"size": 1837,
		"path": "../public/assets/app.news._id-OXHQQz7v.js"
	},
	"/assets/app.portfolios-12em6qK7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3729-K3de72YD0bqbTXroXGqNEd+KF4g\"",
		"mtime": "2026-08-30T09:49:34.909Z",
		"size": 14121,
		"path": "../public/assets/app.portfolios-12em6qK7.js"
	},
	"/assets/app.risk-NbOOnsip.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"bce-ZGYnPijz0IkITInodZSJaYxcb9U\"",
		"mtime": "2026-08-30T09:49:34.910Z",
		"size": 3022,
		"path": "../public/assets/app.risk-NbOOnsip.js"
	},
	"/assets/app.settings-DMfbdkW-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3c1c-jkgGPVhBXb/NKDZDaMlYKQ7aELw\"",
		"mtime": "2026-08-30T09:49:34.910Z",
		"size": 15388,
		"path": "../public/assets/app.settings-DMfbdkW-.js"
	},
	"/assets/app.support-CnkbInz_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"18e9-aBDaLe7p3vy7YeOWJw9G3AZkc1Y\"",
		"mtime": "2026-08-30T09:49:34.911Z",
		"size": 6377,
		"path": "../public/assets/app.support-CnkbInz_.js"
	},
	"/assets/app.trades.index-BrsFZNTz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2257-vmJDGR3xJuzVC6kn0uJxwdiD8Pw\"",
		"mtime": "2026-08-30T09:49:34.912Z",
		"size": 8791,
		"path": "../public/assets/app.trades.index-BrsFZNTz.js"
	},
	"/assets/app.trades.new-CM6q0e2T.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"35ef-AOfCa4JkVdiTqJIBZn4uxRAiVg0\"",
		"mtime": "2026-08-30T09:49:34.918Z",
		"size": 13807,
		"path": "../public/assets/app.trades.new-CM6q0e2T.js"
	},
	"/assets/app.trades._id-DEabved_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12ca-GJp7MthKOI2Jr/ZG0N3CXxeSHfU\"",
		"mtime": "2026-08-30T09:49:34.911Z",
		"size": 4810,
		"path": "../public/assets/app.trades._id-DEabved_.js"
	},
	"/assets/AppShell-CbrEATbo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"98d3-068a58q7aQa/PUQspkmKJa9WU9E\"",
		"mtime": "2026-08-30T09:49:34.719Z",
		"size": 39123,
		"path": "../public/assets/AppShell-CbrEATbo.js"
	},
	"/assets/AreaChart-CMzae3_U.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5cea8-2a/880iB7dB1r4CER2y9AnVm6KU\"",
		"mtime": "2026-08-30T09:49:34.727Z",
		"size": 380584,
		"path": "../public/assets/AreaChart-CMzae3_U.js"
	},
	"/assets/badge-OmP0mgCd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"305-uKKXYmGRczbFHSOOBeCaoqpKgZo\"",
		"mtime": "2026-08-30T09:49:34.918Z",
		"size": 773,
		"path": "../public/assets/badge-OmP0mgCd.js"
	},
	"/assets/brain-U_NYURYA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"237-dzsaN6q2EOEnrbkWoYVbO1Jfe3A\"",
		"mtime": "2026-08-30T09:49:34.919Z",
		"size": 567,
		"path": "../public/assets/brain-U_NYURYA.js"
	},
	"/assets/calendar-clock-wkmUSr_J.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"170-TilCjtFbtKhCw11wF68FkSBgBV0\"",
		"mtime": "2026-08-30T09:49:34.920Z",
		"size": 368,
		"path": "../public/assets/calendar-clock-wkmUSr_J.js"
	},
	"/assets/button-Db0S5CHX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8164-5iucyou+3fWebkRZG+gq2SKX4Ms\"",
		"mtime": "2026-08-30T09:49:34.920Z",
		"size": 33124,
		"path": "../public/assets/button-Db0S5CHX.js"
	},
	"/assets/chart-column-CL2di76T.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f1-+BFTomfMDvAuhJlj7TO+fZU/S2g\"",
		"mtime": "2026-08-30T09:49:34.921Z",
		"size": 241,
		"path": "../public/assets/chart-column-CL2di76T.js"
	},
	"/assets/chart-line-0QCMEc5r.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11e-OuRR65WPWw5NMmCsLgUAmezAGCA\"",
		"mtime": "2026-08-30T09:49:34.921Z",
		"size": 286,
		"path": "../public/assets/chart-line-0QCMEc5r.js"
	},
	"/assets/chevron-left-DSNOqyQp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"78-9jbpvHU2I66QKxS8YxgnuIuTLuI\"",
		"mtime": "2026-08-30T09:49:34.922Z",
		"size": 120,
		"path": "../public/assets/chevron-left-DSNOqyQp.js"
	},
	"/assets/chevron-right-DUuRm21Q.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12d-iegKUwSvvKezsP/4OWoLUQ7GCug\"",
		"mtime": "2026-08-30T09:49:34.922Z",
		"size": 301,
		"path": "../public/assets/chevron-right-DUuRm21Q.js"
	},
	"/assets/circle-check-PN-8UF9K.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a8-kh+Dzkf9xSCkpsKUHZQdiUGTwaw\"",
		"mtime": "2026-08-30T09:49:34.922Z",
		"size": 168,
		"path": "../public/assets/circle-check-PN-8UF9K.js"
	},
	"/assets/circle-x-WoCBjgwf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c5-LeqLas/374erGpoyKz1BCK8Cwzk\"",
		"mtime": "2026-08-30T09:49:34.923Z",
		"size": 197,
		"path": "../public/assets/circle-x-WoCBjgwf.js"
	},
	"/assets/contact-c_3j8I3y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c9f-+l7uOvOq9hGCjQzVdsQYLAo1n88\"",
		"mtime": "2026-08-30T09:49:34.923Z",
		"size": 3231,
		"path": "../public/assets/contact-c_3j8I3y.js"
	},
	"/assets/copy-C1OVEiYR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e2-5c18OgC7MF5Wy8Bp1Zw28u4/X2g\"",
		"mtime": "2026-08-30T09:49:34.924Z",
		"size": 226,
		"path": "../public/assets/copy-C1OVEiYR.js"
	},
	"/assets/cpu-CHy141WA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"278-n35s+KbNibEcjZbClwP4st7KGLo\"",
		"mtime": "2026-08-30T09:49:34.924Z",
		"size": 632,
		"path": "../public/assets/cpu-CHy141WA.js"
	},
	"/assets/dist-C2943KPl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4b9-FngOqmEYYVbUWuKF9b/wqzoOg4g\"",
		"mtime": "2026-08-30T09:49:34.925Z",
		"size": 1209,
		"path": "../public/assets/dist-C2943KPl.js"
	},
	"/assets/download-BWUNJf7l.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"de-VZTeipCa2Va0Elzos/0eX9qdCmw\"",
		"mtime": "2026-08-30T09:49:34.925Z",
		"size": 222,
		"path": "../public/assets/download-BWUNJf7l.js"
	},
	"/assets/dropdown-menu-CyRRCPrv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1751b-K+M88WrgmyK0pRMzY0JaaTMa2RU\"",
		"mtime": "2026-08-30T09:49:34.926Z",
		"size": 95515,
		"path": "../public/assets/dropdown-menu-CyRRCPrv.js"
	},
	"/assets/ellipsis-vertical-Dug-cE9Z.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e1-xqKxjc6HswwOJLJ8UEiYGT7B/Qc\"",
		"mtime": "2026-08-30T09:49:34.926Z",
		"size": 225,
		"path": "../public/assets/ellipsis-vertical-Dug-cE9Z.js"
	},
	"/assets/forgot-password-DNdoXPcM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e9a-4aR3a5DMvxoCK374y0+jFPjMIdA\"",
		"mtime": "2026-08-30T09:49:34.927Z",
		"size": 7834,
		"path": "../public/assets/forgot-password-DNdoXPcM.js"
	},
	"/assets/funnel-DwulYXii.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f6-MtK+9qJNlVZ9z+wWGglMpT4fTsg\"",
		"mtime": "2026-08-30T09:49:34.927Z",
		"size": 246,
		"path": "../public/assets/funnel-DwulYXii.js"
	},
	"/assets/image-plus-CIAitrxM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"161-rtCPAwteYeIEbADaD68SyH+fOZU\"",
		"mtime": "2026-08-30T09:49:34.928Z",
		"size": 353,
		"path": "../public/assets/image-plus-CIAitrxM.js"
	},
	"/assets/images-BhLjrIXW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"168-e5I5au0EEAs4o1C2z0deWQ63Aw4\"",
		"mtime": "2026-08-30T09:49:34.928Z",
		"size": 360,
		"path": "../public/assets/images-BhLjrIXW.js"
	},
	"/assets/ImageUploader-Csuxdx81.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a98-iJVH7WHH+Wux/ja1NN/3wR5GKZQ\"",
		"mtime": "2026-08-30T09:49:34.727Z",
		"size": 2712,
		"path": "../public/assets/ImageUploader-Csuxdx81.js"
	},
	"/assets/jsx-runtime-B-hcVAMW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"216d-pcqlp1Bv4Kt7yFmWJlJC8xMXx/k\"",
		"mtime": "2026-08-30T09:49:34.929Z",
		"size": 8557,
		"path": "../public/assets/jsx-runtime-B-hcVAMW.js"
	},
	"/assets/index-MmloLDTa.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"59dba-iD1Z3GoVpVhj3Pk+Ty0u9K4TgnI\"",
		"mtime": "2026-08-30T09:49:34.718Z",
		"size": 368058,
		"path": "../public/assets/index-MmloLDTa.js"
	},
	"/assets/label-BmEzWiQ0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2ae-1phX52+gQl2jTI3FpJGrH6JlCU4\"",
		"mtime": "2026-08-30T09:49:34.930Z",
		"size": 686,
		"path": "../public/assets/label-BmEzWiQ0.js"
	},
	"/assets/LegalPage-BpEbxiTD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"777-DlXaefPies0+m2vh2pJn0uLu0bc\"",
		"mtime": "2026-08-30T09:49:34.727Z",
		"size": 1911,
		"path": "../public/assets/LegalPage-BpEbxiTD.js"
	},
	"/assets/link-2-CWA7sSNt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e8-twcRNhNt4/JFtakWakpcN+vIW5A\"",
		"mtime": "2026-08-30T09:49:34.932Z",
		"size": 232,
		"path": "../public/assets/link-2-CWA7sSNt.js"
	},
	"/assets/link-WwjdOzIl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4c14-QIaqKu1PFJk0l7PTts+18cU/bU4\"",
		"mtime": "2026-08-30T09:49:34.933Z",
		"size": 19476,
		"path": "../public/assets/link-WwjdOzIl.js"
	},
	"/assets/loader-circle-Dx783sIY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"86-0H+v0bqC1Dv3pRaIRpPdnhZt+YE\"",
		"mtime": "2026-08-30T09:49:34.933Z",
		"size": 134,
		"path": "../public/assets/loader-circle-Dx783sIY.js"
	},
	"/assets/lock-Cq60WGuy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c4-NYOMh1uDFBdfOrX+SrmF/JQ/12I\"",
		"mtime": "2026-08-30T09:49:34.934Z",
		"size": 196,
		"path": "../public/assets/lock-Cq60WGuy.js"
	},
	"/assets/login-lXupypPG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16df-DJDvlDbKR1T+nugG01S4fhYjoBg\"",
		"mtime": "2026-08-30T09:49:34.934Z",
		"size": 5855,
		"path": "../public/assets/login-lXupypPG.js"
	},
	"/assets/mail-1yaCbcTE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cb-3bResoLQo00iAALzXB+EiI6WOjk\"",
		"mtime": "2026-08-30T09:49:34.934Z",
		"size": 203,
		"path": "../public/assets/mail-1yaCbcTE.js"
	},
	"/assets/Match-q2162X3P.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"113f-ONcATk7VFotEapQ2mf3J2H99/yo\"",
		"mtime": "2026-08-30T09:49:34.728Z",
		"size": 4415,
		"path": "../public/assets/Match-q2162X3P.js"
	},
	"/assets/matchContext-DyXrH4xk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8e-YhWGcXqMNvQOQvgCVZpGcwhQ5/4\"",
		"mtime": "2026-08-30T09:49:34.935Z",
		"size": 142,
		"path": "../public/assets/matchContext-DyXrH4xk.js"
	},
	"/assets/minus-DNxMosVN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6b-zcIhacYCDAYJc9Jqxngrt1Fvt/k\"",
		"mtime": "2026-08-30T09:49:34.935Z",
		"size": 107,
		"path": "../public/assets/minus-DNxMosVN.js"
	},
	"/assets/page-context-CTF1BJlg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"108-H5zJJZT2kR9Kyflrq6pSH5w+MHY\"",
		"mtime": "2026-08-30T09:49:34.936Z",
		"size": 264,
		"path": "../public/assets/page-context-CTF1BJlg.js"
	},
	"/assets/pencil-CLdfyRvq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"10a-iq9LW6mqUh9C+SU6+me2wPO3w5g\"",
		"mtime": "2026-08-30T09:49:34.936Z",
		"size": 266,
		"path": "../public/assets/pencil-CLdfyRvq.js"
	},
	"/assets/pin-ByixMp5H.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"150-Cn8iIrKMIBBaDhkhFI/+BdYXW2w\"",
		"mtime": "2026-08-30T09:49:34.937Z",
		"size": 336,
		"path": "../public/assets/pin-ByixMp5H.js"
	},
	"/assets/privacy-BhCfueNU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7a7-NPxCb1pOM6wHUnFtOh+hQbQdhTM\"",
		"mtime": "2026-08-30T09:49:34.937Z",
		"size": 1959,
		"path": "../public/assets/privacy-BhCfueNU.js"
	},
	"/assets/progress-CoZXTA9W.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8fa-rM1oaOPQPBYMFyqzM2++AwTTDoM\"",
		"mtime": "2026-08-30T09:49:34.938Z",
		"size": 2298,
		"path": "../public/assets/progress-CoZXTA9W.js"
	},
	"/assets/RichTextEditor-CHsEwRVo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1d0b-HUahacMFdULd1X4t5jJBIkvah9c\"",
		"mtime": "2026-08-30T09:49:34.728Z",
		"size": 7435,
		"path": "../public/assets/RichTextEditor-CHsEwRVo.js"
	},
	"/assets/root-DLTE-HSj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20-vSYConOtSP6ciwr9zKsPixNwWmc\"",
		"mtime": "2026-08-30T09:49:34.938Z",
		"size": 32,
		"path": "../public/assets/root-DLTE-HSj.js"
	},
	"/assets/routes-C0JWzW4c.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4b6c-STJhKpeEQx2/0ossz3GeHdIjr6U\"",
		"mtime": "2026-08-30T09:49:34.939Z",
		"size": 19308,
		"path": "../public/assets/routes-C0JWzW4c.js"
	},
	"/assets/select-Dn7xblCA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5798-GSdiBx0ucNOcUsfbKdXsKC/BsBQ\"",
		"mtime": "2026-08-30T09:49:34.939Z",
		"size": 22424,
		"path": "../public/assets/select-Dn7xblCA.js"
	},
	"/assets/send-aWwkLFRx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"118-th+RtwWYayswGatktmsh7ncb4jU\"",
		"mtime": "2026-08-30T09:49:34.940Z",
		"size": 280,
		"path": "../public/assets/send-aWwkLFRx.js"
	},
	"/assets/shield-DT168yF3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"106-mFRw1H8SiUyAsEnuoZ/rNEniUds\"",
		"mtime": "2026-08-30T09:49:34.940Z",
		"size": 262,
		"path": "../public/assets/shield-DT168yF3.js"
	},
	"/assets/signup-Aex7lL51.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"52d3-8J5ZvnOKkOfTriVwKl/70GSV+7A\"",
		"mtime": "2026-08-30T09:49:34.941Z",
		"size": 21203,
		"path": "../public/assets/signup-Aex7lL51.js"
	},
	"/assets/star-bVP41mQB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ce-YdmnqYos20/YxC7OTDuCdvlljpA\"",
		"mtime": "2026-08-30T09:49:34.941Z",
		"size": 462,
		"path": "../public/assets/star-bVP41mQB.js"
	},
	"/assets/switch-DTe6rKz9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"10c3-CPc2iF5fbQkVmmFBAtrGbYuFjGM\"",
		"mtime": "2026-08-30T09:49:34.942Z",
		"size": 4291,
		"path": "../public/assets/switch-DTe6rKz9.js"
	},
	"/assets/styles-AvtHHNQE.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"1fe5f-9+N2XxBLRq4TD6rV8eCNduRSfYQ\"",
		"mtime": "2026-08-30T09:49:35.087Z",
		"size": 130655,
		"path": "../public/assets/styles-AvtHHNQE.css"
	},
	"/assets/tabs-BhVG8GQy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"dca-n+INv3MvyK0dLyqfAUbs9F/VRfI\"",
		"mtime": "2026-08-30T09:49:34.942Z",
		"size": 3530,
		"path": "../public/assets/tabs-BhVG8GQy.js"
	},
	"/assets/terms-DDw8lV8U.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9cc-z12OnYmf2zijvfr8V9OeeoqobxU\"",
		"mtime": "2026-08-30T09:49:34.942Z",
		"size": 2508,
		"path": "../public/assets/terms-DDw8lV8U.js"
	},
	"/assets/textarea-cMrfG98R.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"208-tixO4yBim9WSEUCUKfRkC7nuZxU\"",
		"mtime": "2026-08-30T09:49:34.943Z",
		"size": 520,
		"path": "../public/assets/textarea-cMrfG98R.js"
	},
	"/assets/theme-C22zitdi.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"621-K8UrRIFzOQEszPJ+rFsHp5zMQeY\"",
		"mtime": "2026-08-30T09:49:34.943Z",
		"size": 1569,
		"path": "../public/assets/theme-C22zitdi.js"
	},
	"/assets/trash-2-CSFWceiG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13e-eZ+a2ztzpGNq634xx5Ul/S6sMKc\"",
		"mtime": "2026-08-30T09:49:34.944Z",
		"size": 318,
		"path": "../public/assets/trash-2-CSFWceiG.js"
	},
	"/assets/trending-down-BJu1QLwu.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"14e-TdU8qFBNPh6B7kujAb1sEjrl0rM\"",
		"mtime": "2026-08-30T09:49:34.944Z",
		"size": 334,
		"path": "../public/assets/trending-down-BJu1QLwu.js"
	},
	"/assets/trophy-BcxnSBP7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"510-m2osne9woUoY08Q0JPRP4sNg58g\"",
		"mtime": "2026-08-30T09:49:34.945Z",
		"size": 1296,
		"path": "../public/assets/trophy-BcxnSBP7.js"
	},
	"/assets/useMatch-CoY9yTUY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"23d-x1r5Pjz0w8pukBTPSvEywhQ9tQY\"",
		"mtime": "2026-08-30T09:49:34.945Z",
		"size": 573,
		"path": "../public/assets/useMatch-CoY9yTUY.js"
	},
	"/assets/useStore-kDSX9a8I.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"879-BkDm8CPP4qT9nkRfovDZRIgFAKs\"",
		"mtime": "2026-08-30T09:49:34.945Z",
		"size": 2169,
		"path": "../public/assets/useStore-kDSX9a8I.js"
	},
	"/assets/zap-C5EZt46G.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1c8-+wRuAuuEJG9dXX41J4/mG5RUYLg\"",
		"mtime": "2026-08-30T09:49:34.946Z",
		"size": 456,
		"path": "../public/assets/zap-C5EZt46G.js"
	},
	"/mt/DleaSync.mq5": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"2206-dpLjCRB23R08oBo3iWdOS/1sA0A\"",
		"mtime": "2026-08-19T16:29:20.844Z",
		"size": 8710,
		"path": "../public/mt/DleaSync.mq5"
	}
};
//#endregion
//#region #nitro/virtual/public-assets-node
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/static.mjs
var METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
var EncodingMap = {
	gzip: ".gz",
	br: ".br",
	zstd: ".zst"
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	for (const encoding of encodings) for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	return readAsset(id);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_nXFKx4 = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_nXFKx4
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
var globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~middleware"].push(...globalMiddleware);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		middleware.push(...h3App["~middleware"]);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/hooks.mjs
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
//#endregion
//#region #nitro/virtual/tracing
var tracingSrvxPlugins = [];
//#endregion
//#region node_modules/nitro/dist/presets/node/runtime/node-server.mjs
var _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
var port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
var host = process.env.NITRO_HOST || process.env.HOST;
var cert = process.env.NITRO_SSL_CERT;
var key = process.env.NITRO_SSL_KEY;
var nitroApp = useNitroApp();
serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : void 0,
	fetch: nitroApp.fetch,
	plugins: [...tracingSrvxPlugins]
});
trapUnhandledErrors();
var node_server_default = {};
//#endregion
export { node_server_default as default };
