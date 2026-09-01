import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { it as ImagePlus, n as X } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ImageUploader-Di3egqvW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ACCEPT = "image/jpeg,image/png,image/heic,image/heif,.heic,.heif";
var TARGET_BYTES = 204800;
/**
* Screenshot uploader (chart / MT report history).
* Accepts HEIC, JPG, PNG with no client-side size cap; images are
* downscaled to roughly 200KB (this mirrors the server-side optimisation).
*/
async function optimize(file) {
	const dataUrl = await new Promise((resolve, reject) => {
		const fr = new FileReader();
		fr.onload = () => resolve(String(fr.result));
		fr.onerror = () => reject(/* @__PURE__ */ new Error("read failed"));
		fr.readAsDataURL(file);
	});
	if (/heic|heif/i.test(file.type) || /\.heic|\.heif$/i.test(file.name)) return dataUrl;
	try {
		const img = await new Promise((resolve, reject) => {
			const el = new Image();
			el.onload = () => resolve(el);
			el.onerror = () => reject(/* @__PURE__ */ new Error("decode failed"));
			el.src = dataUrl;
		});
		const scale = Math.min(1, 1600 / img.width);
		const canvas = document.createElement("canvas");
		canvas.width = Math.round(img.width * scale);
		canvas.height = Math.round(img.height * scale);
		const ctx = canvas.getContext("2d");
		if (!ctx) return dataUrl;
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		let quality = .85;
		let out = canvas.toDataURL("image/jpeg", quality);
		while (out.length * .75 > TARGET_BYTES && quality > .35) {
			quality -= .1;
			out = canvas.toDataURL("image/jpeg", quality);
		}
		return out;
	} catch {
		return dataUrl;
	}
}
function ImageUploader({ images, onChange, label = "اسکرین‌شات‌ها", hint = "چارت یا Report History — فرمت HEIC، JPG، PNG", compact = false }) {
	const inputRef = (0, import_react.useRef)(null);
	async function handleFiles(files) {
		if (!files || files.length === 0) return;
		const results = [];
		for (const file of Array.from(files)) results.push(await optimize(file));
		onChange([...images, ...results]);
		toast.success(`${results.length} تصویر آپلود شد و به حدود ۲۰۰ کیلوبایت بهینه‌سازی شد`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			!compact && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-sm font-medium",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: inputRef,
				type: "file",
				accept: ACCEPT,
				multiple: true,
				className: "hidden",
				onChange: (e) => {
					handleFiles(e.target.files);
					e.target.value = "";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => inputRef.current?.click(),
				className: "flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/30 px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-secondary/50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "h-5 w-5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm text-muted-foreground",
					children: hint
				})]
			}),
			images.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-2 sm:grid-cols-4",
				children: images.map((src, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "group relative overflow-hidden rounded-lg border border-border",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src,
						alt: `اسکرین‌شات ${i + 1}`,
						loading: "lazy",
						className: "h-24 w-full object-cover"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onChange(images.filter((_, idx) => idx !== i)),
						className: "absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-md bg-background/85 text-destructive opacity-0 transition-opacity group-hover:opacity-100",
						"aria-label": "حذف تصویر",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3.5 w-3.5" })
					})]
				}, i))
			})
		]
	});
}
//#endregion
export { ImageUploader as t };
