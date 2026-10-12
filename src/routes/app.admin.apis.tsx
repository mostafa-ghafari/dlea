import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, MoreVertical, Cpu, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminContext, formatNum } from "@/components/admin-context";
import type { AdminAiModel } from "@/lib/api";

export const Route = createFileRoute("/app/admin/apis")({
  component: AdminApisPage,
});

function AdminApisPage() {
  const { aiApis } = useAdminContext();
  // Which model's detail modal is open (null = closed). The catalogue is small
  // and the panel already holds all of it, so the modal needs no extra fetch.
  const [openModel, setOpenModel] = useState<AdminAiModel | null>(null);
  const models = aiApis?.models ?? [];

  return (
    <div className="space-y-6">
      <div className="card-surface p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">APIهای فعال</h3>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="ml-1 h-4 w-4" />
            افزودن API
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {!aiApis ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              در حال بارگذاری...
            </div>
          ) : aiApis.apis.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              هنوز درخواست AI ثبت نشده.
              {aiApis.gemini_configured && (
                <span className="block mt-1 text-primary">
                  Gemini API متصل است.
                </span>
              )}
              {!aiApis.gemini_configured && (
                <span className="block mt-1 text-amber-500">
                  Gemini API تنظیم نشده.
                </span>
              )}
            </div>
          ) : (
            aiApis.apis.map((a, i) => (
              <div
                key={a.name + i}
                className="flex items-center gap-4 rounded-lg border border-border bg-secondary/40 p-4"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Cpu className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{a.name}</span>
                    {i === 0 && (
                      <Badge className="bg-primary text-primary-foreground">
                        پیش‌فرض
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground tabular">
                    endpoint: {a.endpoint}
                  </div>
                </div>
                <div className="text-sm tabular">
                  {formatNum(a.requests)} درخواست
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
          {aiApis?.gemini_configured === false && (
            <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
              برای فعال‌سازی AI Coach، کلید Gemini API را در فایل backend/.env
              تنظیم کنید.
            </div>
          )}
        </div>
      </div>

      {/* Model catalogue — the same list the coach's dropdown offers, so a
          model can never be advertised here while the coach refuses to run it. */}
      <div className="card-surface p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">مدل‌های مربی هوشمند</h3>
          <span className="text-xs text-muted-foreground">
            {aiApis ? `${formatNum(models.length)} مدل` : "در حال بارگذاری..."}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {aiApis && models.length === 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              مدلی ثبت نشده است.
            </div>
          )}
          {models.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setOpenModel(m)}
              className="flex w-full items-center gap-4 rounded-lg border border-border bg-secondary/40 p-4 text-right transition-colors hover:border-primary/40 hover:bg-secondary/60"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{m.name}</span>
                  {m.active && (
                    <Badge className="bg-primary text-primary-foreground">
                      در حال استفاده
                    </Badge>
                  )}
                  {m.default && !m.active && (
                    <Badge variant="outline">پیش‌فرض رابط کاربر</Badge>
                  )}
                  {!m.configured && (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 text-amber-500"
                    >
                      کلید تنظیم نشده
                    </Badge>
                  )}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {m.desc}
                </div>
              </div>
              <div className="shrink-0 text-left text-sm tabular">
                <div>{formatNum(m.requests)} درخواست</div>
                <div className="text-xs text-muted-foreground">
                  {formatNum(m.tokens_in)} توکن ورودی
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Dialog
        open={openModel !== null}
        onOpenChange={(open) => !open && setOpenModel(null)}
      >
        <DialogContent className="max-w-lg">
          {openModel && (
            <>
              <DialogHeader>
                <DialogTitle>{openModel.name}</DialogTitle>
                <DialogDescription>{openModel.desc}</DialogDescription>
              </DialogHeader>
              <div className="mt-2 space-y-3">
                <ModelRow label="شناسه مدل" value={openModel.id} mono />
                <ModelRow label="سرویس‌دهنده" value={openModel.provider} />
                <ModelRow
                  label="کلید لازم"
                  value={openModel.envVar}
                  mono
                  hint={
                    openModel.configured
                      ? "تنظیم شده است"
                      : "تنظیم نشده — تا وقتی این کلید نباشد مدل اجرا نمی‌شود"
                  }
                />
                <ModelRow
                  label="تعداد درخواست"
                  value={formatNum(openModel.requests)}
                />
                <ModelRow
                  label="توکن ورودی"
                  value={formatNum(openModel.tokens_in)}
                />
                <ModelRow
                  label="توکن خروجی"
                  value={formatNum(openModel.tokens_out)}
                />
                <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                  <span className="text-muted-foreground">وضعیت</span>
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        openModel.configured
                          ? "border-emerald-500/40 text-emerald-500"
                          : "border-amber-500/40 text-amber-500"
                      }
                    >
                      {openModel.configured ? "آماده" : "بدون کلید"}
                    </Badge>
                    {openModel.active && (
                      <Badge className="bg-primary text-primary-foreground">
                        در حال استفاده
                      </Badge>
                    )}
                    {openModel.default && (
                      <Badge variant="outline">پیش‌فرض رابط کاربر</Badge>
                    )}
                  </span>
                </div>
                <a
                  href={openModel.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  مستندات {openModel.provider}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <Button variant="outline">بستن</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModelRow({
  label,
  value,
  mono = false,
  hint,
}: {
  label: string;
  value: string;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <div className="min-w-0">
        <div className="text-muted-foreground">{label}</div>
        {hint && <div className="text-xs text-muted-foreground/80">{hint}</div>}
      </div>
      <span
        className={`shrink-0 ${mono ? "font-mono text-xs" : ""} tabular`}
        style={{ wordBreak: "break-word" }}
      >
        {value}
      </span>
    </div>
  );
}
